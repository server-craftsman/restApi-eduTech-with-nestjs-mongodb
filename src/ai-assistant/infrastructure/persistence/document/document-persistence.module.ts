import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AiConversationDocument,
  AiConversationSchema,
} from './schemas/ai-conversation.schema';
import {
  AiTrainingDataDocument,
  AiTrainingDataSchema,
} from './schemas/ai-training-data.schema';
import { AiConversationMapper } from './mappers/ai-conversation.mapper';
import { AiTrainingDataMapper } from './mappers/ai-training-data.mapper';
import { AiConversationRepository } from './ai-conversation.repository';
import { AiTrainingDataRepository } from './ai-training-data.repository';
import { AiConversationRepositoryAbstract } from './repositories/ai-conversation.repository.abstract';
import { AiTrainingDataRepositoryAbstract } from './repositories/ai-training-data.repository.abstract';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AiConversationDocument.name, schema: AiConversationSchema },
      { name: AiTrainingDataDocument.name, schema: AiTrainingDataSchema },
    ]),
  ],
  providers: [
    AiConversationMapper,
    AiTrainingDataMapper,
    {
      provide: AiConversationRepositoryAbstract,
      useClass: AiConversationRepository,
    },
    {
      provide: AiTrainingDataRepositoryAbstract,
      useClass: AiTrainingDataRepository,
    },
  ],
  exports: [AiConversationRepositoryAbstract, AiTrainingDataRepositoryAbstract],
})
export class DocumentAiPersistenceModule {}
