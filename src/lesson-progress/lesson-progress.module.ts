import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  LessonProgressDocument,
  LessonProgressSchema,
} from './infrastructure/persistence/document/schemas/lesson-progress.schema';
import { LessonProgressRepository } from './infrastructure/persistence/document/repositories/lesson-progress.repository';
import { LessonProgressRepositoryAbstract } from './infrastructure/persistence/document/repositories/lesson-progress.repository.abstract';
import { LessonProgressMapper } from './infrastructure/persistence/document/mappers/lesson-progress.mapper';
import { LessonProgressService } from './lesson-progress.service';
import { LessonProgressController } from './lesson-progress.controller';
import { RewardModule } from '../rewards/reward.module';
import { UserSubscriptionModule } from '../user-subscriptions/user-subscription.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LessonProgressDocument.name, schema: LessonProgressSchema },
    ]),
    RewardModule,
    UserSubscriptionModule,
  ],
  controllers: [LessonProgressController],
  providers: [
    LessonProgressService,
    {
      provide: LessonProgressRepositoryAbstract,
      useClass: LessonProgressRepository,
    },
    LessonProgressMapper,
  ],
  exports: [LessonProgressService, LessonProgressRepositoryAbstract],
})
export class LessonProgressModule {}
