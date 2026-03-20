import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { CourseModule } from '../courses/course.module';
import { TransactionModule } from '../transactions/transaction.module';
import { UserSubscriptionModule } from '../user-subscriptions/user-subscription.module';
import { NotificationModule } from '../notifications/notification.module';
import { SubjectModule } from '../subjects/subject.module';
import { GradeLevelModule } from '../grade-levels/grade-level.module';
import { ChapterModule } from '../chapters/chapter.module';
import { LessonModule } from '../lessons/lesson.module';
import { MaterialModule } from '../materials/material.module';
import { QuestionModule } from '../questions/question.module';
import { ExamModule } from '../exams/exam.module';

@Module({
  imports: [
    UsersModule,
    CourseModule,
    TransactionModule,
    UserSubscriptionModule,
    NotificationModule,
    SubjectModule,
    GradeLevelModule,
    ChapterModule,
    LessonModule,
    MaterialModule,
    QuestionModule,
    ExamModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
