import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CourseDocument, CourseDocumentType } from '../schemas/course.schema';
import { CourseRepositoryAbstract } from './course.repository.abstract';
import { CourseMapper } from '../mappers/course.mapper';
import { Course } from '../../../../domain/course';
import { GradeLevel, CourseStatus } from '../../../../../enums';
import { BaseRepositoryImpl } from '../../../../../core/base/base.repository.impl';
import { FilterCourseDto, SortCourseDto } from '../../../../dto';
import {
  NOT_DELETED,
  buildVietnameseRegexQuery,
} from '../../../../../core/constants';

@Injectable()
export class CourseRepository
  extends BaseRepositoryImpl<Course, CourseDocument, CourseDocumentType>
  implements CourseRepositoryAbstract
{
  constructor(
    @InjectModel(CourseDocument.name)
    protected readonly model: Model<CourseDocumentType>,
    protected readonly mapper: CourseMapper,
  ) {
    super(model, mapper);
  }

  async findByIdNotDeleted(id: string): Promise<Course | null> {
    const doc = await this.model.findOne({
      _id: id,
      ...NOT_DELETED,
    });
    return doc ? this.mapper.toDomain(doc) : null;
  }

  // ── Unified filter/paginate method ────────────────────────────────────────
  async findAllWithFilters(
    limit = 10,
    offset = 0,
    filters?: FilterCourseDto,
    sort?: SortCourseDto[],
  ): Promise<[Course[], number]> {
    const query: Record<string, any> = {};

    // Soft-delete gate: show deleted only when caller explicitly passes isDeleted=true
    query.isDeleted = filters?.isDeleted === true ? true : { $ne: true };

    if (filters?.subjectId)
      query.subjectId = new Types.ObjectId(filters.subjectId);
    if (filters?.gradeLevelId)
      query.gradeLevelId = new Types.ObjectId(filters.gradeLevelId);
    if (filters?.authorId)
      query.authorId = new Types.ObjectId(filters.authorId);
    if (filters?.status) query.status = filters.status;
    if (filters?.type) query.type = filters.type;
    if (filters?.search)
      query.$or = [
        { title: buildVietnameseRegexQuery(filters.search) },
        { description: buildVietnameseRegexQuery(filters.search) },
      ];

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

  async findAllCourses(): Promise<Course[]> {
    const docs = await this.model.find();
    return this.mapper.toDomainArray(docs);
  }

  async findAllNotDeleted(): Promise<Course[]> {
    const docs = await this.model.find({ isDeleted: { $ne: true } });
    return this.mapper.toDomainArray(docs);
  }

  // Override create to handle ObjectId conversions
  async create(
    data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Course> {
    const createData = {
      subjectId: new Types.ObjectId(data.subjectId),
      gradeLevelId: new Types.ObjectId(data.gradeLevelId),
      authorId: new Types.ObjectId(data.authorId),
      title: data.title,
      description: data.description,
      thumbnailUrl: data.thumbnailUrl,
      status: data.status || CourseStatus.Draft,
      type: data.type || 'Free',
      isDeleted: data.isDeleted ?? false,
      deletedAt: data.deletedAt || null,
    };

    const doc = await this.model.create(createData);
    return this.mapper.toDomain(doc);
  }

  // Override update to handle ObjectId conversions
  async update(id: string, data: Partial<Course>): Promise<Course | null> {
    const updateData: Record<string, unknown> = {};

    if (data.subjectId)
      updateData.subjectId = new Types.ObjectId(data.subjectId);
    if (data.gradeLevelId)
      updateData.gradeLevelId = new Types.ObjectId(data.gradeLevelId);
    if (data.authorId) updateData.authorId = new Types.ObjectId(data.authorId);
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.thumbnailUrl) updateData.thumbnailUrl = data.thumbnailUrl;

    // Handle new fields
    if (data.status) updateData.status = data.status;
    if (data.type) updateData.type = data.type;
    if (data.approvalNote !== undefined)
      updateData.approvalNote = data.approvalNote;
    if (data.isDeleted !== undefined) updateData.isDeleted = data.isDeleted;
    if (data.deletedAt !== undefined) updateData.deletedAt = data.deletedAt;

    // Use base repository update method
    return super.update(id, updateData as Partial<Course>);
  }

  // Filter and search methods - use base repository methods
  async findByFilter(
    filter: Record<string, any>,
    sort?: Record<string, any>,
  ): Promise<Course[]> {
    return super.findByFilter(filter, sort);
  }

  async findByFilterWithPagination(
    filter: Record<string, any>,
    sort: Record<string, any>,
    skip: number,
    limit: number,
  ): Promise<Course[]> {
    return super.findByFilterWithPagination(filter, sort, skip, limit);
  }

  async countByFilter(filter: Record<string, any>): Promise<number> {
    return this.count(filter);
  }

  // Author-related methods
  async findByAuthorId(authorId: string): Promise<Course[]> {
    const docs = await this.model.find({
      authorId: new Types.ObjectId(authorId),
    });
    return this.mapper.toDomainArray(docs);
  }

  async findByAuthorIdNotDeleted(authorId: string): Promise<Course[]> {
    const docs = await this.model.find({
      authorId: new Types.ObjectId(authorId),
      isDeleted: { $ne: true },
    });
    return this.mapper.toDomainArray(docs);
  }

  // Subject-related methods
  async findBySubjectId(subjectId: string): Promise<Course[]> {
    const docs = await this.model.find({
      subjectId: new Types.ObjectId(subjectId),
    });
    return this.mapper.toDomainArray(docs);
  }

  async findBySubjectIdNotDeleted(subjectId: string): Promise<Course[]> {
    const docs = await this.model.find({
      subjectId: new Types.ObjectId(subjectId),
      isDeleted: { $ne: true },
    });
    return this.mapper.toDomainArray(docs);
  }

  // Status-related methods
  async findPublished(): Promise<Course[]> {
    const docs = await this.model.find({
      status: CourseStatus.Published,
      isDeleted: { $ne: true },
    });
    return this.mapper.toDomainArray(docs);
  }

  async findByStatusNotDeleted(status: CourseStatus): Promise<Course[]> {
    const docs = await this.model.find({
      status,
      isDeleted: { $ne: true },
    });
    return this.mapper.toDomainArray(docs);
  }

  // Grade level methods
  async findByGradeLevel(gradeLevel: GradeLevel): Promise<Course[]> {
    const docs = await this.model.find({
      gradeLevel,
    });
    return this.mapper.toDomainArray(docs);
  }

  async findByGradeLevelNotDeleted(gradeLevel: GradeLevel): Promise<Course[]> {
    const docs = await this.model.find({
      gradeLevel,
      isDeleted: { $ne: true },
      status: CourseStatus.Published, // Only return published courses for students
    });
    return this.mapper.toDomainArray(docs);
  }

  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  async getChaptersWithLessons(courseId: string): Promise<any[]> {
    // TODO: Implement actual logic to populate chapters and lessons
    // For now, return empty array to prevent compilation error
    return [];
  }
}
