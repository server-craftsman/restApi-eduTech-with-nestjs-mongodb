import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { CourseModule } from '../courses/course.module';
import { TransactionModule } from '../transactions/transaction.module';
import { UserSubscriptionModule } from '../user-subscriptions/user-subscription.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    UsersModule,
    CourseModule,
    TransactionModule,
    UserSubscriptionModule,
    NotificationModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
