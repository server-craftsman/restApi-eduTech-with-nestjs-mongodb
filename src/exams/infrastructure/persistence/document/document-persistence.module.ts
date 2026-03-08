import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExamDocument, ExamSchema } from './schemas/exam.schema';
import {
  ExamAttemptDocument,
  ExamAttemptSchema,
} from './schemas/exam-attempt.schema';
import { ExamMapper } from './mappers/exam.mapper';
import { ExamAttemptMapper } from './mappers/exam-attempt.mapper';
import { ExamRepository } from './exam.repository';
import { ExamAttemptRepository } from './exam-attempt.repository';
import { ExamRepositoryAbstract } from './repositories/exam.repository.abstract';
import { ExamAttemptRepositoryAbstract } from './repositories/exam-attempt.repository.abstract';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExamDocument.name, schema: ExamSchema },
      { name: ExamAttemptDocument.name, schema: ExamAttemptSchema },
    ]),
  ],
  providers: [
    ExamMapper,
    ExamAttemptMapper,
    {
      provide: ExamRepositoryAbstract,
      useClass: ExamRepository,
    },
    {
      provide: ExamAttemptRepositoryAbstract,
      useClass: ExamAttemptRepository,
    },
  ],
  exports: [ExamRepositoryAbstract, ExamAttemptRepositoryAbstract],
})
export class DocumentExamPersistenceModule {}
