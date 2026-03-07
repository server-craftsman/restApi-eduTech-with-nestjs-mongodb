import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  QuestionDocument,
  QuestionDocumentType,
} from '../schemas/question.schema';
import { QuestionRepositoryAbstract } from './question.repository.abstract';
import { QuestionMapper } from '../mappers/question.mapper';
import { Question } from '../../../../domain/question';
import { Difficulty } from '../../../../../enums';
import { NOT_DELETED } from '../../../../../core/constants';

@Injectable()
export class QuestionRepository extends QuestionRepositoryAbstract {
  private readonly model: Model<QuestionDocumentType>;
  private readonly mapper: QuestionMapper;

  constructor(
    @InjectModel(QuestionDocument.name)
    model: Model<QuestionDocumentType>,
    mapper: QuestionMapper,
  ) {
    super();
    this.model = model;
    this.mapper = mapper;
  }

  async findById(id: string): Promise<Question | null> {
    const doc = await this.model.findOne({ _id: id, ...NOT_DELETED }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findAll(): Promise<Question[]> {
    const docs = await this.model.find(NOT_DELETED).exec();
    return this.mapper.toDomainArray(docs);
  }

  async create(
    data: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Question> {
    const doc = await this.model.create({
      lessonId: new Types.ObjectId(data.lessonId),
      contentHtml: data.contentHtml,
      type: data.type,
      difficulty: data.difficulty,
      options: data.options,
      correctAnswer: data.correctAnswer,
      explanation: data.explanation,
      tags: data.tags ?? [],
      points: data.points ?? 10,
      isDeleted: false,
      deletedAt: null,
    });
    return this.mapper.toDomain(doc);
  }

  async update(id: string, data: Partial<Question>): Promise<Question | null> {
    const updateData = this.mapper.toDocument(data);

    // Convert lessonId string to ObjectId if provided
    if (data.lessonId !== undefined) {
      (updateData as Record<string, unknown>).lessonId = new Types.ObjectId(
        data.lessonId,
      );
    }

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

  async findByLessonId(lessonId: string): Promise<Question[]> {
    const docs = await this.model
      .find({
        lessonId: new Types.ObjectId(lessonId),
        ...NOT_DELETED,
      })
      .exec();
    return this.mapper.toDomainArray(docs);
  }

  async findByDifficulty(difficulty: Difficulty): Promise<Question[]> {
    const docs = await this.model.find({ difficulty, ...NOT_DELETED }).exec();
    return this.mapper.toDomainArray(docs);
  }

  async findByTag(tag: string): Promise<Question[]> {
    const docs = await this.model.find({ tags: tag, ...NOT_DELETED }).exec();
    return this.mapper.toDomainArray(docs);
  }

  async getRandomQuestion(limit: number = 1): Promise<Question[]> {
    const docs = await this.model.aggregate<QuestionDocumentType>([
      { $match: { isDeleted: { $ne: true } } },
      { $sample: { size: limit } },
    ]);

    return docs.map((doc) =>
      this.mapper.toDomain(doc as unknown as QuestionDocumentType),
    );
  }
}
