import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SubscriptionPlanDocument,
  SubscriptionPlanSchema,
} from './infrastructure/persistence/document/schemas/subscription-plan.schema';
import { SubscriptionPlanRepository } from './infrastructure/persistence/document/repositories/subscription-plan.repository';
import { SubscriptionPlanRepositoryAbstract } from './infrastructure/persistence/document/repositories/subscription-plan.repository.abstract';
import { SubscriptionPlanMapper } from './infrastructure/persistence/document/mappers/subscription-plan.mapper';
import { SubscriptionPlanService } from './subscription-plan.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubscriptionPlanDocument.name, schema: SubscriptionPlanSchema },
    ]),
  ],
  providers: [
    SubscriptionPlanService,
    {
      provide: SubscriptionPlanRepositoryAbstract,
      useClass: SubscriptionPlanRepository,
    },
    SubscriptionPlanMapper,
  ],
  exports: [SubscriptionPlanService, SubscriptionPlanRepositoryAbstract],
})
export class SubscriptionPlanModule {}
