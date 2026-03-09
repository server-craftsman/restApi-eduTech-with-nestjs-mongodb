import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import {
  UserSubscriptionDocument,
  UserSubscriptionDocumentType,
} from '../schemas/user-subscription.schema';
import { UserSubscriptionRepositoryAbstract } from './user-subscription.repository.abstract';
import { UserSubscriptionMapper } from '../mappers/user-subscription.mapper';
import { UserSubscription } from '../../../../domain/user-subscription';

@Injectable()
export class UserSubscriptionRepository implements UserSubscriptionRepositoryAbstract {
  constructor(
    @InjectModel(UserSubscriptionDocument.name)
    private readonly userSubscriptionModel: Model<UserSubscriptionDocumentType>,
    private readonly mapper: UserSubscriptionMapper,
  ) {}

  async findById(id: string): Promise<UserSubscription | null> {
    const doc = await this.userSubscriptionModel.findById(id);
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findAll(): Promise<UserSubscription[]> {
    const docs = await this.userSubscriptionModel.find();
    return this.mapper.toDomainArray(docs);
  }

  async create(
    data: Omit<UserSubscription, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<UserSubscription> {
    const doc = await this.userSubscriptionModel.create({
      userId: new Types.ObjectId(data.userId),
      planId: new Types.ObjectId(data.planId),
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
    });
    return this.mapper.toDomain(doc);
  }

  async update(
    id: string,
    data: Partial<UserSubscription>,
  ): Promise<UserSubscription | null> {
    const updateData: Record<string, unknown> = {};
    if (data.userId) updateData.userId = new Types.ObjectId(data.userId);
    if (data.planId) updateData.planId = new Types.ObjectId(data.planId);
    if (data.startDate) updateData.startDate = data.startDate;
    if (data.endDate) updateData.endDate = data.endDate;
    if (data.status) updateData.status = data.status;

    const doc = await this.userSubscriptionModel.findByIdAndUpdate(
      id,
      updateData as UpdateQuery<UserSubscriptionDocumentType>,
      {
        new: true,
      },
    );
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<void> {
    await this.userSubscriptionModel.findByIdAndDelete(id);
  }

  async findByUserId(userId: string): Promise<UserSubscription[]> {
    const docs = await this.userSubscriptionModel.find({
      userId: new Types.ObjectId(userId),
    });
    return this.mapper.toDomainArray(docs);
  }

  async findActiveSubscription(
    userId: string,
  ): Promise<UserSubscription | null> {
    const doc = await this.userSubscriptionModel.findOne({
      userId: new Types.ObjectId(userId),
      status: 'ACTIVE',
      endDate: { $gt: new Date() },
    });
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findByUserAndStatus(
    userId: string,
    status: string,
  ): Promise<UserSubscription[]> {
    const docs = await this.userSubscriptionModel.find({
      userId: new Types.ObjectId(userId),
      status,
    });
    return this.mapper.toDomainArray(docs);
  }

  async expireSubscription(id: string): Promise<UserSubscription | null> {
    const doc = await this.userSubscriptionModel.findByIdAndUpdate(
      id,
      { status: 'EXPIRED' },
      { new: true },
    );
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findActiveIgnoreExpiry(
    userId: string,
  ): Promise<UserSubscription | null> {
    // Find any ACTIVE subscription regardless of endDate.
    // This lets the service detect subscriptions that are ACTIVE in DB
    // but have already passed their endDate, so they can be auto-expired.
    const doc = await this.userSubscriptionModel.findOne({
      userId: new Types.ObjectId(userId),
      status: 'ACTIVE',
    });
    return doc ? this.mapper.toDomain(doc) : null;
  }
}
