import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  QuizAttemptDocument,
  QuizAttemptSchema,
} from './infrastructure/persistence/document/schemas/quiz-attempt.schema';
import { QuizAttemptRepository } from './infrastructure/persistence/document/repositories/quiz-attempt.repository';
import { QuizAttemptRepositoryAbstract } from './infrastructure/persistence/document/repositories/quiz-attempt.repository.abstract';
import { QuizAttemptMapper } from './infrastructure/persistence/document/mappers/quiz-attempt.mapper';
import { QuizAttemptService } from './quiz-attempt.service';
import { QuizAttemptController } from './quiz-attempt.controller';
import { QuestionModule } from '../questions/question.module';
import { LessonModule } from '../lessons/lesson.module';
import { WrongAnswerModule } from '../wrong-answers/wrong-answer.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuizAttemptDocument.name, schema: QuizAttemptSchema },
    ]),
    QuestionModule,
    LessonModule,
    WrongAnswerModule,
  ],
  controllers: [QuizAttemptController],
  providers: [
    QuizAttemptService,
    {
      provide: QuizAttemptRepositoryAbstract,
      useClass: QuizAttemptRepository,
    },
    QuizAttemptMapper,
  ],
  exports: [QuizAttemptService, QuizAttemptRepositoryAbstract],
})
export class QuizAttemptModule {}
