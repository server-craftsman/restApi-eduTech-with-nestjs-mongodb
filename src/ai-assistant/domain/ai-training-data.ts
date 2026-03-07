import { AiTrainingStatus } from '../../enums';

/**
 * A curated Q&A pair used to fine-tune the AI model.
 *
 * Flow:
 * 1. Teacher/Admin creates a training entry (status = Pending)
 * 2. Admin reviews & approves → status = Approved
 * 3. Approved entries are exported to JSONL for OpenAI fine-tuning
 *    or fed as few-shot examples in Gemini prompts.
 */
export interface AiTrainingData {
  id: string;
  /** The question / user prompt. */
  question: string;
  /** The ideal answer / assistant response. */
  answer: string;
  /** Academic subject for categorization. */
  subject?: string | null;
  /** Grade level context. */
  gradeLevel?: string | null;
  /** Tags for searchability. */
  tags: string[];
  /** Approval workflow status. */
  status: AiTrainingStatus;
  /** Who created this training pair. */
  createdBy: string;
  /** Who reviewed / approved / rejected. */
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  reviewNote?: string | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
