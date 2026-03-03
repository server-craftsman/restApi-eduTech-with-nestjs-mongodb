import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AskQuestionDto } from './dto/ask-question.dto';
import { AiResponseDto } from './dto/ai-response.dto';
import {
  OpenAiChatResponse,
  OpenAiErrorResponse,
} from './interfaces/openai.interface';
import {
  GeminiResponse,
  GeminiErrorResponse,
} from './interfaces/gemini.interface';

type AiProvider = 'gemini' | 'openai';

/** Maximum number of retry attempts on 429 rate-limit responses. */
const MAX_RETRIES = 3;

/** Base delay in ms for exponential backoff (1 s → 2 s → 4 s). */
const BASE_RETRY_DELAY_MS = 1000;

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);

  private readonly OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
  private readonly GEMINI_BASE_URL =
    'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(private readonly configService: ConfigService) {}

  /**
   * Routes the student's question to the configured AI provider and returns
   * a step-by-step solution.
   *
   * Default provider: **Gemini** — free tier, 15 req/min, 1 M tokens/day.
   * Fallback provider: OpenAI (requires billing).
   *
   * Configure via env: AI_PROVIDER=gemini | openai
   */
  async askQuestion(dto: AskQuestionDto): Promise<AiResponseDto> {
    const provider =
      this.configService.get<AiProvider>('ai.provider') ?? 'gemini';

    if (provider === 'openai') {
      return this.askWithOpenAi(dto);
    }
    return this.askWithGemini(dto);
  }

  // ── Gemini (Free tier) ─────────────────────────────────────────────────────

  private async askWithGemini(dto: AskQuestionDto): Promise<AiResponseDto> {
    const apiKey = this.configService.get<string>('ai.geminiApiKey');

    if (!apiKey) {
      throw new BadRequestException(
        'Gemini API key is not configured. ' +
          'Get a free key at https://aistudio.google.com/apikey ' +
          'then add GEMINI_API_KEY=<key> to your .env file.',
      );
    }

    const model =
      this.configService.get<string>('ai.geminiModel') ?? 'gemini-2.0-flash';
    const maxTokens =
      this.configService.get<number>('ai.maxOutputTokens') ?? 2000;
    const isDetailed =
      !dto.explanationLevel || dto.explanationLevel === 'detailed';

    const systemPrompt = this.buildSystemPrompt(dto, isDetailed);
    const url = `${this.GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`;
    const requestBody = JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: dto.question }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: isDetailed ? maxTokens : Math.min(maxTokens, 600),
      },
    });

    const startTime = Date.now();
    let response: globalThis.Response;

    // ── Retry loop with exponential backoff for 429 ──────────────────────────
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody,
        });
      } catch (networkError) {
        this.logger.error('Cannot reach Gemini API', networkError);
        throw new BadRequestException(
          'Unable to connect to the AI service. Please try again later.',
        );
      }

      if (response.status === 429) {
        const retryAfterHeader = response.headers.get('Retry-After');
        const waitMs = retryAfterHeader
          ? parseInt(retryAfterHeader, 10) * 1000
          : BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1); // 1s, 2s, 4s

        if (attempt < MAX_RETRIES) {
          this.logger.warn(
            `[Gemini] Rate-limited (429). Attempt ${attempt}/${MAX_RETRIES}. ` +
              `Retrying in ${waitMs}ms…`,
          );
          await this.sleep(waitMs);
          continue;
        }

        // All retries exhausted — surface a proper 429 to the client
        const errBody = (await response.json()) as GeminiErrorResponse;
        this.logger.error(
          `[Gemini] Rate-limit persists after ${MAX_RETRIES} attempts:`,
          errBody,
        );
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message:
              'The AI service is currently rate-limited. ' +
              'Please wait a moment and try again. ' +
              '(Gemini free tier: 15 requests/min)',
            error: 'Too Many Requests',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      break; // Non-429 response — exit the retry loop
    }

    if (!response!.ok) {
      const errBody = (await response!.json()) as GeminiErrorResponse;
      this.logger.error(`Gemini API error ${response!.status}:`, errBody);
      throw new BadRequestException(
        `Gemini AI error: ${errBody?.error?.message ?? 'Unknown error'}`,
      );
    }

    const data = (await response!.json()) as GeminiResponse;
    const solution =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
      'AI could not generate a solution. Please try again.';

    const tokensUsed = data.usageMetadata?.totalTokenCount ?? 0;
    const processingTimeMs = Date.now() - startTime;

    this.logger.log(
      `[Gemini] Answered: "${dto.question.substring(0, 50)}..." | tokens=${tokensUsed} | ${processingTimeMs}ms`,
    );

    return {
      question: dto.question,
      solution,
      subject: dto.subject,
      tokensUsed,
      model: data.modelVersion ?? model,
      processingTimeMs,
    };
  }

  // ── OpenAI (Paid) ──────────────────────────────────────────────────────────

  private async askWithOpenAi(dto: AskQuestionDto): Promise<AiResponseDto> {
    const apiKey = this.configService.get<string>('ai.openaiApiKey');

    if (!apiKey) {
      throw new BadRequestException(
        'OpenAI API key is not configured. ' +
          'Add OPENAI_API_KEY to your .env file and restart the server.',
      );
    }

    const model =
      this.configService.get<string>('ai.openaiModel') ?? 'gpt-4o-mini';
    const maxTokens =
      this.configService.get<number>('ai.openaiMaxTokens') ?? 2000;
    const isDetailed =
      !dto.explanationLevel || dto.explanationLevel === 'detailed';

    const systemPrompt = this.buildSystemPrompt(dto, isDetailed);
    const startTime = Date.now();
    const requestBody = JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: dto.question },
      ],
      temperature: 0.3,
      max_tokens: isDetailed ? maxTokens : Math.min(maxTokens, 600),
    });

    let response: globalThis.Response;

    // ── Retry loop with exponential backoff for 429 ──────────────────────────
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        response = await fetch(this.OPENAI_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: requestBody,
        });
      } catch (networkError) {
        this.logger.error('Cannot reach OpenAI API', networkError);
        throw new BadRequestException(
          'Unable to connect to the AI service. Please try again later.',
        );
      }

      if (response.status === 429) {
        const retryAfterHeader = response.headers.get('Retry-After');
        const waitMs = retryAfterHeader
          ? parseInt(retryAfterHeader, 10) * 1000
          : BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);

        if (attempt < MAX_RETRIES) {
          this.logger.warn(
            `[OpenAI] Rate-limited (429). Attempt ${attempt}/${MAX_RETRIES}. ` +
              `Retrying in ${waitMs}ms…`,
          );
          await this.sleep(waitMs);
          continue;
        }

        const errBody = (await response.json()) as OpenAiErrorResponse;
        this.logger.error(
          `[OpenAI] Rate-limit persists after ${MAX_RETRIES} attempts:`,
          errBody,
        );
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message:
              'The AI service is currently rate-limited. Please wait and try again.',
            error: 'Too Many Requests',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      break;
    }

    if (!response!.ok) {
      const errBody = (await response!.json()) as OpenAiErrorResponse;
      this.logger.error(`OpenAI API error ${response!.status}:`, errBody);
      throw new BadRequestException(
        `OpenAI error: ${errBody?.error?.message ?? 'Unknown error'}`,
      );
    }

    const data = (await response!.json()) as OpenAiChatResponse;
    const solution =
      data.choices?.[0]?.message?.content?.trim() ??
      'AI could not generate a solution. Please try again.';

    const tokensUsed = data.usage?.total_tokens ?? 0;
    const processingTimeMs = Date.now() - startTime;

    this.logger.log(
      `[OpenAI] Answered: "${dto.question.substring(0, 50)}..." | tokens=${tokensUsed} | ${processingTimeMs}ms`,
    );

    return {
      question: dto.question,
      solution,
      subject: dto.subject,
      tokensUsed,
      model: data.model ?? model,
      processingTimeMs,
    };
  }

  // ── Shared helpers ─────────────────────────────────────────────────────────

  private buildSystemPrompt(dto: AskQuestionDto, isDetailed: boolean): string {
    return [
      'You are an intelligent AI tutor helping students with their school subjects.',
      dto.subject ? `Current subject: ${dto.subject}.` : '',
      isDetailed
        ? 'Explain step by step clearly and thoroughly. Use formulas, concrete examples, and illustrations.'
        : 'Give a concise answer focused on the key result and main formula.',
      'Format your response in Markdown (bold step headings, clear line breaks, math notation where needed).',
      'If the question is unrelated to academic study, politely decline.',
    ]
      .filter(Boolean)
      .join(' ');
  }

  /** Returns a Promise that resolves after `ms` milliseconds. */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
