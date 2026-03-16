import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LessonDocument, LessonDocumentType } from '../schemas/lesson.schema';
import { LessonRepositoryAbstract } from './lesson.repository.abstract';
import { LessonMapper } from '../mappers/lesson.mapper';
import { Lesson } from '../../../../domain/lesson';
import {
  NOT_DELETED,
  buildVietnameseRegexQuery,
} from '../../../../../core/constants';

@Injectable()
export class LessonRepository extends LessonRepositoryAbstract {
  private readonly model: Model<LessonDocumentType>;
  private readonly mapper: LessonMapper;

  constructor(
    @InjectModel(LessonDocument.name)
    model: Model<LessonDocumentType>,
    mapper: LessonMapper,
  ) {
    super();
    this.model = model;
    this.mapper = mapper;
  }

  async findById(id: string): Promise<Lesson | null> {
    const doc = await this.model.findOne({ _id: id, ...NOT_DELETED }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findAll(): Promise<Lesson[]> {
    const docs = await this.model
      .find(NOT_DELETED)
      .sort({ orderIndex: 1 })
      .exec();
    return this.mapper.toDomainArray(docs);
  }

  async create(
    data: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Lesson> {
    const doc = await this.model.create({
      chapterId: new Types.ObjectId(data.chapterId),
      title: data.title,
      description: data.description,
      orderIndex: data.orderIndex,
      video: {
        url: data.video.url,
        fileSize: data.video.fileSize,
        publicId: data.video.publicId,
        durationSeconds: data.video.durationSeconds,
      },
      contentMd: data.contentMd,
      isPreview: data.isPreview,
      isDeleted: false,
      deletedAt: null,
    });
    return this.mapper.toDomain(doc);
  }

  async update(id: string, data: Partial<Lesson>): Promise<Lesson | null> {
    const updateData: Record<string, unknown> = {};
    if (data.chapterId !== undefined)
      updateData.chapterId = new Types.ObjectId(data.chapterId);
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex;
    if (data.video !== undefined)
      updateData.video = {
        url: data.video.url,
        fileSize: data.video.fileSize,
        publicId: data.video.publicId,
        durationSeconds: data.video.durationSeconds,
      };
    if (data.contentMd !== undefined) updateData.contentMd = data.contentMd;
    if (data.isPreview !== undefined) updateData.isPreview = data.isPreview;

    const doc = await this.model
      .findOneAndUpdate(
        { _id: id, ...NOT_DELETED },
        { $set: updateData },
        { new: true },
      )
      .exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async softDelete(id: string): Promise<void> {
    await this.model
      .findOneAndUpdate(
        { _id: id, ...NOT_DELETED },
        { $set: { isDeleted: true, deletedAt: new Date() } },
      )
      .exec();
  }

  async findByChapterId(chapterId: string): Promise<Lesson[]> {
    const docs = await this.model
      .find({
        chapterId: new Types.ObjectId(chapterId),
        ...NOT_DELETED,
      })
      .sort({ orderIndex: 1 })
      .exec();
    return this.mapper.toDomainArray(docs);
  }

  async findByChapterIdOrdered(chapterId: string): Promise<Lesson[]> {
    return this.findByChapterId(chapterId);
  }

  async findByCourseId(courseId: string): Promise<Lesson[]> {
    const docs = await this.model
      .find({
        courseId: new Types.ObjectId(courseId),
        ...NOT_DELETED,
      })
      .sort({ orderIndex: 1 })
      .exec();
    return this.mapper.toDomainArray(docs);
  }

  async searchByKeyword(
    keyword: string,
    page: number,
    limit: number,
  ): Promise<[Lesson[], number]> {
    const regex = buildVietnameseRegexQuery(keyword);
    const query = {
      $or: [{ title: regex }, { description: regex }, { contentMd: regex }],
      ...NOT_DELETED,
    };
    const offset = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model
        .find(query)
        .skip(offset)
        .limit(limit)
        .sort({ orderIndex: 1 })
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);
    return [this.mapper.toDomainArray(docs), total];
  }

  async findPreviousLesson(lessonId: string): Promise<Lesson | null> {
    const currentLesson = await this.findById(lessonId);
    if (!currentLesson || !currentLesson.chapterId) {
      return null;
    }

    const doc = await this.model
      .findOne({
        chapterId: new Types.ObjectId(currentLesson.chapterId),
        orderIndex: { $lt: currentLesson.orderIndex || 0 },
        ...NOT_DELETED,
      })
      .sort({ orderIndex: -1 })
      .exec();

    return doc ? this.mapper.toDomain(doc) : null;
  }
}
