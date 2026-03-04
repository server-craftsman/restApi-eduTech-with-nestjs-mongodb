import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import {
  ParentProfileDocument,
  ParentProfileDocumentType,
} from '../schemas/parent-profile.schema';
import { ParentProfileRepositoryAbstract } from './parent-profile.repository.abstract';
import { ParentProfileMapper } from '../mappers/parent-profile.mapper';
import { ParentProfile } from '../../../../domain/parent-profile';

@Injectable()
export class ParentProfileRepository implements ParentProfileRepositoryAbstract {
  constructor(
    @InjectModel(ParentProfileDocument.name)
    private readonly parentProfileModel: Model<ParentProfileDocumentType>,
    private readonly mapper: ParentProfileMapper,
  ) {}

  async findById(id: string): Promise<ParentProfile | null> {
    const doc = await this.parentProfileModel.findById(id);
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findAll(): Promise<ParentProfile[]> {
    const docs = await this.parentProfileModel.find();
    return this.mapper.toDomainArray(docs);
  }

  async create(
    data: Omit<ParentProfile, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ParentProfile> {
    const doc = await this.parentProfileModel.create({
      userId: new Types.ObjectId(data.userId),
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      relationship: data.relationship ?? null,
      nationalIdNumber: data.nationalIdNumber ?? null,
      nationalIdImageUrl: data.nationalIdImageUrl ?? null,
    });
    return this.mapper.toDomain(doc);
  }

  async update(
    id: string,
    data: Partial<ParentProfile>,
  ): Promise<ParentProfile | null> {
    const updateData: Record<string, unknown> = {};
    if (data.userId) updateData.userId = new Types.ObjectId(data.userId);
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.phoneNumber !== undefined)
      updateData.phoneNumber = data.phoneNumber;
    if (data.relationship !== undefined)
      updateData.relationship = data.relationship;
    if (data.nationalIdNumber !== undefined)
      updateData.nationalIdNumber = data.nationalIdNumber;
    if (data.nationalIdImageUrl !== undefined)
      updateData.nationalIdImageUrl = data.nationalIdImageUrl;

    const doc = await this.parentProfileModel.findByIdAndUpdate(
      id,
      updateData as UpdateQuery<ParentProfileDocumentType>,
      {
        new: true,
      },
    );
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<void> {
    await this.parentProfileModel.findByIdAndDelete(id);
  }

  async findByUserId(userId: string): Promise<ParentProfile | null> {
    const doc = await this.parentProfileModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<ParentProfile | null> {
    const doc = await this.parentProfileModel.findOne({ phoneNumber });
    return doc ? this.mapper.toDomain(doc) : null;
  }
}
