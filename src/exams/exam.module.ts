import { Module } from '@nestjs/common';
import { DocumentExamPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { QuestionModule } from '../questions/question.module';

@Module({
  imports: [
    DocumentExamPersistenceModule,
    QuestionModule, // provides QuestionRepositoryAbstract
  ],
  controllers: [ExamController],
  providers: [ExamService],
  exports: [ExamService],
})
export class ExamModule {}
