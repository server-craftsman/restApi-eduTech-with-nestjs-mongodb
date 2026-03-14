import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TransactionDocument,
  TransactionSchema,
} from './infrastructure/persistence/document/schemas/transaction.schema';
import { TransactionRepository } from './infrastructure/persistence/document/repositories/transaction.repository';
import { TransactionRepositoryAbstract } from './infrastructure/persistence/document/repositories/transaction.repository.abstract';
import { TransactionMapper } from './infrastructure/persistence/document/mappers/transaction.mapper';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TransactionDocument.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    {
      provide: TransactionRepositoryAbstract,
      useClass: TransactionRepository,
    },
    TransactionMapper,
  ],
  exports: [TransactionService, TransactionRepositoryAbstract],
})
export class TransactionModule {}
