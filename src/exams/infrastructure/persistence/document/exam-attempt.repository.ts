import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ExamAttemptDocument,
  ExamAttemptDocumentType,
} from './schemas/exam-attempt.schema';
import { ExamAttemptRepositoryAbstract } from './repositories/exam-attempt.repository.abstract';
import { ExamAttemptMapper } from './mappers/exam-attempt.mapper';
import { ExamAttempt } from '../../../domain/exam-attempt';
import { NOT_DELETED } from '../../../../core/constants';

@Injectable()
export class ExamAttemptRepository extends ExamAttemptRepositoryAbstract {
  private readonly model: Model<ExamAttemptDocumentType>;
  private readonly mapper: ExamAttemptMapper;

  constructor(
    @InjectModel(ExamAttemptDocument.name)
    model: Model<ExamAttemptDocumentType>,
    mapper: ExamAttemptMapper,
  ) {
    super();
    this.model = model;
    this.mapper = mapper;
  }

  async findById(id: string): Promise<ExamAttempt | null> {
    const doc = await this.model.findOne({ _id: id, ...NOT_DELETED }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async create(data: Partial<ExamAttempt>): Promise<ExamAttempt> {
    const doc = await this.model.create({
      userId: new Types.ObjectId(data.userId!),
      examId: new Types.ObjectId(data.examId!),
      answers: data.answers ?? [],
      score: data.score ?? 0,
      totalQuestions: data.totalQuestions ?? 0,
      correctAnswers: data.correctAnswers ?? 0,
      totalTimeSpentMs: data.totalTimeSpentMs ?? 0,
      passed: data.passed ?? false,
      status: data.status ?? 'graded',
      submittedAt: data.submittedAt ?? new Date(),
      gradedAt: data.gradedAt ?? new Date(),
      isDeleted: false,
      deletedAt: null,
    });
    return this.mapper.toDomain(doc);
  }

  async findByUserId(userId: string): Promise<ExamAttempt[]> {
    const docs = await this.model
      .find({ userId: new Types.ObjectId(userId), ...NOT_DELETED })
      .sort({ createdAt: -1 })
      .exec();
    return this.mapper.toDomainArray(docs);
  }

  async findByExamId(examId: string): Promise<ExamAttempt[]> {
    const docs = await this.model
      .find({ examId: new Types.ObjectId(examId), ...NOT_DELETED })
      .sort({ createdAt: -1 })
      .exec();
    return this.mapper.toDomainArray(docs);
  }

  async findByUserAndExam(
    userId: string,
    examId: string,
  ): Promise<ExamAttempt[]> {
    const docs = await this.model
      .find({
        userId: new Types.ObjectId(userId),
        examId: new Types.ObjectId(examId),
        ...NOT_DELETED,
      })
      .sort({ createdAt: -1 })
      .exec();
    return this.mapper.toDomainArray(docs);
  }

  async findBestAttemptByUserAndExam(
    userId: string,
    examId: string,
  ): Promise<ExamAttempt | null> {
    const doc = await this.model
      .findOne({
        userId: new Types.ObjectId(userId),
        examId: new Types.ObjectId(examId),
        ...NOT_DELETED,
      })
      .sort({ score: -1, createdAt: -1 })
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
}
