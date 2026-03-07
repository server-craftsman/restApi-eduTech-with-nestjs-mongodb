import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  QuizAttemptDocument,
  QuizAttemptDocumentType,
} from '../schemas/quiz-attempt.schema';
import { QuizAttemptRepositoryAbstract } from './quiz-attempt.repository.abstract';
import { QuizAttemptMapper } from '../mappers/quiz-attempt.mapper';
import { QuizAttempt } from '../../../../domain/quiz-attempt';

@Injectable()
export class QuizAttemptRepository extends QuizAttemptRepositoryAbstract {
  private readonly NOT_DELETED = { isDeleted: { $ne: true } };

  private readonly model: Model<QuizAttemptDocumentType>;
  private readonly mapper: QuizAttemptMapper;

  constructor(
    @InjectModel(QuizAttemptDocument.name)
    model: Model<QuizAttemptDocumentType>,
    mapper: QuizAttemptMapper,
  ) {
    super();
    this.model = model;
    this.mapper = mapper;
  }

  async findById(id: string): Promise<QuizAttempt | null> {
    const doc = await this.model.findOne({
      _id: id,
      ...this.NOT_DELETED,
    });
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findAll(): Promise<QuizAttempt[]> {
    const docs = await this.model.find(this.NOT_DELETED);
    return this.mapper.toDomainArray(docs);
  }

  async create(
    data: Omit<QuizAttempt, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<QuizAttempt> {
    const doc = await this.model.create({
      ...this.mapper.toDocument(data),
      isDeleted: false,
      deletedAt: null,
    });
    return this.mapper.toDomain(doc);
  }

  async update(id: string, data: Partial<QuizAttempt>): Promise<QuizAttempt> {
    const updated = await this.model.findOneAndUpdate(
      { _id: id, ...this.NOT_DELETED },
      { $set: this.mapper.toDocument(data) },
      { new: true },
    );
    if (!updated) throw new Error(`Quiz attempt with id ${id} not found`);
    return this.mapper.toDomain(updated);
  }

  async softDelete(id: string): Promise<void> {
    await this.model.findOneAndUpdate(
      { _id: id, ...this.NOT_DELETED },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
    );
  }

  async findByUserId(userId: string): Promise<QuizAttempt[]> {
    const docs = await this.model.find({
      userId: new Types.ObjectId(userId),
      ...this.NOT_DELETED,
    });
    return this.mapper.toDomainArray(docs);
  }

  async findByLessonId(lessonId: string): Promise<QuizAttempt[]> {
    const docs = await this.model.find({
      lessonId: new Types.ObjectId(lessonId),
      ...this.NOT_DELETED,
    });
    return this.mapper.toDomainArray(docs);
  }

  async findByQuestionId(questionId: string): Promise<QuizAttempt[]> {
    const docs = await this.model.find({
      'answers.questionId': questionId,
      ...this.NOT_DELETED,
    });
    return this.mapper.toDomainArray(docs);
  }

  async findByUserAndQuestion(
    userId: string,
    questionId: string,
  ): Promise<QuizAttempt[]> {
    const docs = await this.model.find({
      userId: new Types.ObjectId(userId),
      'answers.questionId': questionId,
      ...this.NOT_DELETED,
    });
    return this.mapper.toDomainArray(docs);
  }

  async findByUserAndLesson(
    userId: string,
    lessonId: string,
  ): Promise<QuizAttempt[]> {
    const docs = await this.model.find({
      userId: new Types.ObjectId(userId),
      lessonId: new Types.ObjectId(lessonId),
      ...this.NOT_DELETED,
    });
    return this.mapper.toDomainArray(docs);
  }

  async getAttemptStats(userId: string): Promise<{
    totalAttempts: number;
    correctAttempts: number;
    accuracy: string | number;
    averageTimeSpentMs: number;
    totalTimeSpentMs: number;
  }> {
    const stats = await this.model.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          isDeleted: { $ne: true },
        },
      },
      {
        $group: {
          _id: '$userId',
          totalAttempts: { $sum: 1 },
          correctAttempts: {
            $sum: {
              $cond: [
                {
                  $eq: ['$score', 100],
                },
                1,
                0,
              ],
            },
          },
          averageTimeSpentMs: { $avg: '$totalTimeSpentMs' },
          totalTimeSpentMs: { $sum: '$totalTimeSpentMs' },
        },
      },
    ]);

    interface StatsResult {
      totalAttempts: number;
      correctAttempts: number;
      averageTimeSpentMs: number;
      totalTimeSpentMs: number;
    }

    const result = stats[0] as StatsResult | undefined;

    return result
      ? {
          totalAttempts: result.totalAttempts,
          correctAttempts: result.correctAttempts,
          accuracy: (
            (result.correctAttempts / result.totalAttempts) *
            100
          ).toFixed(2),
          averageTimeSpentMs: Math.round(result.averageTimeSpentMs),
          totalTimeSpentMs: result.totalTimeSpentMs,
        }
      : {
          totalAttempts: 0,
          correctAttempts: 0,
          accuracy: 0,
          averageTimeSpentMs: 0,
          totalTimeSpentMs: 0,
        };
  }

  async findBestAttemptByUserAndLesson(
    userId: string,
    lessonId: string,
  ): Promise<QuizAttempt | null> {
    const doc = await this.model
      .findOne({
        userId: new Types.ObjectId(userId),
        lessonId: new Types.ObjectId(lessonId),
        ...this.NOT_DELETED,
      })
      .sort({ score: -1, createdAt: -1 });

    return doc ? this.mapper.toDomain(doc) : null;
  }
}
