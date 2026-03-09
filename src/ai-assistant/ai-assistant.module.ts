import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentAiPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { AiAssistantService } from './ai-assistant.service';
import { AiAssistantController } from './ai-assistant.controller';
import { EmbeddingService } from './services/embedding.service';
import { UserSubscriptionModule } from '../user-subscriptions/user-subscription.module';

@Module({
  imports: [ConfigModule, DocumentAiPersistenceModule, UserSubscriptionModule],
  controllers: [AiAssistantController],
  providers: [AiAssistantService, EmbeddingService],
  exports: [AiAssistantService],
})
export class AiAssistantModule {}
