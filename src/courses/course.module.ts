import { Module } from '@nestjs/common';
import { DocumentPersistenceModule } from './infrastructure/persistence/document';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { ChapterModule } from '../chapters/chapter.module';
import { LessonModule } from '../lessons/lesson.module';
import { QuestionModule } from '../questions/question.module';
import { MaterialModule } from '../materials/material.module';
import { StudentProfileModule } from '../student-profiles/student-profile.module';
import { GradeLevelModule } from '../grade-levels/grade-level.module';
import { UsersModule } from '../users/users.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    DocumentPersistenceModule,
    ChapterModule,
    LessonModule,
    QuestionModule,
    MaterialModule,
    StudentProfileModule,
    GradeLevelModule,
    UsersModule,
    NotificationModule,
  ],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService, DocumentPersistenceModule],
})
export class CourseModule {}
