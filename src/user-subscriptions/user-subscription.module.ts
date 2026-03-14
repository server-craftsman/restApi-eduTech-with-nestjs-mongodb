import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UserSubscriptionDocument,
  UserSubscriptionSchema,
} from './infrastructure/persistence/document/schemas/user-subscription.schema';
import { UserSubscriptionRepository } from './infrastructure/persistence/document/repositories/user-subscription.repository';
import { UserSubscriptionRepositoryAbstract } from './infrastructure/persistence/document/repositories/user-subscription.repository.abstract';
import { UserSubscriptionMapper } from './infrastructure/persistence/document/mappers/user-subscription.mapper';
import { UserSubscriptionService } from './user-subscription.service';
import { UserSubscriptionController } from './user-subscription.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserSubscriptionDocument.name, schema: UserSubscriptionSchema },
    ]),
  ],
  controllers: [UserSubscriptionController],
  providers: [
    UserSubscriptionService,
    {
      provide: UserSubscriptionRepositoryAbstract,
      useClass: UserSubscriptionRepository,
    },
    UserSubscriptionMapper,
  ],
  exports: [UserSubscriptionService, UserSubscriptionRepositoryAbstract],
})
export class UserSubscriptionModule {}
