import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { LessonDocument, LessonDocumentType } from '../schemas/lesson.schema';
import { LessonRepositoryAbstract } from './lesson.repository.abstract';
import { LessonMapper } from '../mappers/lesson.mapper';
import { Lesson } from '../../../../domain/lesson';

@Injectable()
export class LessonRepository implements LessonRepositoryAbstract {
  constructor(
    @InjectModel(LessonDocument.name)
    private readonly lessonModel: Model<LessonDocumentType>,
    private readonly mapper: LessonMapper,
  ) {}

  async findById(id: string): Promise<Lesson | null> {
    const doc = await this.lessonModel.findById(id);
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findAll(): Promise<Lesson[]> {
    const docs = await this.lessonModel.find().sort({ orderIndex: 1 });
    return this.mapper.toDomainArray(docs);
  }

  async create(
    data: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Lesson> {
    const doc = await this.lessonModel.create({
      chapterId: new Types.ObjectId(data.chapterId),
      title: data.title,
      description: data.description,
      orderIndex: data.orderIndex,
      durationSeconds: data.durationSeconds,
      videoUrl: data.videoUrl,
      contentMd: data.contentMd,
      isPreview: data.isPreview,
    });
    return this.mapper.toDomain(doc);
  }

  async update(id: string, data: Partial<Lesson>): Promise<Lesson | null> {
    const updateData: Record<string, unknown> = {};
    if (data.chapterId)
      updateData.chapterId = new Types.ObjectId(data.chapterId);
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex;
    if (data.durationSeconds !== undefined)
      updateData.durationSeconds = data.durationSeconds;
    if (data.videoUrl) updateData.videoUrl = data.videoUrl;
    if (data.contentMd !== undefined) updateData.contentMd = data.contentMd;
    if (data.isPreview !== undefined) updateData.isPreview = data.isPreview;

    const doc = await this.lessonModel.findByIdAndUpdate(
      id,
      updateData as UpdateQuery<LessonDocumentType>,
      {
        new: true,
      },
    );
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<void> {
    await this.lessonModel.findByIdAndDelete(id);
  }

  async findByChapterId(chapterId: string): Promise<Lesson[]> {
    const docs = await this.lessonModel
      .find({
        chapterId: new Types.ObjectId(chapterId),
      })
      .sort({ orderIndex: 1 });
    return this.mapper.toDomainArray(docs);
  }

  async findByChapterIdOrdered(chapterId: string): Promise<Lesson[]> {
    const docs = await this.lessonModel
      .find({
        chapterId: new Types.ObjectId(chapterId),
      })
      .sort({ orderIndex: 1 });
    return this.mapper.toDomainArray(docs);
  }

  async findByCourseId(courseId: string): Promise<Lesson[]> {
    const docs = await this.lessonModel
      .find({
        courseId: new Types.ObjectId(courseId),
      })
      .sort({ orderIndex: 1 });
    return this.mapper.toDomainArray(docs);
  }

  async searchByKeyword(
    keyword: string,
    page: number,
    limit: number,
  ): Promise<[Lesson[], number]> {
    const regex = { $regex: keyword, $options: 'i' };
    const query = {
      $or: [{ title: regex }, { description: regex }, { contentMd: regex }],
    };
    const offset = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.lessonModel
        .find(query)
        .skip(offset)
        .limit(limit)
        .sort({ orderIndex: 1 })
        .exec(),
      this.lessonModel.countDocuments(query).exec(),
    ]);
    return [this.mapper.toDomainArray(docs), total];
  }

  async findPreviousLesson(lessonId: string): Promise<Lesson | null> {
    const currentLesson = await this.findById(lessonId);
    if (!currentLesson || !currentLesson.chapterId) {
      return null;
    }

    const doc = await this.lessonModel
      .findOne({
        chapterId: new Types.ObjectId(currentLesson.chapterId),
        orderIndex: { $lt: currentLesson.orderIndex || 0 },
      })
      .sort({ orderIndex: -1 });

    return doc ? this.mapper.toDomain(doc) : null;
  }
}
