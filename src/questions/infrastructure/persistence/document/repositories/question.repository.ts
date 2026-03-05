/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import {
  QuestionDocument,
  QuestionDocumentType,
} from '../schemas/question.schema';
import { QuestionRepositoryAbstract } from './question.repository.abstract';
import { QuestionMapper } from '../mappers/question.mapper';
import { Question } from '../../../../domain/question';

@Injectable()
export class QuestionRepository implements QuestionRepositoryAbstract {
  constructor(
    @InjectModel(QuestionDocument.name)
    private readonly questionModel: Model<QuestionDocumentType>,
    private readonly mapper: QuestionMapper,
  ) {}

  async findById(id: string): Promise<Question | null> {
    const doc = await this.questionModel.findById(id);
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findAll(): Promise<Question[]> {
    const docs = await this.questionModel.find();
    return this.mapper.toDomainArray(docs);
  }

  async create(
    data: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Question> {
    const doc = await this.questionModel.create({
      lessonId: data.lessonId ? new Types.ObjectId(data.lessonId) : undefined,
      contentHtml: data.contentHtml,
      type: data.type,
      difficulty: data.difficulty,
      options: data.options,
      correctAnswer: data.correctAnswer,
      explanation: data.explanation,
    });
    return this.mapper.toDomain(doc);
  }

  async update(id: string, data: Partial<Question>): Promise<Question | null> {
    const updateData: Record<string, unknown> = {};
    if (data.lessonId) updateData.lessonId = new Types.ObjectId(data.lessonId);
    if (data.contentHtml) updateData.contentHtml = data.contentHtml;
    if (data.type) updateData.type = data.type;
    if (data.difficulty) updateData.difficulty = data.difficulty;
    if (data.options) updateData.options = data.options;
    if (data.correctAnswer) updateData.correctAnswer = data.correctAnswer;
    if (data.explanation) updateData.explanation = data.explanation;

    const doc = await this.questionModel.findByIdAndUpdate(
      id,
      updateData as UpdateQuery<QuestionDocumentType>,
      {
        new: true,
      },
    );
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<void> {
    await this.questionModel.findByIdAndDelete(id);
  }

  async findByLessonId(lessonId: string): Promise<Question[]> {
    const docs = await this.questionModel.find({
      lessonId: new Types.ObjectId(lessonId),
    });
    return this.mapper.toDomainArray(docs);
  }

  async findByDifficulty(difficulty: string): Promise<Question[]> {
    const docs = await this.questionModel.find({ difficulty });
    return this.mapper.toDomainArray(docs);
  }

  async getRandomQuestion(limit: number = 1): Promise<Question[]> {
    const docs = await this.questionModel.aggregate([
      { $sample: { size: limit } },
    ]);

    return docs.map((doc: any) => ({
      id: doc._id.toString(),
      lessonId: doc.lessonId?.toString(),
      quizId: doc.quizId?.toString(),
      contentHtml: doc.contentHtml,
      type: doc.type,
      difficulty: doc.difficulty,
      options: doc.options,
      correctAnswer: doc.correctAnswer,
      explanation: doc.explanation ?? '',
      tags: doc.tags ?? [],
      points: doc.points ?? 10,
      isDeleted: doc.isDeleted ?? false,
      deletedAt: doc.deletedAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  }
}
