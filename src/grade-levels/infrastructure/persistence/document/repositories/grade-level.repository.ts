import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery } from 'mongoose';
import {
  GradeLevelDocument,
  GradeLevelDocumentType,
} from '../schemas/grade-level.schema';
import { GradeLevelRepositoryAbstract } from './grade-level.repository.abstract';
import { GradeLevelMapper } from '../mappers/grade-level.mapper';
import { GradeLevel } from '../../../../domain/grade-level';

@Injectable()
export class GradeLevelRepository implements GradeLevelRepositoryAbstract {
  constructor(
    @InjectModel(GradeLevelDocument.name)
    private readonly gradeLevelModel: Model<GradeLevelDocumentType>,
    private readonly mapper: GradeLevelMapper,
  ) {}

  async findById(id: string): Promise<GradeLevel | null> {
    const doc = await this.gradeLevelModel.findById(id);
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findAll(): Promise<GradeLevel[]> {
    const docs = await this.gradeLevelModel.find().sort({ value: 1 });
    return this.mapper.toDomainArray(docs);
  }

  async create(
    data: Omit<GradeLevel, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<GradeLevel> {
    const doc = await this.gradeLevelModel.create({
      name: data.name,
      value: data.value,
    });
    return this.mapper.toDomain(doc);
  }

  async update(
    id: string,
    data: Partial<GradeLevel>,
  ): Promise<GradeLevel | null> {
    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.value !== undefined) updateData.value = data.value;

    const doc = await this.gradeLevelModel.findByIdAndUpdate(
      id,
      updateData as UpdateQuery<GradeLevelDocumentType>,
      {
        new: true,
      },
    );
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<void> {
    await this.gradeLevelModel.findByIdAndDelete(id);
  }

  async findByValue(value: number): Promise<GradeLevel | null> {
    const doc = await this.gradeLevelModel.findOne({ value });
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findByName(name: string): Promise<GradeLevel | null> {
    const doc = await this.gradeLevelModel.findOne({ name });
    return doc ? this.mapper.toDomain(doc) : null;
  }
}
