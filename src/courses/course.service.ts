import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CourseRepositoryAbstract } from './infrastructure/persistence/document/repositories/course.repository.abstract';
import { Course } from './domain/course';
import { GradeLevel, CourseStatus } from '../enums';
import { QueryCourseDto, SortOrder } from './dto';
import { BaseService } from '../core/base/base.service';

@Injectable()
export class CourseService extends BaseService {
  constructor(private readonly courseRepository: CourseRepositoryAbstract) {
    super();
  }

  async createCourse(
    data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Course> {
    // Validate required fields
    if (!data.title || data.title.trim().length === 0) {
      throw new BadRequestException(
        'Course title is required and cannot be empty',
      );
    }
    if (!data.description || data.description.trim().length === 0) {
      throw new BadRequestException(
        'Course description is required and cannot be empty',
      );
    }
    if (!data.subjectId) {
      throw new BadRequestException('Subject ID is required');
    }
    if (!data.gradeLevelId) {
      throw new BadRequestException('Grade level ID is required');
    }
    if (!data.type) {
      throw new BadRequestException('Course type is required');
    }

    // Validate thumbnailUrl Cloudinary asset
    if (
      !data.thumbnailUrl ||
      !data.thumbnailUrl.publicId ||
      !data.thumbnailUrl.url
    ) {
      throw new BadRequestException(
        'Thumbnail must contain both publicId and url from Cloudinary upload',
      );
    }

    // Automatically set status to Draft for new courses
    const courseData = {
      ...data,
      status: CourseStatus.Draft,
      isDeleted: false,
      deletedAt: null,
      title: data.title.trim(),
      description: data.description.trim(),
    };
    return this.courseRepository.create(courseData);
  }

  async getCourseById(id: string): Promise<Course | null> {
    return this.courseRepository.findByIdNotDeleted(id);
  }

  async getCourseByIdWithDeleted(id: string): Promise<Course | null> {
    return this.courseRepository.findById(id);
  }

  async getAllCourses(): Promise<Course[]> {
    return this.courseRepository.findAllNotDeleted();
  }

  async getAllCoursesWithFilter(query: QueryCourseDto): Promise<{
    courses: Course[];
    total: number;
  }> {
    const filterDto = query.filter || {};
    const sortDto = query.sort || {};

    // Extract filter fields
    const search = filterDto.search;
    const gradeLevel = filterDto.gradeLevel;
    const status = filterDto.status;
    const type = filterDto.type;
    const authorId = filterDto.authorId;
    const subjectId = filterDto.subjectId;
    const sortBy = sortDto.field;
    const sortOrder = sortDto.order;
    const page = query.page;
    const limit = query.limit;

    // Build filter object for MongoDB query
    const filter: Record<string, unknown> = { isDeleted: false };

    if (search) {
      filter['$or'] = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (gradeLevel) {
      filter['gradeLevel'] = gradeLevel;
    }

    if (status) {
      filter['status'] = status;
    }

    if (type) {
      filter['type'] = type;
    }

    if (authorId) {
      filter['authorId'] = authorId;
    }

    if (subjectId) {
      filter['subjectId'] = subjectId;
    }

    // Build sort object
    const sort: Record<string, number> = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === SortOrder.DESC ? -1 : 1;
    } else {
      sort['createdAt'] = -1; // Default sort by creation date descending
    }

    // Get total count
    const total = await this.courseRepository.countByFilter(filter);

    // Get courses with pagination
    let courses: Course[];
    if (page && limit) {
      const skip = (page - 1) * limit;
      courses = await this.courseRepository.findByFilterWithPagination(
        filter,
        sort,
        skip,
        limit,
      );
    } else {
      courses = await this.courseRepository.findByFilter(filter, sort);
    }

    return { courses, total };
  }

  async findByAuthorIdWithFilter(
    authorId: string,
    query: QueryCourseDto,
  ): Promise<{ courses: Course[]; total: number }> {
    const updatedQuery = { ...query, authorId };
    return this.getAllCoursesWithFilter(updatedQuery);
  }

  async findBySubjectIdWithFilter(
    subjectId: string,
    query: QueryCourseDto,
  ): Promise<{ courses: Course[]; total: number }> {
    const updatedQuery = { ...query, subjectId };
    return this.getAllCoursesWithFilter(updatedQuery);
  }

  async updateCourse(
    id: string,
    data: Partial<Course>,
  ): Promise<Course | null> {
    // Validate the course exists
    const existingCourse = await this.courseRepository.findByIdNotDeleted(id);
    if (!existingCourse) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }

    // Validate field constraints
    if (data.title !== undefined) {
      if (data.title.trim().length === 0) {
        throw new BadRequestException('Course title cannot be empty');
      }
      data.title = data.title.trim();
    }

    if (data.description !== undefined) {
      if (data.description.trim().length === 0) {
        throw new BadRequestException('Course description cannot be empty');
      }
      data.description = data.description.trim();
    }

    // Validate thumbnailUrl Cloudinary asset if provided
    if (
      data.thumbnailUrl &&
      (!data.thumbnailUrl.publicId || !data.thumbnailUrl.url)
    ) {
      throw new BadRequestException(
        'Thumbnail must contain both publicId and url from Cloudinary upload',
      );
    }

    // Remove fields that shouldn't be updated directly
    const { ...updateData } = data;
    return this.courseRepository.update(id, updateData);
  }

  async updateCourseStatus(
    id: string,
    status: CourseStatus,
  ): Promise<Course | null> {
    const existingCourse = await this.courseRepository.findByIdNotDeleted(id);
    if (!existingCourse) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }

    // Validate status transition
    if (!Object.values(CourseStatus).includes(status)) {
      throw new BadRequestException(`Invalid course status: ${status}`);
    }

    return this.courseRepository.update(id, { status });
  }

  async softDeleteCourse(id: string): Promise<void> {
    await this.courseRepository.update(id, {
      isDeleted: true,
      deletedAt: new Date(),
    });
  }

  async restoreCourse(id: string): Promise<Course | null> {
    return this.courseRepository.update(id, {
      isDeleted: false,
      deletedAt: null,
    });
  }

  async deleteCourse(id: string): Promise<void> {
    return this.courseRepository.delete(id);
  }

  async findByAuthorId(authorId: string): Promise<Course[]> {
    return this.courseRepository.findByAuthorIdNotDeleted(authorId);
  }

  async findBySubjectId(subjectId: string): Promise<Course[]> {
    return this.courseRepository.findBySubjectIdNotDeleted(subjectId);
  }

  async findPublished(): Promise<Course[]> {
    return this.courseRepository.findByStatusNotDeleted(CourseStatus.Published);
  }

  async findByGradeLevel(gradeLevel: GradeLevel): Promise<Course[]> {
    return this.courseRepository.findByGradeLevelNotDeleted(gradeLevel);
  }

  async getChaptersWithLessons(courseId: string): Promise<any[]> {
    // TODO: Implement actual logic to get chapters with lessons
    return this.courseRepository.getChaptersWithLessons(courseId);
  }

  // Legacy method - deprecated, use updateCourseStatus instead
  async publishCourse(id: string): Promise<Course | null> {
    return this.updateCourseStatus(id, CourseStatus.Published);
  }
}
