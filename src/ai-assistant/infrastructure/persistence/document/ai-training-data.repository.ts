import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AiTrainingData } from '../../../domain/ai-training-data';
import { AiTrainingDataRepositoryAbstract } from './repositories/ai-training-data.repository.abstract';
import {
  AiTrainingDataDocument,
  AiTrainingDataDocumentType,
} from './schemas/ai-training-data.schema';
import { AiTrainingDataMapper } from './mappers/ai-training-data.mapper';
import { AiTrainingStatus } from '../../../../enums';
import {
  NOT_DELETED,
  buildVietnameseRegexQuery,
} from '../../../../core/constants';

@Injectable()
export class AiTrainingDataRepository extends AiTrainingDataRepositoryAbstract {
  private readonly model: Model<AiTrainingDataDocumentType>;
  private readonly mapper: AiTrainingDataMapper;

  constructor(
    @InjectModel(AiTrainingDataDocument.name)
    model: Model<AiTrainingDataDocumentType>,
    mapper: AiTrainingDataMapper,
  ) {
    super();
    this.model = model;
    this.mapper = mapper;
  }

  async findById(id: string): Promise<AiTrainingData | null> {
    const doc = await this.model.findOne({ _id: id, ...NOT_DELETED }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findAllWithFilters(
    limit: number,
    offset: number,
    filters?: {
      status?: AiTrainingStatus | null;
      subject?: string | null;
      isDeleted?: boolean | null;
    },
  ): Promise<[AiTrainingData[], number]> {
    const query: Record<string, unknown> = {};
    query.isDeleted = filters?.isDeleted === true ? true : { $ne: true };

    if (filters?.status) query.status = filters.status;
    if (filters?.subject)
      query.subject = buildVietnameseRegexQuery(filters.subject);

    const [docs, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);
    return [this.mapper.toDomainArray(docs), total];
  }

  async create(data: Partial<AiTrainingData>): Promise<AiTrainingData> {
    const doc = new this.model({
      ...this.mapper.toDocument(data),
      isDeleted: false,
      deletedAt: null,
    });
    return this.mapper.toDomain(await doc.save());
  }

  async update(
    id: string,
    data: Partial<AiTrainingData>,
  ): Promise<AiTrainingData | null> {
    const updated = await this.model
      .findOneAndUpdate(
        { _id: id, ...NOT_DELETED },
        { $set: this.mapper.toDocument(data) },
        { new: true },
      )
      .exec();
    return updated ? this.mapper.toDomain(updated) : null;
  }

  async softDelete(id: string): Promise<void> {
    await this.model
      .findOneAndUpdate(
        { _id: id, ...NOT_DELETED },
        { $set: { isDeleted: true, deletedAt: new Date() } },
      )
      .exec();
  }

  async findAllApproved(): Promise<AiTrainingData[]> {
    const docs = await this.model
      .find({
        status: AiTrainingStatus.Approved,
        ...NOT_DELETED,
      })
      .sort({ createdAt: 1 })
      .exec();
    return this.mapper.toDomainArray(docs);
  }

  async findAllWithEmbeddings(
    subject?: string | null,
  ): Promise<AiTrainingData[]> {
    const query: Record<string, unknown> = {
      status: AiTrainingStatus.Approved,
      questionEmbedding: { $ne: null },
      ...NOT_DELETED,
    };
    if (subject) query.subject = buildVietnameseRegexQuery(subject);

    const docs = await this.model.find(query).exec();
    return this.mapper.toDomainArray(docs);
  }

  async updateEmbedding(id: string, embedding: number[]): Promise<void> {
    await this.model
      .findOneAndUpdate(
        { _id: id, ...NOT_DELETED },
        { $set: { questionEmbedding: embedding } },
      )
      .exec();
  }

  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    deleted: number;
  }> {
    const [total, deleted, byStatusAgg] = await Promise.all([
      this.model.countDocuments({ ...NOT_DELETED }).exec(),
      this.model.countDocuments({ isDeleted: true }).exec(),
      this.model
        .aggregate<{
          _id: string;
          count: number;
        }>([
          { $match: { isDeleted: { $ne: true } } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ])
        .exec(),
    ]);

    const byStatus: Record<string, number> = Object.values(
      AiTrainingStatus,
    ).reduce<Record<string, number>>((acc, s) => ({ ...acc, [s]: 0 }), {});
    for (const entry of byStatusAgg) byStatus[entry._id] = entry.count;

    return { total, byStatus, deleted };
  }
}
