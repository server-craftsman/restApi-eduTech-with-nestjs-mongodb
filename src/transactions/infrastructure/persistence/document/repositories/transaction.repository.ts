import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  TransactionDocument,
  TransactionDocumentType,
} from '../schemas/transaction.schema';
import { TransactionRepositoryAbstract } from './transaction.repository.abstract';
import { TransactionMapper } from '../mappers/transaction.mapper';
import { Transaction } from '../../../../domain/transaction';

@Injectable()
export class TransactionRepository implements TransactionRepositoryAbstract {
  constructor(
    @InjectModel(TransactionDocument.name)
    private readonly transactionModel: Model<TransactionDocumentType>,
    private readonly mapper: TransactionMapper,
  ) {}

  async findById(id: string): Promise<Transaction | null> {
    const doc = await this.transactionModel.findById(id);
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findAll(): Promise<Transaction[]> {
    const docs = await this.transactionModel.find();
    return this.mapper.toDomainArray(docs);
  }

  async create(
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Transaction> {
    const doc = await this.transactionModel.create({
      userId: new Types.ObjectId(data.userId),
      planId: new Types.ObjectId(data.planId),
      subscriptionPeriod: data.subscriptionPeriod,
      amount: data.amount,
      currency: data.currency ?? 'VND',
      provider: data.provider,
      providerRefId: data.providerRefId,
      status: data.status,
      description: data.description ?? null,
      paidAt: data.paidAt ?? null,
    });
    return this.mapper.toDomain(doc);
  }

  async update(
    id: string,
    data: Partial<Transaction>,
  ): Promise<Transaction | null> {
    const updateData = this.mapper.toDocument(data);
    const doc = await this.transactionModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    );
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<void> {
    await this.transactionModel.findByIdAndDelete(id);
  }

  async findByUserId(userId: string): Promise<Transaction[]> {
    const docs = await this.transactionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 });
    return this.mapper.toDomainArray(docs);
  }

  async findByStatus(status: string): Promise<Transaction[]> {
    const docs = await this.transactionModel.find({ status });
    return this.mapper.toDomainArray(docs);
  }

  async findByProviderRefId(
    providerRefId: string,
  ): Promise<Transaction | null> {
    const doc = await this.transactionModel.findOne({ providerRefId });
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async updateStatus(id: string, status: string): Promise<Transaction | null> {
    const doc = await this.transactionModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );
    return doc ? this.mapper.toDomain(doc) : null;
  }
}
