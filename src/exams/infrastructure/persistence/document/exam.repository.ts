import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ExamDocument, ExamDocumentType } from './schemas/exam.schema';
import { ExamRepositoryAbstract } from './repositories/exam.repository.abstract';
import { ExamMapper } from './mappers/exam.mapper';
import { Exam } from '../../../domain/exam';
import { FilterExamDto, SortExamDto } from '../../../dto/query-exam.dto';
import { NOT_DELETED } from '../../../../core/constants';

@Injectable()
export class ExamRepository extends ExamRepositoryAbstract {
  private readonly model: Model<ExamDocumentType>;
  private readonly mapper: ExamMapper;

  constructor(
    @InjectModel(ExamDocument.name) model: Model<ExamDocumentType>,
    mapper: ExamMapper,
  ) {
    super();
    this.model = model;
    this.mapper = mapper;
  }

  async findById(id: string): Promise<Exam | null> {
    const doc = await this.model.findOne({ _id: id, ...NOT_DELETED }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findAllWithFilters(
    limit = 10,
    offset = 0,
    filters?: FilterExamDto,
    sort?: SortExamDto[],
  ): Promise<[Exam[], number]> {
    const query: Record<string, unknown> = {};

    // Soft-delete gate
    query.isDeleted = filters?.isDeleted === true ? true : { $ne: true };

    if (filters?.title) query.title = { $regex: filters.title, $options: 'i' };
    if (filters?.createdBy)
      query.createdBy = new Types.ObjectId(filters.createdBy);
    if (filters?.isPublished != null) query.isPublished = filters.isPublished;
    if (filters?.scope) query.scope = filters.scope;
    if (filters?.courseId)
      query.courseId = new Types.ObjectId(filters.courseId);
    if (filters?.chapterId)
      query.chapterId = new Types.ObjectId(filters.chapterId);

    const sortObj: Record<string, 1 | -1> = {};
    if (sort?.length) {
      for (const s of sort)
        sortObj[s.orderBy as string] = s.order === 'asc' ? 1 : -1;
    } else {
      sortObj.createdAt = -1;
    }

    const [docs, total] = await Promise.all([
      this.model.find(query).sort(sortObj).skip(offset).limit(limit).exec(),
      this.model.countDocuments(query).exec(),
    ]);
    return [this.mapper.toDomainArray(docs), total];
  }

  async create(data: Partial<Exam>): Promise<Exam> {
    const doc = await this.model.create({
      title: data.title,
      description: data.description ?? null,
      scope: data.scope,
      courseId: new Types.ObjectId(data.courseId!),
      chapterId: data.chapterId ? new Types.ObjectId(data.chapterId) : null,
      createdBy: new Types.ObjectId(data.createdBy!),
      questionIds: (data.questionIds ?? []).map((id) => new Types.ObjectId(id)),
      totalQuestions: data.totalQuestions ?? 0,
      timeLimitSeconds: data.timeLimitSeconds ?? 1800,
      passingScore: data.passingScore ?? 50,
      isPublished: data.isPublished ?? false,
      isDeleted: false,
      deletedAt: null,
    });
    return this.mapper.toDomain(doc);
  }

  async update(id: string, data: Partial<Exam>): Promise<Exam | null> {
    const updateFields: Record<string, unknown> = {
      ...this.mapper.toDocument(data),
    };

    // Handle questionIds separately (ObjectId conversion)
    if (data.questionIds !== undefined) {
      updateFields.questionIds = data.questionIds.map(
        (qid) => new Types.ObjectId(qid),
      );
      updateFields.totalQuestions = data.questionIds.length;
    }

    const doc = await this.model
      .findOneAndUpdate(
        { _id: id, ...NOT_DELETED },
        { $set: updateFields },
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
}
