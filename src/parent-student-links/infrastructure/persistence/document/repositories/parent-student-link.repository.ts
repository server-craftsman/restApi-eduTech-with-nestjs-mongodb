import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import {
  ParentStudentLinkDocument,
  ParentStudentLinkDocumentType,
} from '../schemas/parent-student-link.schema';
import { ParentStudentLinkRepositoryAbstract } from './parent-student-link.repository.abstract';
import { ParentStudentLinkMapper } from '../mappers/parent-student-link.mapper';
import { ParentStudentLink } from '../../../../domain/parent-student-link';

@Injectable()
export class ParentStudentLinkRepository implements ParentStudentLinkRepositoryAbstract {
  constructor(
    @InjectModel(ParentStudentLinkDocument.name)
    private readonly parentStudentLinkModel: Model<ParentStudentLinkDocumentType>,
    private readonly mapper: ParentStudentLinkMapper,
  ) {}

  async findById(id: string): Promise<ParentStudentLink | null> {
    const doc = await this.parentStudentLinkModel.findById(id);
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findAll(): Promise<ParentStudentLink[]> {
    const docs = await this.parentStudentLinkModel.find();
    return this.mapper.toDomainArray(docs);
  }

  async create(
    data: Omit<ParentStudentLink, 'id' | 'createdAt'>,
  ): Promise<ParentStudentLink> {
    const doc = await this.parentStudentLinkModel.create({
      parentId: data.parentId ? new Types.ObjectId(data.parentId) : undefined,
      studentId: new Types.ObjectId(data.studentId),
      isVerified: data.isVerified,
      linkCode: data.linkCode ?? null,
      linkCodeExpires: data.linkCodeExpires ?? null,
    });
    return this.mapper.toDomain(doc);
  }

  async update(
    id: string,
    data: Partial<ParentStudentLink>,
  ): Promise<ParentStudentLink | null> {
    const updateData: Record<string, unknown> = {};
    if (data.parentId) updateData.parentId = new Types.ObjectId(data.parentId);
    if (data.studentId)
      updateData.studentId = new Types.ObjectId(data.studentId);
    if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;
    if (data.linkCode !== undefined) updateData.linkCode = data.linkCode;
    if (data.linkCodeExpires !== undefined)
      updateData.linkCodeExpires = data.linkCodeExpires;

    const doc = await this.parentStudentLinkModel.findByIdAndUpdate(
      id,
      updateData as UpdateQuery<ParentStudentLinkDocumentType>,
      {
        new: true,
      },
    );
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<void> {
    await this.parentStudentLinkModel.findByIdAndDelete(id);
  }

  async findByParentId(parentId: string): Promise<ParentStudentLink[]> {
    const docs = await this.parentStudentLinkModel.find({
      parentId: new Types.ObjectId(parentId),
    });
    return this.mapper.toDomainArray(docs);
  }

  async findByStudentId(studentId: string): Promise<ParentStudentLink[]> {
    const docs = await this.parentStudentLinkModel.find({
      studentId: new Types.ObjectId(studentId),
    });
    return this.mapper.toDomainArray(docs);
  }

  async findByParentAndStudent(
    parentId: string,
    studentId: string,
  ): Promise<ParentStudentLink | null> {
    const doc = await this.parentStudentLinkModel.findOne({
      parentId: new Types.ObjectId(parentId),
      studentId: new Types.ObjectId(studentId),
    });
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findVerifiedByParentId(parentId: string): Promise<ParentStudentLink[]> {
    const docs = await this.parentStudentLinkModel.find({
      parentId: new Types.ObjectId(parentId),
      isVerified: true,
    });
    return this.mapper.toDomainArray(docs);
  }

  async findVerifiedByStudentId(
    studentId: string,
  ): Promise<ParentStudentLink[]> {
    const docs = await this.parentStudentLinkModel.find({
      studentId: new Types.ObjectId(studentId),
      isVerified: true,
    });
    return this.mapper.toDomainArray(docs);
  }

  async findByLinkCode(code: string): Promise<ParentStudentLink | null> {
    const doc = await this.parentStudentLinkModel.findOne({ linkCode: code });
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findPendingByStudentId(
    studentId: string,
  ): Promise<ParentStudentLink | null> {
    const doc = await this.parentStudentLinkModel.findOne({
      studentId: new Types.ObjectId(studentId),
      isVerified: false,
      linkCode: { $ne: null },
    });
    return doc ? this.mapper.toDomain(doc) : null;
  }
}
