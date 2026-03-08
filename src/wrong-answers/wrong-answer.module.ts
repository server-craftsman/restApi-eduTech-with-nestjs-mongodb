import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  WrongAnswerDocument,
  WrongAnswerSchema,
} from './infrastructure/persistence/document/schemas/wrong-answer.schema';
import { WrongAnswerRepository } from './infrastructure/persistence/document/repositories/wrong-answer.repository';
import { WrongAnswerRepositoryAbstract } from './infrastructure/persistence/document/repositories/wrong-answer.repository.abstract';
import { WrongAnswerMapper } from './infrastructure/persistence/document/mappers/wrong-answer.mapper';
import { WrongAnswerService } from './wrong-answer.service';
import { WrongAnswerController } from './wrong-answer.controller';
import { QuestionModule } from '../questions/question.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WrongAnswerDocument.name, schema: WrongAnswerSchema },
    ]),
    // Needed by WrongAnswerService to fetch Question objects for enrichment and grading
    QuestionModule,
  ],
  controllers: [WrongAnswerController],
  providers: [
    WrongAnswerService,
    WrongAnswerMapper,
    {
      provide: WrongAnswerRepositoryAbstract,
      useClass: WrongAnswerRepository,
    },
  ],
  exports: [WrongAnswerService],
})
export class WrongAnswerModule {}
