import { Module } from '@nestjs/common';
import { RewardService } from './reward.service';
import { RewardController } from './reward.controller';
import { StudentProfileModule } from '../student-profiles/student-profile.module';
import { UsersModule } from '../users/users.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    StudentProfileModule, // provides StudentProfileService + StudentProfileRepositoryAbstract
    UsersModule,
    NotificationModule,
  ],
  controllers: [RewardController],
  providers: [RewardService],
  exports: [RewardService],
})
export class RewardModule {}
