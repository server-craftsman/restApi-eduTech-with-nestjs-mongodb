import { AiTrainingData } from '../../../../domain/ai-training-data';
import { AiTrainingStatus } from '../../../../../enums';

export abstract class AiTrainingDataRepositoryAbstract {
  abstract findById(id: string): Promise<AiTrainingData | null>;
  abstract findAllWithFilters(
    limit: number,
    offset: number,
    filters?: {
      status?: AiTrainingStatus | null;
      subject?: string | null;
      isDeleted?: boolean | null;
    },
  ): Promise<[AiTrainingData[], number]>;
  abstract create(data: Partial<AiTrainingData>): Promise<AiTrainingData>;
  abstract update(
    id: string,
    data: Partial<AiTrainingData>,
  ): Promise<AiTrainingData | null>;
  abstract softDelete(id: string): Promise<void>;
  /** Return all approved & non-deleted training entries for fine-tuning export. */
  abstract findAllApproved(): Promise<AiTrainingData[]>;

  /**
   * Return all approved entries that already have an embedding vector.
   * Optionally filter by subject (case-insensitive partial match).
   */
  abstract findAllWithEmbeddings(
    subject?: string | null,
  ): Promise<AiTrainingData[]>;

  /**
   * Store a pre-computed embedding vector on a training entry.
   * Used by the `trainModel()` bulk-vectorisation flow.
   */
  abstract updateEmbedding(id: string, embedding: number[]): Promise<void>;

  abstract getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    deleted: number;
  }>;
}
