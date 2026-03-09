import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { Transaction } from '../../../../domain/transaction';
import {
  TransactionDocument,
  TransactionDocumentType,
} from '../schemas/transaction.schema';
import {
  PaymentProvider,
  TransactionStatus,
  SubscriptionPeriod,
} from '../../../../../enums';

@Injectable()
export class TransactionMapper {
  toDomain(doc: TransactionDocumentType): Transaction {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      planId: doc.planId.toString(),
      subscriptionPeriod: doc.subscriptionPeriod as SubscriptionPeriod,
      amount: doc.amount,
      currency: doc.currency,
      provider: doc.provider as PaymentProvider,
      providerRefId: doc.providerRefId,
      status: doc.status as TransactionStatus,
      description: doc.description ?? null,
      paidAt: doc.paidAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  toDomainArray(docs: TransactionDocumentType[]): Transaction[] {
    return docs.map((doc) => this.toDomain(doc));
  }

  toDocument(data: Partial<Transaction>): Partial<TransactionDocument> {
    const doc: Record<string, unknown> = {};
    if (data.userId !== undefined) doc.userId = new Types.ObjectId(data.userId);
    if (data.planId !== undefined) doc.planId = new Types.ObjectId(data.planId);
    if (data.subscriptionPeriod !== undefined)
      doc.subscriptionPeriod = data.subscriptionPeriod;
    if (data.amount !== undefined) doc.amount = data.amount;
    if (data.currency !== undefined) doc.currency = data.currency;
    if (data.provider !== undefined) doc.provider = data.provider;
    if (data.providerRefId !== undefined)
      doc.providerRefId = data.providerRefId;
    if (data.status !== undefined) doc.status = data.status;
    if (data.description !== undefined) doc.description = data.description;
    if (data.paidAt !== undefined) doc.paidAt = data.paidAt;
    return doc as Partial<TransactionDocument>;
  }
}
