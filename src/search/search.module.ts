import { Module } from '@nestjs/common';
import { LessonModule } from '../lessons/lesson.module';
import { MaterialModule } from '../materials/material.module';
import { CourseModule } from '../courses/course.module';
import { ChapterModule } from '../chapters/chapter.module';
import { SubjectModule } from '../subjects/subject.module';
import { DocumentExamPersistenceModule } from '../exams/infrastructure/persistence/document/document-persistence.module';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

@Module({
  imports: [
    LessonModule, // provides LessonRepositoryAbstract
    MaterialModule, // provides MaterialRepositoryAbstract
    CourseModule,
    ChapterModule,
    SubjectModule,
    DocumentExamPersistenceModule,
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
