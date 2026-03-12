import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ParentStudentLinkDocument,
  ParentStudentLinkSchema,
} from './infrastructure/persistence/document/schemas/parent-student-link.schema';
import { ParentStudentLinkRepository } from './infrastructure/persistence/document/repositories/parent-student-link.repository';
import { ParentStudentLinkRepositoryAbstract } from './infrastructure/persistence/document/repositories/parent-student-link.repository.abstract';
import { ParentStudentLinkMapper } from './infrastructure/persistence/document/mappers/parent-student-link.mapper';
import { ParentStudentLinkService } from './parent-student-link.service';
import { ParentStudentLinkController } from './parent-student-link.controller';
import { StudentProfileModule } from '../student-profiles/student-profile.module';
import { ParentProfileModule } from '../parent-profiles/parent-profile.module';
import { LessonProgressModule } from '../lesson-progress/lesson-progress.module';
import { QuizAttemptModule } from '../quiz-attempts/quiz-attempt.module';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';
import { SmsService, ZaloService } from './services/messaging.service';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ParentStudentLinkDocument.name, schema: ParentStudentLinkSchema },
    ]),
    StudentProfileModule,
    ParentProfileModule,
    LessonProgressModule,
    QuizAttemptModule,
    MailModule,
    UsersModule,
    NotificationModule,
  ],
  controllers: [ParentStudentLinkController],
  providers: [
    ParentStudentLinkService,
    {
      provide: ParentStudentLinkRepositoryAbstract,
      useClass: ParentStudentLinkRepository,
    },
    ParentStudentLinkMapper,
    SmsService,
    ZaloService,
  ],
  exports: [ParentStudentLinkService, ParentStudentLinkRepositoryAbstract],
})
export class ParentStudentLinkModule {}
