import { Injectable, NotFoundException } from '@nestjs/common';
import { SortOrder } from 'mongoose';
import { SubjectRepositoryAbstract } from './infrastructure/persistence/document/repositories/subject.repository.abstract';
import { Subject } from './domain/subject';
import { BaseCrudService } from '../core/base/base.crud.service';
import { buildVietnameseRegexQuery } from '../core/constants';
import {
  SubjectDocument,
  SubjectDocumentType,
} from './infrastructure/persistence/document/schemas/subject.schema';
import { CreateSubjectDto, UpdateSubjectDto, QuerySubjectDto } from './dto';
import { CacheService, CACHE_KEYS } from '../core/cache';

@Injectable()
export class SubjectService extends BaseCrudService<
  Subject,
  SubjectDocument,
  SubjectDocumentType
> {
  constructor(
    protected readonly subjectRepository: SubjectRepositoryAbstract,
    private readonly cacheService: CacheService,
  ) {
    super(subjectRepository);
  }

  private async invalidateSubjectCaches(): Promise<void> {
    await Promise.all([
      this.cacheService.invalidatePattern(CACHE_KEYS.SUBJECTS_ALL),
      this.cacheService.invalidatePattern(CACHE_KEYS.SUBJECT),
      this.cacheService.invalidatePattern(CACHE_KEYS.COURSES_ALL),
      this.cacheService.invalidatePattern(CACHE_KEYS.SEARCH),
    ]);
  }

  // ── Slug helpers ───────────────────────────────────────────────────────────

  /**
   * Generate a URL-friendly slug from a name.
   * Supports Vietnamese diacritics and converts to kebab-case.
   *
   * Examples:
   *   "Toán Học"          → "toan-hoc"
   *   "Ngữ Văn Việt Nam" → "ngu-van-viet-nam"
   *   "Advanced Math"      → "advanced-math"
   */
  private generateSlug(name: string): string {
    const map: Record<string, string> = {
      à: 'a',
      á: 'a',
      ả: 'a',
      ã: 'a',
      ạ: 'a',
      ă: 'a',
      ằ: 'a',
      ắ: 'a',
      ẳ: 'a',
      ẵ: 'a',
      ặ: 'a',
      â: 'a',
      ầ: 'a',
      ấ: 'a',
      ẩ: 'a',
      ẫ: 'a',
      ậ: 'a',
      đ: 'd',
      è: 'e',
      é: 'e',
      ẻ: 'e',
      ẽ: 'e',
      ẹ: 'e',
      ê: 'e',
      ề: 'e',
      ế: 'e',
      ể: 'e',
      ễ: 'e',
      ệ: 'e',
      ì: 'i',
      í: 'i',
      ỉ: 'i',
      ĩ: 'i',
      ị: 'i',
      ò: 'o',
      ó: 'o',
      ỏ: 'o',
      õ: 'o',
      ọ: 'o',
      ô: 'o',
      ồ: 'o',
      ố: 'o',
      ổ: 'o',
      ỗ: 'o',
      ộ: 'o',
      ơ: 'o',
      ờ: 'o',
      ớ: 'o',
      ở: 'o',
      ỡ: 'o',
      ợ: 'o',
      ù: 'u',
      ú: 'u',
      ủ: 'u',
      ũ: 'u',
      ụ: 'u',
      ư: 'u',
      ừ: 'u',
      ứ: 'u',
      ử: 'u',
      ữ: 'u',
      ự: 'u',
      ỳ: 'y',
      ý: 'y',
      ỷ: 'y',
      ỹ: 'y',
      ỵ: 'y',
    };
    return name
      .toLowerCase()
      .split('')
      .map((c) => map[c] ?? c)
      .join('')
      .replace(/[^a-z0-9\s-]/g, '') // strip special chars
      .trim()
      .replace(/\s+/g, '-') // spaces → hyphens
      .replace(/-+/g, '-'); // collapse multiple hyphens
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  async getAllSubjects(): Promise<Subject[]> {
    return this.subjectRepository.findAllSubjects();
  }

  async getAllSubjectsWithFilter(
    query: QuerySubjectDto,
  ): Promise<{ subjects: Subject[]; total: number }> {
    const { filters, sort, page = 1, limit = 10 } = query;

    // ── Build filter with mandatory soft-delete gate ───────────────────────
    const filter: Record<string, unknown> = {};
    // Show deleted only when caller explicitly sets isDeleted=true (Admin audit)
    filter['isDeleted'] = filters?.isDeleted === true ? true : { $ne: true };

    if (filters?.name) filter['name'] = buildVietnameseRegexQuery(filters.name);
    if (filters?.slug) filter['slug'] = filters.slug;
    if (filters?.slugContains)
      filter['slug'] = buildVietnameseRegexQuery(filters.slugContains);

    // ── Build sort (default: newest first) ─────────────────────────────
    const sortQuery: Record<string, SortOrder | { $meta: 'textScore' }> = {};
    if (sort?.length) {
      for (const item of sort) {
        sortQuery[item.orderBy as string] = (
          item.order === 'desc' ? -1 : 1
        ) as SortOrder;
      }
    } else {
      sortQuery['createdAt'] = -1 as SortOrder;
    }

    const total = await this.count(filter);
    const skip = this.calculateSkip(page, limit);
    const subjects = await this.findByFilterWithPagination(
      filter,
      sortQuery,
      skip,
      limit,
    );

    return { subjects, total };
  }

  async getSubjectById(id: string): Promise<Subject> {
    const subject = await this.findById(id);
    if (!subject) {
      throw new NotFoundException(`Subject with id ${id} not found`);
    }
    return subject;
  }

  async getSubjectBySlug(slug: string): Promise<Subject> {
    const subject = await this.subjectRepository.findBySlug(slug);
    if (!subject) {
      throw new NotFoundException(`Subject with slug "${slug}" not found`);
    }
    return subject;
  }

  /**
   * Create a new subject.
   * Slug is auto-generated from name — not accepted from the client.
   * Validates subject name uniqueness and icon URL requirements.
   */
  async createSubject(dto: CreateSubjectDto): Promise<Subject> {
    // Validate icon URL has required fields
    if (!dto.iconUrl?.publicId || !dto.iconUrl?.url) {
      throw new Error('Icon URL must contain both publicId and url');
    }

    const slug = this.generateSlug(dto.name);

    // Check for duplicate slug
    const existingSubject = await this.subjectRepository.findBySlug(slug);
    if (existingSubject) {
      throw new Error(
        `Subject with name "${dto.name}" already exists (slug: ${slug})`,
      );
    }

    const created = await this.subjectRepository.create({
      name: dto.name,
      slug,
      iconUrl: dto.iconUrl,
    });

    await this.invalidateSubjectCaches();
    return created;
  }

  /**
   * Update a subject by ID.
   * If name is changed, slug is automatically regenerated.
   * Validates slug uniqueness and ensures at least one field is updated.
   */
  async updateSubject(id: string, dto: UpdateSubjectDto): Promise<Subject> {
    const subject = await this.findById(id);
    if (!subject) {
      throw new NotFoundException(`Subject with id ${id} not found`);
    }

    // Ensure at least one field is being updated
    if (!dto.name && !dto.iconUrl) {
      throw new Error(
        'At least one field (name or iconUrl) must be provided for update',
      );
    }

    const updateData: Partial<Subject> = {};

    if (dto.name !== undefined) {
      const newSlug = this.generateSlug(dto.name);

      // Check for slug collision with another subject
      if (newSlug !== subject.slug) {
        const duplicateSubject =
          await this.subjectRepository.findBySlug(newSlug);
        if (duplicateSubject) {
          throw new Error(
            `Subject with name "${dto.name}" already exists (slug: ${newSlug})`,
          );
        }
      }

      updateData.name = dto.name;
      updateData.slug = newSlug;
    }

    if (dto.iconUrl !== undefined) {
      if (!dto.iconUrl.publicId || !dto.iconUrl.url) {
        throw new Error('Icon URL must contain both publicId and url');
      }
      updateData.iconUrl = dto.iconUrl;
    }

    const updated = await this.update(id, updateData);
    if (!updated) {
      throw new NotFoundException(`Subject with id ${id} not found`);
    }

    await this.invalidateSubjectCaches();

    return updated;
  }

  async softDeleteSubject(id: string): Promise<void> {
    const subject = await this.findById(id);
    if (!subject) {
      throw new NotFoundException(`Subject with id ${id} not found`);
    }
    await this.softDelete(id);
    await this.invalidateSubjectCaches();
  }

  async restoreSubject(id: string): Promise<Subject> {
    const restored = await this.restore(id);
    if (!restored) {
      throw new NotFoundException(
        `Subject with id ${id} not found or is not deleted`,
      );
    }
    await this.invalidateSubjectCaches();
    return restored;
  }
}
