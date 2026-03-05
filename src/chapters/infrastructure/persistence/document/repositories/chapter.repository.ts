import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ChapterDocument,
  ChapterDocumentType,
} from '../schemas/chapter.schema';
import { ChapterRepositoryAbstract } from './chapter.repository.abstract';
import { ChapterMapper } from '../mappers/chapter.mapper';
import { Chapter } from '../../../../domain/chapter';
import {
  FilterChapterDto,
  SortChapterDto,
} from '../../../../dto/query-chapter.dto';

const NOT_DELETED = { isDeleted: { $ne: true } };

@Injectable()
export class ChapterRepository extends ChapterRepositoryAbstract {
  private readonly model: Model<ChapterDocumentType>;
  private readonly mapper: ChapterMapper;

  constructor(
    @InjectModel(ChapterDocument.name) model: Model<ChapterDocumentType>,
    mapper: ChapterMapper,
  ) {
    super();
    this.model = model;
    this.mapper = mapper;
  }

  async findById(id: string): Promise<Chapter | null> {
    const doc = await this.model.findOne({ _id: id, ...NOT_DELETED }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findAll(): Promise<Chapter[]> {
    const docs = await this.model
      .find({ ...NOT_DELETED })
      .sort({ createdAt: -1 })
      .exec();
    return this.mapper.toDomainArray(docs);
  }

  async findAllWithFilters(
    limit = 10,
    offset = 0,
    filters?: FilterChapterDto,
    sort?: SortChapterDto[],
  ): Promise<[Chapter[], number]> {
    const query: Record<string, any> = {};

    query.isDeleted = filters?.isDeleted === true ? true : { $ne: true };

    if (filters?.courseId)
      query.courseId = new Types.ObjectId(filters.courseId);
    if (filters?.title) query.title = { $regex: filters.title, $options: 'i' };
    if (filters?.isPublished != null) query.isPublished = filters.isPublished;

    const sortObj: Record<string, 1 | -1> = {};
    if (sort?.length) {
      for (const s of sort)
        sortObj[s.orderBy as string] = s.order === 'asc' ? 1 : -1;
    } else {
      sortObj.orderIndex = 1;
      sortObj.createdAt = -1;
    }

    const [docs, total] = await Promise.all([
      this.model.find(query).sort(sortObj).skip(offset).limit(limit).exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return [this.mapper.toDomainArray(docs), total];
  }

  async create(chapter: Partial<Chapter>): Promise<Chapter> {
    const doc = new this.model({
      ...this.mapper.toDocument(chapter),
      isDeleted: false,
      deletedAt: null,
    });
    return this.mapper.toDomain(await doc.save());
  }

  async update(id: string, chapter: Partial<Chapter>): Promise<Chapter | null> {
    const updated = await this.model
      .findOneAndUpdate(
        { _id: id, ...NOT_DELETED },
        { $set: this.mapper.toDocument(chapter) },
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

  async findByCourseId(courseId: string): Promise<Chapter[]> {
    const docs = await this.model
      .find({
        courseId: new Types.ObjectId(courseId),
        ...NOT_DELETED,
      })
      .sort({ orderIndex: 1 })
      .exec();
    return this.mapper.toDomainArray(docs);
  }

  async reorderChapters(
    courseId: string,
    chapters: Array<{ id: string; orderIndex: number }>,
  ): Promise<Chapter[]> {
    for (const chapter of chapters) {
      await this.model
        .findOneAndUpdate(
          {
            _id: chapter.id,
            courseId: new Types.ObjectId(courseId),
            ...NOT_DELETED,
          },
          { $set: { orderIndex: chapter.orderIndex } },
          { new: true },
        )
        .exec();
    }
    return this.findByCourseId(courseId);
  }

  async getStatistics(): Promise<{
    total: number;
    published: number;
    draft: number;
    deleted: number;
    byPublished: Record<string, number>;
  }> {
    const [total, published, draft, deleted, byPublishedAgg] =
      await Promise.all([
        this.model.countDocuments({ ...NOT_DELETED }).exec(),
        this.model.countDocuments({ isPublished: true, ...NOT_DELETED }).exec(),
        this.model
          .countDocuments({ isPublished: false, ...NOT_DELETED })
          .exec(),
        this.model.countDocuments({ isDeleted: true }).exec(),
        this.model
          .aggregate<{
            _id: boolean;
            count: number;
          }>([
            { $match: { isDeleted: { $ne: true } } },
            { $group: { _id: '$isPublished', count: { $sum: 1 } } },
          ])
          .exec(),
      ]);

    const byPublished: Record<string, number> = {
      published: 0,
      draft: 0,
    };
    for (const entry of byPublishedAgg) {
      byPublished[entry._id ? 'published' : 'draft'] = entry.count;
    }

    return { total, published, draft, deleted, byPublished };
  }
}
