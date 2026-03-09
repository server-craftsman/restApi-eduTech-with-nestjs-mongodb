import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { LearningPathModule } from '../learning-path/learning-path.module';
import { LessonProgressModule } from '../lesson-progress/lesson-progress.module';
import { StudentProfileModule } from '../student-profiles/student-profile.module';
import { UserSubscriptionModule } from '../user-subscriptions/user-subscription.module';

@Module({
  imports: [
    LearningPathModule,
    LessonProgressModule,
    StudentProfileModule,
    UserSubscriptionModule,
  ],
  controllers: [DashboardController],
})
export class DashboardModule {}
