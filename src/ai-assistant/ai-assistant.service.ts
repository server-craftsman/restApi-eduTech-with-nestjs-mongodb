import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AskQuestionDto } from './dto/ask-question.dto';
import { AiResponseDto } from './dto/ai-response.dto';
import { ChatMessageDto } from './dto/chat-message.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { CreateTrainingDataDto } from './dto/create-training-data.dto';
import { ReviewTrainingDataDto } from './dto/review-training-data.dto';
import { QueryTrainingDataDto } from './dto/query-training-data.dto';
import { TrainModelResponseDto } from './dto/train-model-response.dto';
import {
  OpenAiChatResponse,
  OpenAiErrorResponse,
} from './interfaces/openai.interface';
import { GenerateContentResponse, GoogleGenAI } from '@google/genai';
import { AiConversation, AiMessage } from './domain/ai-conversation';
import { AiTrainingData } from './domain/ai-training-data';
import { AiConversationRepositoryAbstract } from './infrastructure/persistence/document/repositories/ai-conversation.repository.abstract';
import { AiTrainingDataRepositoryAbstract } from './infrastructure/persistence/document/repositories/ai-training-data.repository.abstract';
import { AiMessageRole, AiTrainingStatus } from '../enums';
import {
  EmbeddingService,
  SIMILARITY_THRESHOLD,
  TOP_K,
} from './services/embedding.service';
import { UserSubscriptionService } from '../user-subscriptions/user-subscription.service';

type AiProvider = 'gemini' | 'openai';

/** Maximum number of retry attempts on 429 rate-limit responses. */
const MAX_RETRIES = 3;

/** Base delay in ms for exponential backoff (1 s → 2 s → 4 s). */
const BASE_RETRY_DELAY_MS = 1000;

