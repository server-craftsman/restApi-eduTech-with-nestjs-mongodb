import { Injectable } from '@nestjs/common';
import { Lesson } from '../lessons/domain/lesson';
import { Material } from '../materials/domain/material';
import { LessonRepositoryAbstract } from '../lessons/infrastructure/persistence/document/repositories/lesson.repository.abstract';
import { MaterialRepositoryAbstract } from '../materials/infrastructure/persistence/document/repositories/material.repository.abstract';
import {
  LessonSearchResultDto,
  MaterialSearchResultDto,
  SearchResultDto,
} from './dto/search-result.dto';
import { SearchQueryDto, SearchType } from './dto/search-query.dto';

@Injectable()
export class SearchService {
  constructor(
    private readonly lessonRepository: LessonRepositoryAbstract,
    private readonly materialRepository: MaterialRepositoryAbstract,
  ) {}

  /**
   * Smart Search: tìm kiếm bài học và tài liệu theo từ khóa
   * @param dto - SearchQueryDto chứa keyword, type, page, limit
   * @returns SearchResultDto với lessons, materials, và thông tin phân trang
   */
  async search(dto: SearchQueryDto): Promise<SearchResultDto> {
    const { keyword, type = SearchType.All, page = 1, limit = 10 } = dto;

    let lessons: Lesson[] = [];
    let totalLessons = 0;
    let materials: Material[] = [];
    let totalMaterials = 0;

    if (type === SearchType.All || type === SearchType.Lessons) {
      [lessons, totalLessons] = await this.lessonRepository.searchByKeyword(
        keyword,
        page,
        limit,
      );
    }

    if (type === SearchType.All || type === SearchType.Materials) {
      [materials, totalMaterials] =
        await this.materialRepository.searchByKeyword(keyword, page, limit);
    }

    const lessonDtos: LessonSearchResultDto[] = lessons.map((l) => ({
      id: l.id,
      chapterId: l.chapterId,
      title: l.title,
      description: l.description,
      video: l.video,
      durationSeconds: l.durationSeconds,
      contentMd: l.contentMd,
      isPreview: l.isPreview,
      orderIndex: l.orderIndex,
      createdAt: l.createdAt,
    }));

    const materialDtos: MaterialSearchResultDto[] = materials.map((m) => ({
      id: m.id,
      lessonId: m.lessonId,
      title: m.title,
      file: m.file,
      type: m.type,
      createdAt: m.createdAt,
    }));

    return {
      keyword,
      lessons: lessonDtos,
      materials: materialDtos,
      totalLessons,
      totalMaterials,
      total: totalLessons + totalMaterials,
      page,
      limit,
    };
  }
}
