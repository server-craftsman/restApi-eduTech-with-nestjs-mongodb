import { Module } from '@nestjs/common';
import { DocumentPersistenceModule } from './infrastructure/persistence/document';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { ChapterModule } from '../chapters/chapter.module';
import { LessonModule } from '../lessons/lesson.module';
import { QuestionModule } from '../questions/question.module';
import { MaterialModule } from '../materials/material.module';

@Module({
  imports: [
    DocumentPersistenceModule,
    ChapterModule,
    LessonModule,
    QuestionModule,
    MaterialModule,
  ],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService, DocumentPersistenceModule],
})
export class CourseModule {}
