/**
 * Example: Optimized Search Service với Redis Cache
 * Áp dụng cache cho Smart Search 2.0
 */

import { Injectable } from '@nestjs/common';
import { CacheService, createSearchCacheKey, CACHE_TTL } from '@core/cache';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResultDto } from './dto/search-result.dto';
import { UserRole } from '@enums';

@Injectable()
export class OptimizedSearchService {
  constructor(
    private cacheService: CacheService,
    private baseSearchService: SearchService, // existing search service
  ) {}

  /**
   * Cached search - tự động cache search results
   * Hit ratio: 70%+ cho repeated queries
   */
  async searchWithCache(
    dto: SearchQueryDto,
    currentUserRole?: UserRole,
  ): Promise<SearchResultDto> {
    // Generate cache key từ search parameters
    const cacheKey = createSearchCacheKey(
      dto.keyword,
      {
        types: dto.types?.join(','),
        page: dto.page,
        limit: dto.limit,
        sortBy: dto.sortBy,
      },
      currentUserRole,
    );

    // Try get from cache first
    return this.cacheService.getOrFetch(
      cacheKey,
      // Fetch từ database nếu không có cache
      () => this.baseSearchService.search(dto, currentUserRole),
      // Cache for 5 minutes
      CACHE_TTL.SEARCH_RESULTS,
    );
  }

  /**
   * Invalidate search cache khi có changes
   * Gọi khi: lessons/courses/materials được tạo/update/delete
   */
  async invalidateSearchCache(): Promise<void> {
    // Xóa tất cả search:* keys
    const deleted = await this.cacheService.invalidatePattern('search:');
    console.log(`Invalidated ${deleted} search cache entries`);
  }
}

/**
 * Example Usage trong Lesson Service
 */
@Injectable()
export class LessonServiceWithCache {
  constructor(
    private lessonRepository: LessonRepositoryAbstract,
    private cacheService: CacheService,
    private optimizedSearchService: OptimizedSearchService,
  ) {}

  /**
   * Cache-aside pattern untuk single lesson
   */
  async findById(id: string): Promise<Lesson | null> {
    const key = `lesson:${id}`;

    return this.cacheService.getOrFetch(
      key,
      () => this.lessonRepository.findById(id),
      CACHE_TTL.LESSONS,
    );
  }

  /**
   * Cache list queries dengan filters
   */
  async findAll(
    query: QueryLessonDto,
  ): Promise<InfinityPaginationResponseDto<LessonDto>> {
    const cacheKey = createCacheKey(
      'lessons:all',
      query.page || 1,
      query.limit || 10,
      JSON.stringify(query.filters),
    );

    return this.cacheService.getOrFetch(
      cacheKey,
      () => this.lessonRepository.findAllWithFilters(
        query.limit,
        (query.page - 1) * query.limit,
        query.filters,
        query.sort,
      ),
      CACHE_TTL.LESSONS,
    );
  }

  /**
   * Create + invalidate caches
   */
  async create(dto: CreateLessonDto, userId: string): Promise<Lesson> {
    const lesson = await this.lessonRepository.create({
      ...dto,
      userId,
    });

    // Invalidate related caches
    await Promise.all([
      this.cacheService.invalidatePattern('lessons:'),
      this.cacheService.invalidatePattern(`chapter:${lesson.chapterId}`),
      this.optimizedSearchService.invalidateSearchCache(),
    ]);

    return lesson;
  }

  /**
   * Update + invalidate caches
   */
  async update(id: string, dto: UpdateLessonDto): Promise<Lesson> {
    const lesson = await this.lessonRepository.update(id, dto);

    // Invalidate specific keys
    await Promise.all([
      this.cacheService.delete(`lesson:${id}`),
      this.cacheService.invalidatePattern('lessons:'),
      this.cacheService.invalidatePattern(`chapter:${lesson.chapterId}`),
      this.optimizedSearchService.invalidateSearchCache(),
    ]);

    return lesson;
  }

  /**
   * Delete + invalidate caches
   */
  async delete(id: string): Promise<void> {
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) throw new NotFoundException('Lesson not found');

    await this.lessonRepository.softDelete(id);

    // Invalidate related caches
    await Promise.all([
      this.cacheService.delete(`lesson:${id}`),
      this.cacheService.invalidatePattern('lessons:'),
      this.cacheService.invalidatePattern(`chapter:${lesson.chapterId}`),
      this.optimizedSearchService.invalidateSearchCache(),
    ]);
  }
}

/**
 * Example Usage trong Controller
 */
@Controller('lessons')
@UseGuards(JwtAuthGuard)
@ApiTags('Lessons')
export class LessonControllerOptimized extends BaseController {
  constructor(
    private lessonService: LessonServiceWithCache,
  ) {
    super();
  }

  /**
   * GET /lessons
   * Auto-cached response
   * Headers: X-Cache: HIT/MISS
   */
  @Get()
  @ApiOperation({ summary: 'Get lessons with cache' })
  async findAll(
    @Query() query: QueryLessonDto,
    @Res() res: Response,
  ): Promise<Response> {
    const data = await this.lessonService.findAll(query);
    return this.sendSuccess(res, data, 'Lessons retrieved successfully');
  }

  /**
   * GET /lessons/:id
   * Cached by lesson ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get lesson by ID with cache' })
  async findById(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    const lesson = await this.lessonService.findById(id);
    if (!lesson) {
      return this.sendError(
        res,
        'Lesson not found',
        'Not Found',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.sendSuccess(res, lesson, 'Lesson retrieved successfully');
  }
}
