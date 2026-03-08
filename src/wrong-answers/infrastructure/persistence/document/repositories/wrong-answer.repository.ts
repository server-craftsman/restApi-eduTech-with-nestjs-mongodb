import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  WrongAnswerDocument,
  WrongAnswerDocumentType,
} from '../schemas/wrong-answer.schema';
import { WrongAnswerRepositoryAbstract } from './wrong-answer.repository.abstract';
import { WrongAnswerMapper } from '../mappers/wrong-answer.mapper';
import { WrongAnswer } from '../../../../domain/wrong-answer';
import { NOT_DELETED } from '../../../../../core/constants';

@Injectable()
export class WrongAnswerRepository extends WrongAnswerRepositoryAbstract {
  private readonly model: Model<WrongAnswerDocumentType>;
  private readonly mapper: WrongAnswerMapper;

  constructor(
    @InjectModel(WrongAnswerDocument.name)
    model: Model<WrongAnswerDocumentType>,
    mapper: WrongAnswerMapper,
  ) {
    super();
    this.model = model;
    this.mapper = mapper;
  }

  // ──────────────────────────────────────────────────────────
  // Read operations
  // ──────────────────────────────────────────────────────────

  async findById(id: string): Promise<WrongAnswer | null> {
    const doc = await this.model.findOne({ _id: id, ...NOT_DELETED }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findByUserId(
    userId: string,
    isMastered?: boolean,
  ): Promise<WrongAnswer[]> {
    const query: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
      ...NOT_DELETED,
    };
    if (isMastered !== undefined) query.isMastered = isMastered;

    const docs = await this.model.find(query).sort({ lastFailedAt: -1 }).exec();
    return this.mapper.toDomainArray(docs);
  }

  async findByUserIdAndLessonId(
    userId: string,
    lessonId: string,
    isMastered?: boolean,
  ): Promise<WrongAnswer[]> {
    const query: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
      lessonId: new Types.ObjectId(lessonId),
      ...NOT_DELETED,
    };
    if (isMastered !== undefined) query.isMastered = isMastered;

    const docs = await this.model.find(query).sort({ lastFailedAt: -1 }).exec();
    return this.mapper.toDomainArray(docs);
  }

  async findByUserIdAndQuestionId(
    userId: string,
    questionId: string,
  ): Promise<WrongAnswer | null> {
    const doc = await this.model
      .findOne({
        userId: new Types.ObjectId(userId),
        questionId: new Types.ObjectId(questionId),
        ...NOT_DELETED,
      })
      .exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  // ──────────────────────────────────────────────────────────
  // Write operations
  // ──────────────────────────────────────────────────────────

  /**
   * Upsert: increment failCount if exists; create with failCount=1 if not.
   * Always resets isMastered to false (in case it was previously mastered).
   */
  async upsertWrongAnswer(
    userId: string,
    questionId: string,
    lessonId: string,
  ): Promise<WrongAnswer> {
    const userOid = new Types.ObjectId(userId);
    const questionOid = new Types.ObjectId(questionId);
    const lessonOid = new Types.ObjectId(lessonId);
    const now = new Date();

    const doc = await this.model
      .findOneAndUpdate(
        { userId: userOid, questionId: questionOid },
        {
          $inc: { failCount: 1 },
          $set: {
            lastFailedAt: now,
            isMastered: false,
            masteredAt: null,
            lessonId: lessonOid,
            isDeleted: false,
            deletedAt: null,
          },
          $setOnInsert: {
            userId: userOid,
            questionId: questionOid,
          },
        },
        { new: true, upsert: true },
      )
      .exec();

    return this.mapper.toDomain(doc);
  }

  /**
   * Mark a (user, question) pair as mastered.
   * Only updates when the record exists and `isMastered` is currently false.
   */
  async markMastered(
    userId: string,
    questionId: string,
  ): Promise<WrongAnswer | null> {
    const doc = await this.model
      .findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          questionId: new Types.ObjectId(questionId),
          isMastered: false,
          ...NOT_DELETED,
        },
        { $set: { isMastered: true, masteredAt: new Date() } },
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

  // ──────────────────────────────────────────────────────────
  // Aggregation
  // ──────────────────────────────────────────────────────────

  async getStats(userId: string): Promise<{
    total: number;
    mastered: number;
    remaining: number;
  }> {
    const userOid = new Types.ObjectId(userId);
    const [total, mastered] = await Promise.all([
      this.model.countDocuments({ userId: userOid, ...NOT_DELETED }).exec(),
      this.model
        .countDocuments({ userId: userOid, isMastered: true, ...NOT_DELETED })
        .exec(),
    ]);
    return { total, mastered, remaining: total - mastered };
  }
}
