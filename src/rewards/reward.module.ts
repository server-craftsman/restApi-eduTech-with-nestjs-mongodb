import { Module } from '@nestjs/common';
import { RewardService } from './reward.service';
import { RewardController } from './reward.controller';
import { StudentProfileModule } from '../student-profiles/student-profile.module';

@Module({
  imports: [
    StudentProfileModule, // provides StudentProfileService + StudentProfileRepositoryAbstract
  ],
  controllers: [RewardController],
  providers: [RewardService],
  exports: [RewardService],
})
export class RewardModule {}
