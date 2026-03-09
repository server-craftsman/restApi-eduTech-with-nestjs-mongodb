import { Module } from '@nestjs/common';
import { DocumentExamPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { QuestionModule } from '../questions/question.module';
import { CourseModule } from '../courses/course.module';
import { ChapterModule } from '../chapters/chapter.module';

@Module({
  imports: [
    DocumentExamPersistenceModule,
    QuestionModule, // provides QuestionRepositoryAbstract
    CourseModule, // provides CourseRepositoryAbstract (for courseId validation)
    ChapterModule, // provides ChapterRepositoryAbstract (for chapterId validation)
  ],
  controllers: [ExamController],
  providers: [ExamService],
  exports: [ExamService],
})
export class ExamModule {}
