import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbedContentResponse, GoogleGenAI } from '@google/genai';

/**
 * Default Gemini embedding model.
 * `text-embedding-004` — 768-dimensional vectors, supports 100+ languages.
 *
 * @see https://ai.google.dev/gemini-api/docs/embeddings
 */
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-004';

/** Similarity score below this value → "no match found". */
export const SIMILARITY_THRESHOLD = 0.65;

/** Maximum number of similar results returned from a search. */
export const TOP_K = 3;

/** Maximum retries on 429 rate-limit. */
const MAX_RETRIES = 3;

/** Base delay for exponential backoff (1 s → 2 s → 4 s). */
const BASE_RETRY_DELAY_MS = 1000;

/**
 * EmbeddingService — generates text embeddings via the **Gemini Embedding API**.
 *
 * - Uses your existing `GEMINI_API_KEY` — no extra credentials needed.
 * - Produces 768-dimensional vectors (text-embedding-004).
 * - Includes retry logic with exponential backoff for 429 rate-limits.
 */
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(private readonly configService: ConfigService) {}

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Generate an embedding vector for the given text using Gemini Embedding API.
   *
   * @returns Array of floats (768 dimensions for text-embedding-004).
   */
  async embed(text: string): Promise<number[]> {
    const apiKey = this.configService.get<string>('ai.geminiApiKey');
    if (!apiKey) {
      throw new BadRequestException(
        'GEMINI_API_KEY is not configured. ' +
          'Get a free key at https://aistudio.google.com/apikey ' +
          'then add GEMINI_API_KEY=<key> to your .env file.',
      );
    }

    const model = this.getModelName();
    const gemini = new GoogleGenAI({ apiKey });

    let result: EmbedContentResponse | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        result = await gemini.models.embedContent({
          model,
          contents: text,
        });
        break;
      } catch (error) {
        const isRateLimited = this.isRateLimitError(error);
        const waitMs = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);

        if (isRateLimited && attempt < MAX_RETRIES) {
          this.logger.warn(
            `[Embedding] Rate-limited (429). Attempt ${attempt}/${MAX_RETRIES}. ` +
              `Retrying in ${waitMs}ms…`,
          );
          await this.sleep(waitMs);
          continue;
        }

        if (isRateLimited) {
          throw new HttpException(
            {
              statusCode: HttpStatus.TOO_MANY_REQUESTS,
              message:
                'Gemini Embedding API is rate-limited. Please wait and try again.',
              error: 'Too Many Requests',
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        this.logger.error('Cannot reach Gemini Embedding API', error);
        throw new BadRequestException(
          'Unable to connect to the Gemini Embedding API. Please try again later.',
        );
      }
    }

    const values = result?.embeddings?.[0]?.values ?? null;

    if (!values || values.length === 0) {
      throw new BadRequestException(
        'Gemini Embedding API returned an empty embedding vector.',
      );
    }

    return values;
  }

  /**
   * Compute cosine similarity between two vectors.
   *
   * @returns A value in [-1, 1], where 1 = identical semantic meaning.
   */
  cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dot / denominator;
  }

  /** Name of the currently configured embedding model. */
  getModelName(): string {
    return (
      this.configService.get<string>('ai.embeddingModel') ??
      DEFAULT_EMBEDDING_MODEL
    );
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

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
}
