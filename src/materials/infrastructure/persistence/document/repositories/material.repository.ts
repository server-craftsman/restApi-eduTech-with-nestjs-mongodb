import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import {
  MaterialDocument,
  MaterialDocumentType,
} from '../schemas/material.schema';
import { MaterialRepositoryAbstract } from './material.repository.abstract';
import { MaterialMapper } from '../mappers/material.mapper';
import { Material } from '../../../../domain/material';

@Injectable()
export class MaterialRepository implements MaterialRepositoryAbstract {
  constructor(
    @InjectModel(MaterialDocument.name)
    private readonly materialModel: Model<MaterialDocumentType>,
    private readonly mapper: MaterialMapper,
  ) {}

  async findById(id: string): Promise<Material | null> {
    const doc = await this.materialModel.findById(id);
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findAll(): Promise<Material[]> {
    const docs = await this.materialModel.find();
    return this.mapper.toDomainArray(docs);
  }

  async create(
    data: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Material> {
    const doc = await this.materialModel.create({
      lessonId: new Types.ObjectId(data.lessonId),
      title: data.title,
      fileUrl: data.fileUrl,
      type: data.type,
    });
    return this.mapper.toDomain(doc);
  }

  async update(id: string, data: Partial<Material>): Promise<Material | null> {
    const updateData: Record<string, unknown> = {};
    if (data.lessonId) updateData.lessonId = new Types.ObjectId(data.lessonId);
    if (data.title) updateData.title = data.title;
    if (data.fileUrl) updateData.fileUrl = data.fileUrl;
    if (data.type) updateData.type = data.type;

    const doc = await this.materialModel.findByIdAndUpdate(
      id,
      updateData as UpdateQuery<MaterialDocumentType>,
      {
        new: true,
      },
    );
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<void> {
    await this.materialModel.findByIdAndDelete(id);
  }

  async findByLessonId(lessonId: string): Promise<Material[]> {
    const docs = await this.materialModel.find({
      lessonId: new Types.ObjectId(lessonId),
    });
    return this.mapper.toDomainArray(docs);
  }

  async searchByKeyword(
    keyword: string,
    page: number,
    limit: number,
  ): Promise<[Material[], number]> {
    const regex = { $regex: keyword, $options: 'i' };
    const query = { title: regex };
    const offset = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.materialModel.find(query).skip(offset).limit(limit).exec(),
      this.materialModel.countDocuments(query).exec(),
    ]);
    return [this.mapper.toDomainArray(docs), total];
  }
}
