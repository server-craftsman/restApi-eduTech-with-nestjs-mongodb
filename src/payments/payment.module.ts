import { Module } from '@nestjs/common';
import { TransactionModule } from '../transactions/transaction.module';
import { SubscriptionPlanModule } from '../subscription-plans/subscription-plan.module';
import { UserSubscriptionModule } from '../user-subscriptions/user-subscription.module';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { SePayService } from './services/sepay.service';
import { ProFeatureGuard } from './guards/pro-feature.guard';
import { UsersModule } from '../users/users.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    TransactionModule,
    SubscriptionPlanModule,
    UserSubscriptionModule,
    UsersModule,
    NotificationModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, SePayService, ProFeatureGuard],
  exports: [PaymentService, SePayService, ProFeatureGuard],
})
export class PaymentModule {}
