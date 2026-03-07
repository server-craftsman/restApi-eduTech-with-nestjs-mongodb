import { AiConversation, AiMessage } from '../../../../domain/ai-conversation';

export abstract class AiConversationRepositoryAbstract {
  abstract findById(id: string): Promise<AiConversation | null>;
  abstract findByUserId(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<[AiConversation[], number]>;
  abstract create(conv: Partial<AiConversation>): Promise<AiConversation>;
  abstract pushMessage(
    id: string,
    message: AiMessage,
    tokensUsed: number,
    model: string,
  ): Promise<AiConversation | null>;
  abstract updateTitle(
    id: string,
    title: string,
  ): Promise<AiConversation | null>;
  abstract softDelete(id: string): Promise<void>;
}
