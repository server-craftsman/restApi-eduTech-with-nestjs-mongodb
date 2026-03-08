import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import {
  LessonProgressDocument,
  LessonProgressDocumentType,
} from '../schemas/lesson-progress.schema';
import { LessonProgressRepositoryAbstract } from './lesson-progress.repository.abstract';
import { LessonProgressMapper } from '../mappers/lesson-progress.mapper';
import { LessonProgress } from '../../../../domain/lesson-progress';

@Injectable()
export class LessonProgressRepository implements LessonProgressRepositoryAbstract {
  constructor(
    @InjectModel(LessonProgressDocument.name)
    private readonly lessonProgressModel: Model<LessonProgressDocumentType>,
    private readonly mapper: LessonProgressMapper,
  ) {}

  async findById(id: string): Promise<LessonProgress | null> {
    const doc = await this.lessonProgressModel.findById(id);
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findAll(): Promise<LessonProgress[]> {
    const docs = await this.lessonProgressModel.find();
    return this.mapper.toDomainArray(docs);
  }

  async create(
    data: Omit<LessonProgress, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<LessonProgress> {
    const doc = await this.lessonProgressModel.create({
      userId: new Types.ObjectId(data.userId),
      lessonId: new Types.ObjectId(data.lessonId),
      isCompleted: data.isCompleted,
      lastWatchedSec: data.lastWatchedSec,
      progressPercent: data.progressPercent,
      videoWatched: data.videoWatched,
      videoCurrentTime: data.videoCurrentTime,
      videoDuration: data.videoDuration,
      quizCompleted: data.quizCompleted,
      quizScore: data.quizScore,
      lastWatchedAt: data.lastWatchedAt,
    });
    return this.mapper.toDomain(doc);
  }

  async update(
    id: string,
    data: Partial<LessonProgress>,
  ): Promise<LessonProgress | null> {
    const updateData: Record<string, unknown> = {};
    if (data.userId) updateData.userId = new Types.ObjectId(data.userId);
    if (data.lessonId) updateData.lessonId = new Types.ObjectId(data.lessonId);
    if (data.isCompleted !== undefined)
      updateData.isCompleted = data.isCompleted;
    if (data.lastWatchedSec !== undefined)
      updateData.lastWatchedSec = data.lastWatchedSec;
    if (data.progressPercent !== undefined)
      updateData.progressPercent = data.progressPercent;
    if (data.videoWatched !== undefined)
      updateData.videoWatched = data.videoWatched;
    if (data.videoCurrentTime !== undefined)
      updateData.videoCurrentTime = data.videoCurrentTime;
    if (data.videoDuration !== undefined)
      updateData.videoDuration = data.videoDuration;
    if (data.quizCompleted !== undefined)
      updateData.quizCompleted = data.quizCompleted;
    if (data.quizScore !== undefined) updateData.quizScore = data.quizScore;
    if (data.lastWatchedAt !== undefined)
      updateData.lastWatchedAt = data.lastWatchedAt;

    const doc = await this.lessonProgressModel.findByIdAndUpdate(
      id,
      updateData as UpdateQuery<LessonProgressDocumentType>,
      {
        new: true,
      },
    );
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<void> {
    await this.lessonProgressModel.findByIdAndDelete(id);
  }

  async findByUserId(userId: string): Promise<LessonProgress[]> {
    const docs = await this.lessonProgressModel.find({
      userId: new Types.ObjectId(userId),
    });
    return this.mapper.toDomainArray(docs);
  }

  async findByLessonId(lessonId: string): Promise<LessonProgress[]> {
    const docs = await this.lessonProgressModel.find({
      lessonId: new Types.ObjectId(lessonId),
    });
    return this.mapper.toDomainArray(docs);
  }

  async findByUserAndLesson(
    userId: string,
    lessonId: string,
  ): Promise<LessonProgress | null> {
    const doc = await this.lessonProgressModel.findOne({
      userId: new Types.ObjectId(userId),
      lessonId: new Types.ObjectId(lessonId),
    });
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async updateWatchedTime(
    userId: string,
    lessonId: string,
    seconds: number,
  ): Promise<LessonProgress | null> {
    const doc = await this.lessonProgressModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        lessonId: new Types.ObjectId(lessonId),
      },
      { lastWatchedSec: seconds },
      { new: true, upsert: true },
    );
    return doc ? this.mapper.toDomain(doc) : null;
  }
}