/** Max conversation messages to include in context window. */
const MAX_CONTEXT_MESSAGES = 20;

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);

  private readonly OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

  constructor(
    private readonly configService: ConfigService,
    private readonly conversationRepo: AiConversationRepositoryAbstract,
    private readonly trainingDataRepo: AiTrainingDataRepositoryAbstract,
    private readonly embeddingService: EmbeddingService,
    private readonly userSubscriptionService: UserSubscriptionService,
  ) {}

  /**
   * Routes the student's question to the configured AI provider and returns
   * a step-by-step solution.
   *
   * Default provider: **Gemini** — free tier, 15 req/min, 1 M tokens/day.
   * Fallback provider: OpenAI (requires billing).
   *
   * Configure via env: AI_PROVIDER=gemini | openai
   *
   * **Plan tier enforcement:**
   * - Free users: always receive a concise (brief) answer (max 600 tokens).
   * - Pro users: receive full detailed step-by-step explanation (up to 2000 tokens).
   */
  async askQuestion(
    dto: AskQuestionDto,
    userId: string,
  ): Promise<AiResponseDto> {
    // ── Subscription tier gate ────────────────────────────────────────────────
    const isPro =
      await this.userSubscriptionService.isSubscriptionValid(userId);
    // Free users are always forced into 'brief' mode (concise, max 600 tokens)
    const tieredDto: AskQuestionDto = isPro
      ? dto
      : { ...dto, explanationLevel: 'brief' };
    // ─────────────────────────────────────────────────────────────────────────

    const provider =
      this.configService.get<AiProvider>('ai.provider') ?? 'gemini';

    if (provider === 'openai') {
      return this.askWithOpenAi(tieredDto);
    }
    return this.askWithGemini(tieredDto);
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
    const gemini = new GoogleGenAI({ apiKey });

    const startTime = Date.now();
    let result: GenerateContentResponse | null = null;

    // ── Retry loop with exponential backoff for 429 ──────────────────────────
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        result = await gemini.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: dto.question }] }],
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.3,
            maxOutputTokens: isDetailed ? maxTokens : Math.min(maxTokens, 600),
          },
        });
        break;
      } catch (error) {
        const isRateLimited = this.isRateLimitError(error);
        const waitMs = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1); // 1s, 2s, 4s

        if (isRateLimited && attempt < MAX_RETRIES) {
          this.logger.warn(
            `[Gemini] Rate-limited (429). Attempt ${attempt}/${MAX_RETRIES}. ` +
              `Retrying in ${waitMs}ms…`,
          );
          await this.sleep(waitMs);
          continue;
        }

        if (isRateLimited) {
          this.logger.error(
            `[Gemini] Rate-limit persists after ${MAX_RETRIES} attempts:`,
            error,
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

        this.logger.error('Cannot reach Gemini API', error);
        throw new BadRequestException(
          'Unable to connect to the AI service. Please try again later.',
        );
      }
    }

    const solution =
      result?.text?.trim() ??
      result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
      'AI could not generate a solution. Please try again.';

    const tokensUsed = result?.usageMetadata?.totalTokenCount ?? 0;
    const processingTimeMs = Date.now() - startTime;

    this.logger.log(
      `[Gemini] Answered: "${dto.question.substring(0, 50)}..." | tokens=${tokensUsed} | ${processingTimeMs}ms`,
    );

    return {
      question: dto.question,
      solution,
      subject: dto.subject,
      tokensUsed,
      model: result?.modelVersion ?? model,
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

  /** Best-effort detection for 429 / RESOURCE_EXHAUSTED across SDK error shapes. */
  private isRateLimitError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const e = error as {
      status?: number;
      code?: number;
      message?: string;
      error?: { code?: number; status?: string; message?: string };
    };

    return (
      e.status === 429 ||
      e.code === 429 ||
      e.error?.code === 429 ||
      e.error?.status === 'RESOURCE_EXHAUSTED' ||
      (typeof e.message === 'string' &&
        (e.message.includes('429') ||
          e.message.includes('RATE_LIMIT_EXCEEDED') ||
          e.message.includes('RESOURCE_EXHAUSTED'))) ||
      (typeof e.error?.message === 'string' &&
        (e.error.message.includes('429') ||
          e.error.message.includes('RATE_LIMIT_EXCEEDED') ||
          e.error.message.includes('RESOURCE_EXHAUSTED')))
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MULTI-TURN CHAT (Conversation History)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Send a message to the AI chatbot with full conversation context.
   *
   * - If `conversationId` is provided, appends to existing conversation.
   * - Otherwise creates a new conversation.
   * - Includes up to MAX_CONTEXT_MESSAGES previous messages for context.
   * - Injects approved training data as few-shot examples when available.
   */
  async chat(dto: ChatMessageDto, userId: string): Promise<ChatResponseDto> {
    const provider =
      this.configService.get<AiProvider>('ai.provider') ?? 'gemini';

    // ── Subscription tier gate ────────────────────────────────────────────────
    const isPro =
      await this.userSubscriptionService.isSubscriptionValid(userId);
    // Free users are always forced into 'brief' mode for chat too
    const tieredDto: ChatMessageDto = isPro
      ? dto
      : { ...dto, explanationLevel: 'brief' };
    // ─────────────────────────────────────────────────────────────────────────

    let conversation: AiConversation;

    if (tieredDto.conversationId) {
      const existing = await this.conversationRepo.findById(
        tieredDto.conversationId,
      );
      if (!existing || existing.userId !== userId) {
        throw new NotFoundException('Conversation not found');
      }
      conversation = existing;
    } else {
      // Create new conversation
      conversation = await this.conversationRepo.create({
        userId,
        title: tieredDto.message.substring(0, 80),
        subject: tieredDto.subject ?? null,
        messages: [],
        totalTokensUsed: 0,
      });
    }

    // Build conversation context from previous messages
    const contextMessages = conversation.messages.slice(-MAX_CONTEXT_MESSAGES);

    // Fetch approved training data for few-shot examples
    const trainingExamples = await this.getTrainingExamples(tieredDto.subject);

    const isDetailed =
      !tieredDto.explanationLevel || tieredDto.explanationLevel === 'detailed';
    const systemPrompt = this.buildChatSystemPrompt(
      tieredDto.subject ?? conversation.subject,
      isDetailed,
      trainingExamples,
    );

    const startTime = Date.now();
    let reply: string;
    let tokensUsed: number;
    let modelName: string;

    if (provider === 'openai') {
      const result = await this.chatWithOpenAi(
        systemPrompt,
        contextMessages,
        tieredDto.message,
        isDetailed,
      );
      reply = result.reply;
      tokensUsed = result.tokensUsed;
      modelName = result.model;
    } else {
      const result = await this.chatWithGemini(
        systemPrompt,
        contextMessages,
        tieredDto.message,
        isDetailed,
      );
      reply = result.reply;
      tokensUsed = result.tokensUsed;
      modelName = result.model;
    }

    const processingTimeMs = Date.now() - startTime;

    // Save user message
    const userMessage: AiMessage = {
      role: AiMessageRole.User,
      content: tieredDto.message,
      timestamp: new Date(),
    };
    await this.conversationRepo.pushMessage(
      conversation.id,
      userMessage,
      0,
      modelName,
    );

    // Save assistant reply
    const assistantMessage: AiMessage = {
      role: AiMessageRole.Assistant,
      content: reply,
      timestamp: new Date(),
    };
    await this.conversationRepo.pushMessage(
      conversation.id,
      assistantMessage,
      tokensUsed,
      modelName,
    );

    this.logger.log(
      `[Chat] Conv=${conversation.id} | tokens=${tokensUsed} | ${processingTimeMs}ms`,
    );

    return {
      conversationId: conversation.id,
      reply,
      title: conversation.title,
      tokensUsed,
      model: modelName,
      processingTimeMs,
    };
  }

  /** List conversations for a user. */
  async getConversations(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: AiConversation[]; total: number }> {
    const offset = (page - 1) * limit;
    const [data, total] = await this.conversationRepo.findByUserId(
      userId,
      limit,
      offset,
    );
    return { data, total };
  }

  /** Get a single conversation with full messages. */
  async getConversation(id: string, userId: string): Promise<AiConversation> {
    const conv = await this.conversationRepo.findById(id);
    if (!conv || conv.userId !== userId) {
      throw new NotFoundException('Conversation not found');
    }
    return conv;
  }

  /** Delete a conversation (soft-delete). */
  async deleteConversation(id: string, userId: string): Promise<void> {
    const conv = await this.conversationRepo.findById(id);
    if (!conv || conv.userId !== userId) {
      throw new NotFoundException('Conversation not found');
    }
    await this.conversationRepo.softDelete(id);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TRAINING DATA MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════

  /** Create a new training data entry. */
  async createTrainingData(
    dto: CreateTrainingDataDto,
    createdBy: string,
  ): Promise<AiTrainingData> {
    return this.trainingDataRepo.create({
      question: dto.question,
      answer: dto.answer,
      subject: dto.subject ?? null,
      gradeLevel: dto.gradeLevel ?? null,
      tags: dto.tags ?? [],
      status: AiTrainingStatus.Pending,
      createdBy,
    });
  }

  /** List training data with filters. */
  async getTrainingDataList(
    query: QueryTrainingDataDto,
  ): Promise<{ data: AiTrainingData[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const [data, total] = await this.trainingDataRepo.findAllWithFilters(
      limit,
      offset,
      {
        status: query.status ?? null,
        subject: query.subject ?? null,
      },
    );
    return { data, total };
  }

  /** Review (approve / reject) a training entry. */
  async reviewTrainingData(
    id: string,
    dto: ReviewTrainingDataDto,
    reviewerId: string,
  ): Promise<AiTrainingData> {
    const entry = await this.trainingDataRepo.findById(id);
    if (!entry) throw new NotFoundException('Training data not found');

    const updated = await this.trainingDataRepo.update(id, {
      status: dto.status,
      reviewNote: dto.reviewNote ?? null,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    });
    if (!updated) throw new NotFoundException('Training data not found');
    return updated;
  }

  /** Delete training data (soft-delete). */
  async deleteTrainingData(id: string): Promise<void> {
    const entry = await this.trainingDataRepo.findById(id);
    if (!entry) throw new NotFoundException('Training data not found');
    await this.trainingDataRepo.softDelete(id);
  }

  /** Get training data statistics. */
  async getTrainingDataStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    deleted: number;
  }> {
    return this.trainingDataRepo.getStatistics();
  }

  /**
   * Export all approved training data as JSONL format for OpenAI fine-tuning.
   *
   * Each line is a JSON object with the structure:
   * ```json
   * {"messages": [
   *   {"role": "system", "content": "You are an AI tutor..."},
   *   {"role": "user", "content": "question"},
   *   {"role": "assistant", "content": "answer"}
   * ]}
   * ```
   *
   * Usage:
   * 1. Export → save to `training-data.jsonl`
   * 2. Upload to OpenAI: `openai api files.create -f training-data.jsonl -p fine-tune`
   * 3. Create fine-tune job: `openai api fine_tuning.jobs.create -t file-xxx -m gpt-4o-mini-2024-07-18`
   * 4. Update .env: `OPENAI_MODEL=ft:gpt-4o-mini:org:custom:id`
   */
  async exportTrainingDataJsonl(): Promise<string> {
    const entries = await this.trainingDataRepo.findAllApproved();

    if (entries.length === 0) {
      throw new BadRequestException(
        'No approved training data available for export. ' +
          'Please create and approve training entries first.',
      );
    }

    const lines = entries.map((entry) => {
      const messages = [
        {
          role: 'system',
          content:
            'You are an intelligent AI tutor helping students with their school subjects. ' +
            (entry.subject ? `Current subject: ${entry.subject}. ` : '') +
            'Explain step by step clearly and thoroughly.',
        },
        { role: 'user', content: entry.question },
        { role: 'assistant', content: entry.answer },
      ];
      return JSON.stringify({ messages });
    });

    this.logger.log(
      `[Export] Generated JSONL with ${entries.length} training examples`,
    );

    return lines.join('\n');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VECTOR DATABASE — Train (Gemini Embedding API) & Inference (Cosine Similarity)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Generate embedding vectors for all approved training data that
   * doesn't have one yet, using Gemini's text-embedding-004 API.
   *
   * **Rate Limit Handling**: Gemini free tier allows 15 requests/min.
   * This method adds a 5-second delay between each embedding call
   * to respect the rate limit (15 req/min = 1 per 4 seconds).
   *
   * Call `POST /ai-assistant/training/train` to trigger this.
   */
  async trainModel(): Promise<TrainModelResponseDto> {
    const startTime = Date.now();
    const entries = await this.trainingDataRepo.findAllApproved();

    // Rate limit: 15 req/min = 1 request per 4 seconds
    // Add 5-second delay to be safe (allows ~12 req/min)
    const DELAY_MS = 5000;

    let embedded = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // Already has embedding — skip (no API call, no delay needed)
      if (entry.questionEmbedding && entry.questionEmbedding.length > 0) {
        skipped++;
        this.logger.log(
          `[Train] ⏭️  Skipped (${i + 1}/${entries.length}): "${entry.question.substring(0, 50)}…"`,
        );
        continue;
      }

      try {
        const embedding = await this.embeddingService.embed(entry.question);
        await this.trainingDataRepo.updateEmbedding(entry.id, embedding);
        embedded++;
        this.logger.log(
          `[Train] ✅ Embedded (${i + 1}/${entries.length}): "${entry.question.substring(0, 50)}…"`,
        );

        // Add delay AFTER successful embedding (but not after the last one)
        if (i < entries.length - 1) {
          this.logger.debug(
            `[Train] ⏳ Waiting ${DELAY_MS}ms to respect rate limit...`,
          );
          await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
        }
      } catch (error) {
        errors++;
        this.logger.error(
          `[Train] ❌ Failed (${i + 1}/${entries.length}): "${entry.question.substring(0, 50)}…"`,
          error instanceof Error ? error.message : error,
        );
        // Also add delay after errors to avoid hammering the API
        if (i < entries.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
        }
      }
    }

    const processingTimeMs = Date.now() - startTime;

    this.logger.log(
      `[Train] Complete — total=${entries.length} embedded=${embedded} ` +
        `skipped=${skipped} errors=${errors} in ${processingTimeMs}ms`,
    );

    return {
      total: entries.length,
      embedded,
      skipped,
      errors,
      model: this.embeddingService.getModelName(),
      processingTimeMs,
    };
  }

  /**
   * Core semantic search: embed the query → compare against all training
   * vectors → return the best answer(s) above the similarity threshold.
   */
  private async searchTrainingData(
    query: string,
    subject?: string | null,
  ): Promise<{ reply: string; matchCount: number; bestScore: number }> {
    const threshold =
      this.configService.get<number>('ai.similarityThreshold') ??
      SIMILARITY_THRESHOLD;

    // Fetch all vectorised training data (optionally scoped to subject)
    const trainingData =
      await this.trainingDataRepo.findAllWithEmbeddings(subject);

    if (trainingData.length === 0) {
      return {
        reply:
          '⚠️ Chưa có dữ liệu training được phê duyệt và vector hóa.\n\n' +
          'Vui lòng:\n' +
          '1. Thêm training data (`POST /ai-assistant/training`)\n' +
          '2. Phê duyệt (`PATCH /ai-assistant/training/:id/review`)\n' +
          '3. Chạy training (`POST /ai-assistant/training/train`)',
        matchCount: 0,
        bestScore: 0,
      };
    }

    // Embed the user's question
    const queryEmbedding = await this.embeddingService.embed(query);

    // Compute cosine similarity for every training entry
    const scored = trainingData
      .filter((e) => e.questionEmbedding && e.questionEmbedding.length > 0)
      .map((entry) => ({
        entry,
        similarity: this.embeddingService.cosineSimilarity(
          queryEmbedding,
          entry.questionEmbedding!,
        ),
      }))
      .sort((a, b) => b.similarity - a.similarity);

    // Filter matches above threshold
    const topMatches = scored
      .filter((s) => s.similarity >= threshold)
      .slice(0, TOP_K);

    if (topMatches.length === 0) {
      const bestScore = scored.length > 0 ? scored[0].similarity : 0;
      return {
        reply:
          'Xin lỗi, tôi không tìm thấy câu trả lời phù hợp cho câu hỏi này ' +
          'trong dữ liệu training hiện tại.\n\n' +
          `> Độ tương đồng cao nhất: **${(bestScore * 100).toFixed(1)}%** ` +
          `(ngưỡng yêu cầu: ${(threshold * 100).toFixed(0)}%)\n\n` +
          'Vui lòng thử đặt câu hỏi khác hoặc liên hệ giáo viên để được hỗ trợ.',
        matchCount: 0,
        bestScore,
      };
    }

    // Build the response from matched entries
    let reply: string;
    if (topMatches.length === 1) {
      reply = topMatches[0].entry.answer;
    } else {
      reply = topMatches
        .map((m, i) => {
          const pct = (m.similarity * 100).toFixed(1);
          return `### Kết quả ${i + 1} (${pct}% phù hợp)\n\n${m.entry.answer}`;
        })
        .join('\n\n---\n\n');
    }

    return {
      reply,
      matchCount: topMatches.length,
      bestScore: topMatches[0].similarity,
    };
  }

  // ── Chat helpers (provider-specific) ───────────────────────────────────────

  private async chatWithGemini(
    systemPrompt: string,
    history: AiMessage[],
    newMessage: string,
    isDetailed: boolean,
  ): Promise<{ reply: string; tokensUsed: number; model: string }> {
    const apiKey = this.configService.get<string>('ai.geminiApiKey');
    if (!apiKey) {
      throw new BadRequestException(
        'Gemini API key is not configured. Add GEMINI_API_KEY to .env.',
      );
    }

    const model =
      this.configService.get<string>('ai.geminiModel') ?? 'gemini-2.0-flash';
    const maxTokens =
      this.configService.get<number>('ai.maxOutputTokens') ?? 2000;

    // Build multi-turn contents for Gemini
    const contents = [
      ...history.map((m) => ({
        role: m.role === AiMessageRole.Assistant ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      { role: 'user', parts: [{ text: newMessage }] },
    ];

    const gemini = new GoogleGenAI({ apiKey });

    let result: GenerateContentResponse | null = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        result = await gemini.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.3,
            maxOutputTokens: isDetailed ? maxTokens : Math.min(maxTokens, 600),
          },
        });
        break;
      } catch (error) {
        const isRateLimited = this.isRateLimitError(error);
        const waitMs = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);

        if (isRateLimited && attempt < MAX_RETRIES) {
          await this.sleep(waitMs);
          continue;
        }

        if (isRateLimited) {
          throw new HttpException(
            'AI service is rate-limited. Please wait and try again.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        throw new BadRequestException('Unable to connect to the AI service.');
      }
    }

    const reply =
      result?.text?.trim() ??
      result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
      'AI could not generate a response.';
    const tokensUsed = result?.usageMetadata?.totalTokenCount ?? 0;

    return { reply, tokensUsed, model: result?.modelVersion ?? model };
  }

  private async chatWithOpenAi(
    systemPrompt: string,
    history: AiMessage[],
    newMessage: string,
    isDetailed: boolean,
  ): Promise<{ reply: string; tokensUsed: number; model: string }> {
    const apiKey = this.configService.get<string>('ai.openaiApiKey');
    if (!apiKey) {
      throw new BadRequestException(
        'OpenAI API key is not configured. Add OPENAI_API_KEY to .env.',
      );
    }

    const model =
      this.configService.get<string>('ai.openaiModel') ?? 'gpt-4o-mini';
    const maxTokens =
      this.configService.get<number>('ai.openaiMaxTokens') ?? 2000;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({
        role: m.role === AiMessageRole.System ? 'system' : m.role,
        content: m.content,
      })),
      { role: 'user', content: newMessage },
    ];

    const requestBody = JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: isDetailed ? maxTokens : Math.min(maxTokens, 600),
    });

    let response: globalThis.Response;
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
      } catch {
        throw new BadRequestException('Unable to connect to the AI service.');
      }

      if (response.status === 429) {
        const waitMs = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        if (attempt < MAX_RETRIES) {
          await this.sleep(waitMs);
          continue;
        }
        throw new HttpException(
          'AI service is rate-limited. Please wait and try again.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      break;
    }

    if (!response!.ok) {
      const errBody = (await response!.json()) as OpenAiErrorResponse;
      throw new BadRequestException(
        `OpenAI error: ${errBody?.error?.message ?? 'Unknown error'}`,
      );
    }

    const data = (await response!.json()) as OpenAiChatResponse;
    const reply =
      data.choices?.[0]?.message?.content?.trim() ??
      'AI could not generate a response.';
    const tokensUsed = data.usage?.total_tokens ?? 0;

    return { reply, tokensUsed, model: data.model ?? model };
  }

  /**
   * Build system prompt for multi-turn chat, injecting few-shot training
   * examples from approved training data.
   */
  private buildChatSystemPrompt(
    subject: string | null | undefined,
    isDetailed: boolean,
    trainingExamples: AiTrainingData[],
  ): string {
    const parts = [
      'You are an intelligent AI tutor helping students with their school subjects.',
      subject ? `Current subject: ${subject}.` : '',
      isDetailed
        ? 'Explain step by step clearly and thoroughly. Use formulas, concrete examples, and illustrations.'
        : 'Give a concise answer focused on the key result and main formula.',
      'Format your response in Markdown.',
      'If the question is unrelated to academic study, politely decline.',
    ];

    // Inject few-shot examples from training data
    if (trainingExamples.length > 0) {
      parts.push('\n--- Reference Examples ---');
      for (const ex of trainingExamples.slice(0, 5)) {
        parts.push(`Q: ${ex.question}\nA: ${ex.answer}\n`);
      }
      parts.push('--- End Examples ---\n');
    }

    return parts.filter(Boolean).join(' ');
  }

  /** Get a few relevant training examples for few-shot injection. */
  private async getTrainingExamples(
    subject?: string | null,
  ): Promise<AiTrainingData[]> {
    try {
      const [data] = await this.trainingDataRepo.findAllWithFilters(5, 0, {
        status: AiTrainingStatus.Approved,
        subject: subject ?? null,
      });
      return data;
    } catch {
      return [];
    }
  }
}
