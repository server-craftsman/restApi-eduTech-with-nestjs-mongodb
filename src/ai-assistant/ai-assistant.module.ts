import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentAiPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { AiAssistantService } from './ai-assistant.service';
import { AiAssistantController } from './ai-assistant.controller';

@Module({
  imports: [ConfigModule, DocumentAiPersistenceModule],
  controllers: [AiAssistantController],
  providers: [AiAssistantService],
  exports: [AiAssistantService],
})
export class AiAssistantModule {}
