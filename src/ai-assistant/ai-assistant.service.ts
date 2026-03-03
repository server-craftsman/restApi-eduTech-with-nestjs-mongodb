import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);

  private readonly OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
  private readonly GEMINI_BASE_URL =
    'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(private readonly configService: ConfigService) {}

  /**
   * Gửi câu hỏi của học sinh tới AI provider và trả về lời giải.
   *
   * Provider mặc định: **Gemini** — miễn phí, 15 req/phút, 1M token/ngày.
   * Provider dự phòng: OpenAI (cần billing).
   *
   * Cấu hình qua env: AI_PROVIDER=gemini | openai
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
        'Gemini API key chưa được cấu hình. ' +
          'Lấy key miễn phí tại https://aistudio.google.com/apikey ' +
          'rồi thêm GEMINI_API_KEY=<key> vào file .env',
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

    const startTime = Date.now();
    let response: globalThis.Response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: dto.question }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: isDetailed ? maxTokens : Math.min(maxTokens, 600),
          },
        }),
      });
    } catch (networkError) {
      this.logger.error('Không thể kết nối tới Gemini API', networkError);
      throw new BadRequestException(
        'Không thể kết nối tới dịch vụ AI. Vui lòng thử lại sau.',
      );
    }

    if (!response.ok) {
      const errBody = (await response.json()) as GeminiErrorResponse;
      this.logger.error(`Gemini API error ${response.status}:`, errBody);
      throw new BadRequestException(
        `Lỗi từ Gemini AI: ${errBody?.error?.message ?? 'Không xác định'}`,
      );
    }

    const data = (await response.json()) as GeminiResponse;
    const solution =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
      'AI không thể tạo lời giải. Vui lòng thử lại.';

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
        'OpenAI API key chưa được cấu hình. ' +
          'Vui lòng thêm OPENAI_API_KEY vào file .env và khởi động lại server.',
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
    let response: globalThis.Response;

    try {
      response = await fetch(this.OPENAI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: dto.question },
          ],
          temperature: 0.3,
          max_tokens: isDetailed ? maxTokens : Math.min(maxTokens, 600),
        }),
      });
    } catch (networkError) {
      this.logger.error('Không thể kết nối tới OpenAI API', networkError);
      throw new BadRequestException(
        'Không thể kết nối tới dịch vụ AI. Vui lòng thử lại sau.',
      );
    }

    if (!response.ok) {
      const errBody = (await response.json()) as OpenAiErrorResponse;
      this.logger.error(`OpenAI API error ${response.status}:`, errBody);
      throw new BadRequestException(
        `Lỗi từ OpenAI: ${errBody?.error?.message ?? 'Không xác định'}`,
      );
    }

    const data = (await response.json()) as OpenAiChatResponse;
    const solution =
      data.choices?.[0]?.message?.content?.trim() ??
      'AI không thể tạo lời giải. Vui lòng thử lại.';

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
      'Bạn là gia sư AI thông minh hỗ trợ học sinh Việt Nam học các môn học phổ thông.',
      dto.subject ? `Môn học hiện tại: ${dto.subject}.` : '',
      isDetailed
        ? 'Hãy giải thích từng bước một cách rõ ràng, đầy đủ. Sử dụng công thức, ví dụ cụ thể và minh họa.'
        : 'Hãy trả lời ngắn gọn, súc tích, tập trung vào đáp án và công thức chính.',
      'Trình bày bằng tiếng Việt, sử dụng định dạng Markdown (in đậm tiêu đề bước, xuống dòng rõ ràng, ký hiệu toán học nếu cần).',
      'Nếu nội dung không liên quan đến học tập, hãy từ chối lịch sự.',
    ]
      .filter(Boolean)
      .join(' ');
  }
}
