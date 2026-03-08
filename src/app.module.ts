import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { configuration, envValidationSchema } from './config';
import { DatabaseModule } from './database';
import { StorageModule } from './storage';
import { CoreModule } from './core';
import { HomeModule } from './home';
import { AuthModule } from './auth';
import { AuthGoogleModule } from './auth-google';
import { AuthFacebookModule } from './auth-facebook';
import { MailModule } from './mail';
import { MailerModule } from './mailer';
import { UsersModule } from './users';
import { SessionModule } from './sessions';
import { StudentProfileModule } from './student-profiles';
import { TeacherProfileModule } from './teacher-profiles';
import { ParentProfileModule } from './parent-profiles';
import { ParentStudentLinkModule } from './parent-student-links';
import { SubjectModule } from './subjects';
import { GradeLevelModule } from './grade-levels';
import { CourseModule } from './courses';
import { ChapterModule } from './chapters';
import { LessonModule } from './lessons';
import { MaterialModule } from './materials';
import { QuestionModule } from './questions';
import { LessonProgressModule } from './lesson-progress';
import { QuizAttemptModule } from './quiz-attempts';
import { WrongAnswerModule } from './wrong-answers/wrong-answer.module';
import { SubscriptionPlanModule } from './subscription-plans';
import { UserSubscriptionModule } from './user-subscriptions';
import { TransactionModule } from './transactions';
import { NotificationModule } from './notifications';
import { LearningPathModule } from './learning-path';
import { SequentialLearningModule } from './sequential-learning';
import { DashboardModule } from './dashboard';
import { UploadsModule } from './uploads';
import { SearchModule } from './search/search.module';
import { AiAssistantModule } from './ai-assistant/ai-assistant.module';
import { ExamModule } from './exams/exam.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    ScheduleModule.forRoot(),
    CoreModule,
    DatabaseModule,
    StorageModule,
    MailerModule,
    AuthModule,
    AuthGoogleModule,
    AuthFacebookModule,
    MailModule,
    HomeModule,
    UsersModule,
    SessionModule,
    StudentProfileModule,
    TeacherProfileModule,
    ParentProfileModule,
    ParentStudentLinkModule,
    SubjectModule,
    GradeLevelModule,
    CourseModule,
    ChapterModule,
    LessonModule,
    MaterialModule,
    QuestionModule,
    LessonProgressModule,
    QuizAttemptModule,
    WrongAnswerModule,
    SubscriptionPlanModule,
    UserSubscriptionModule,
    TransactionModule,
    NotificationModule,
    LearningPathModule,
    SequentialLearningModule,
    DashboardModule,
    UploadsModule,
    SearchModule,
    AiAssistantModule,
    ExamModule,
  ],
})
export class AppModule {}
