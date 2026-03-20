import { Module } from '@nestjs/common';
import { HomeService } from './home.service';
import { HomeController } from './home.controller';
import { ConfigModule } from '@nestjs/config';
import { PaymentModule } from '../payments';
import { UserSubscriptionModule } from '../user-subscriptions';

@Module({
  imports: [ConfigModule, PaymentModule, UserSubscriptionModule],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
