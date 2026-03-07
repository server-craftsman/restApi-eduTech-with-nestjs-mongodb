import { AiMessageRole } from '../../enums';

/** A single message in a conversation turn. */
export interface AiMessage {
  role: AiMessageRole;
  content: string;
  timestamp: Date;
}

/** Multi-turn AI conversation belonging to a user. */
export interface AiConversation {
  id: string;
  userId: string;
  title: string;
  subject?: string | null;
  messages: AiMessage[];
  /** Total tokens consumed across all turns in this conversation. */
  totalTokensUsed: number;
  /** AI model used for the last response. */
  lastModel?: string | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
