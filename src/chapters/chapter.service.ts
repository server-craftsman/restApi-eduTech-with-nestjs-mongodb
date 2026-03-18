import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ChapterRepositoryAbstract } from './infrastructure/persistence/document/repositories/chapter.repository.abstract';
import { Chapter } from './domain/chapter';
import { CreateChapterDto, UpdateChapterDto } from './dto';
import { FilterChapterDto, SortChapterDto, ChapterStatisticsDto } from './dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { InfinityPaginationResponseDto } from '../utils/dto/infinity-pagination-response.dto';

@Injectable()
export class ChapterService {
  constructor(private readonly chapterRepository: ChapterRepositoryAbstract) {}

  /**
   * Create a new chapter — TEACHER/ADMIN only
   */
  async create(dto: CreateChapterDto): Promise<Chapter> {
    // Validate required fields
    if (!dto.courseId) {
      throw new BadRequestException('Course ID is required');
    }
    if (!dto.title || dto.title.trim().length === 0) {
      throw new BadRequestException(
        'Chapter title is required and cannot be empty',
      );
    }
    if (dto.orderIndex === undefined || dto.orderIndex === null) {
      throw new BadRequestException('Order index is required');
    }
    if (dto.orderIndex < 0) {
      throw new BadRequestException(
        'Order index must be a non-negative integer',
      );
    }

    // Validate optional fields
    if (dto.description !== undefined && dto.description !== null) {
      if (dto.description.trim().length === 0) {
        throw new BadRequestException(
          'Chapter description cannot be empty if provided',
        );
      }
    }

    return this.chapterRepository.create({
      courseId: dto.courseId,
      title: dto.title.trim(),
      description: dto.description ? dto.description.trim() : null,
      orderIndex: dto.orderIndex,
      isPublished: false, // Draft by default
      isDeleted: false,
    });
  }

  /**
   * Get chapter by ID — all roles can read if published, TEACHER/ADMIN can read drafts
   */
  async findById(id: string): Promise<Chapter | null> {
    return this.chapterRepository.findById(id);
  }

  /**
   * Get all chapters — STUDENT only sees published, TEACHER/ADMIN see all
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: FilterChapterDto | null,
    sort?: SortChapterDto[] | null,
  ): Promise<InfinityPaginationResponseDto<Chapter>> {
    const [items] = await this.chapterRepository.findAllWithFilters(
      limit,
      (page - 1) * limit,
      filters ?? undefined,
      sort ?? undefined,
    );

    return infinityPagination(items, { page, limit });
  }

  /**
   * Update chapter — TEACHER/ADMIN only
   */
  async update(id: string, dto: UpdateChapterDto): Promise<Chapter> {
    const chapter = await this.chapterRepository.findById(id);
    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${id} not found`);
    }

    // Validate field constraints
    if (dto.title !== undefined) {
      if (dto.title.trim().length === 0) {
        throw new BadRequestException('Chapter title cannot be empty');
      }
    }

    if (dto.description !== undefined && dto.description !== null) {
      if (dto.description.trim().length === 0) {
        throw new BadRequestException(
          'Chapter description cannot be empty if provided',
        );
      }
    }

    if (dto.orderIndex !== undefined) {
      if (dto.orderIndex < 0) {
        throw new BadRequestException(
          'Order index must be a non-negative integer',
        );
      }
    }

    if (dto.courseId !== undefined) {
      if (!Types.ObjectId.isValid(dto.courseId)) {
        throw new BadRequestException(
          'Course ID must be a valid MongoDB ObjectId',
        );
      }
    }

    const updateData: Partial<Chapter> = {};
    if (dto.courseId !== undefined) updateData.courseId = dto.courseId;
    if (dto.title !== undefined) updateData.title = dto.title.trim();
    if (dto.description !== undefined)
      updateData.description = dto.description ? dto.description.trim() : null;
    if (dto.orderIndex !== undefined) updateData.orderIndex = dto.orderIndex;
    if (dto.isPublished !== undefined) updateData.isPublished = dto.isPublished;

    const updated = await this.chapterRepository.update(id, updateData);

    if (!updated) {
      throw new NotFoundException(`Chapter with id ${id} not found`);
    }

    return updated;
  }

  /**
   * Update chapter publish status — TEACHER/ADMIN only
   */
  async updatePublishStatus(
    id: string,
    isPublished: boolean,
  ): Promise<Chapter> {
    const chapter = await this.chapterRepository.findById(id);
    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${id} not found`);
    }

    // Validate publish status transition
    if (isPublished && typeof isPublished !== 'boolean') {
      throw new BadRequestException('Publish status must be a boolean value');
    }

    const updated = await this.chapterRepository.update(id, { isPublished });
    if (!updated) {
      throw new NotFoundException(`Chapter with id ${id} not found`);
    }

    return updated;
  }

  /**
   * Soft-delete chapter — ADMIN only
   */
  async delete(id: string): Promise<void> {
    const chapter = await this.chapterRepository.findById(id);
    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${id} not found`);
    }

    return this.chapterRepository.softDelete(id);
  }

  /**
   * Get chapters by course ID — ordered by orderIndex
   */
  async findByCourseId(courseId: string): Promise<Chapter[]> {
    return this.chapterRepository.findByCourseId(courseId);
  }

  /**
   * Reorder chapters within a course — TEACHER/ADMIN only
   */
  async reorderChapters(
    courseId: string,
    chapters: Array<{ id: string; orderIndex: number }>,
  ): Promise<Chapter[]> {
    // Validate all chapters belong to the course
    const existingChapters = await this.findByCourseId(courseId);
    const existingIds = new Set(existingChapters.map((c) => c.id));

    for (const chapter of chapters) {
      if (!existingIds.has(chapter.id)) {
        throw new BadRequestException(
          `Chapter ${chapter.id} does not belong to course ${courseId}`,
        );
      }
    }

    return this.chapterRepository.reorderChapters(courseId, chapters);
  }

  /**
   * Get chapter statistics — ADMIN only
   */
  async getStatistics(): Promise<ChapterStatisticsDto> {
    const stats = await this.chapterRepository.getStatistics();
    const grandTotal = stats.total + stats.deleted;

    return {
      ...stats,
      active: stats.total,
      activePercentage:
        grandTotal > 0
          ? Number(((stats.total / grandTotal) * 100).toFixed(2))
          : 0,
      deletedPercentage:
        grandTotal > 0
          ? Number(((stats.deleted / grandTotal) * 100).toFixed(2))
          : 0,
    };
  }
}
