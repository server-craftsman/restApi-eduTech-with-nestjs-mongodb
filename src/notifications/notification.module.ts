import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import {
  NotificationDocument,
  NotificationSchema,
} from './infrastructure/persistence/document/schemas/notification.schema';
import { NotificationRepository } from './infrastructure/persistence/document/repositories/notification.repository';
import { NotificationRepositoryAbstract } from './infrastructure/persistence/document/repositories/notification.repository.abstract';
import { NotificationMapper } from './infrastructure/persistence/document/mappers/notification.mapper';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NovuService } from './services/novu.service';
import { NotificationTriggersService } from './services/notification-triggers.service';
import { NotificationSchedulerService } from './services/notification-scheduler.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationDocument.name, schema: NotificationSchema },
    ]),
    ConfigModule,
    MailModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    {
      provide: NotificationRepositoryAbstract,
      useClass: NotificationRepository,
    },
    NotificationMapper,
    NovuService,
    NotificationTriggersService,
    NotificationSchedulerService,
  ],
  exports: [
    NotificationService,
    NotificationRepositoryAbstract,
    NotificationTriggersService,
    NovuService,
  ],
})
export class NotificationModule {}
