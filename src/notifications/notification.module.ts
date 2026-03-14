import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NovuService } from './services/novu.service';
import { NotificationTriggersService } from './services/notification-triggers.service';
import { NotificationSchedulerService } from './services/notification-scheduler.service';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ConfigModule, MailModule, UsersModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NovuService,
    NotificationTriggersService,
    NotificationSchedulerService,
  ],
  exports: [NotificationService, NotificationTriggersService, NovuService],
})
export class NotificationModule {}
