import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { MaterialRepositoryAbstract } from './infrastructure/persistence/document/repositories/material.repository.abstract';
import { Material } from './domain/material';
import { CreateMaterialDto, UpdateMaterialDto } from './dto';

/**
 * Service for managing lesson materials
 * Handles business logic for material CRUD operations and relationships
 */
@Injectable()
export class MaterialService {
  constructor(
    private readonly materialRepository: MaterialRepositoryAbstract,
  ) {}

  /**
   * Create a new material
   * @param dto - Material creation data
   * @returns Created material
   * @throws BadRequestException if validation fails
   */
  async createMaterial(dto: CreateMaterialDto): Promise<Material> {
    // Validate basic constraints
    if (!dto.lessonId || dto.lessonId.trim().length === 0) {
      throw new BadRequestException('Lesson ID is required');
    }

    if (!dto.file || !dto.file.url || dto.file.url.trim().length === 0) {
      throw new BadRequestException('File URL is required and cannot be empty');
    }

    if (dto.title.trim().length < 3) {
      throw new BadRequestException('Title must be at least 3 characters long');
    }

    const materialData: Omit<Material, 'id' | 'createdAt' | 'updatedAt'> = {
      lessonId: dto.lessonId,
      title: dto.title.trim(),
      file: {
        url: dto.file.url,
        fileSize: dto.file.fileSize,
        publicId: dto.file.publicId,
      },
      type: dto.type,
      description: dto.description?.trim(),
      downloadCount: 0,
      isDeleted: false,
      deletedAt: null,
    };

    return this.materialRepository.create(materialData);
  }

  /**
   * Get material by ID
   * @param id - Material ID
   * @returns Material or null if not found
   */
  async getMaterialById(id: string): Promise<Material | null> {
    return this.materialRepository.findById(id);
  }

  /**
   * Get all non-deleted materials
   * @returns Array of materials
   */
  async getAllMaterials(): Promise<Material[]> {
    return this.materialRepository.findAll();
  }

  /**
   * Update an existing material
   * @param id - Material ID
   * @param dto - Partial material update data
   * @returns Updated material
   * @throws NotFoundException if material not found
   * @throws BadRequestException if validation fails
   */
  async updateMaterial(id: string, dto: UpdateMaterialDto): Promise<Material> {
    // Validate material exists
    const material = await this.materialRepository.findById(id);
    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }

    // Validate update constraints
    if (dto.title !== undefined && dto.title.trim().length < 3) {
      throw new BadRequestException('Title must be at least 3 characters long');
    }

    if (
      dto.file !== undefined &&
      (!dto.file.url || dto.file.url.trim().length === 0)
    ) {
      throw new BadRequestException('File URL cannot be empty');
    }

    const updateData: Partial<Material> = {};
    if (dto.title !== undefined) updateData.title = dto.title.trim();
    if (dto.file !== undefined)
      updateData.file = {
        url: dto.file.url,
        fileSize: dto.file.fileSize,
        publicId: dto.file.publicId,
      };
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.description !== undefined)
      updateData.description = dto.description?.trim();

    const updated = await this.materialRepository.update(id, updateData);
    if (!updated) {
      throw new NotFoundException(`Failed to update material with ID ${id}`);
    }
    return updated;
  }

  /**
   * Soft-delete a material
   * @param id - Material ID
   * @throws NotFoundException if material not found
   */
  async deleteMaterial(id: string): Promise<void> {
    const material = await this.materialRepository.findById(id);
    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }
    await this.materialRepository.delete(id);
  }

  /**
   * Get all materials for a lesson
   * @param lessonId - Lesson ID
   * @returns Array of materials in that lesson
   */
  async findByLessonId(lessonId: string): Promise<Material[]> {
    return this.materialRepository.findByLessonId(lessonId);
  }

  /**
   * Increment download counter for a material
   * @param id - Material ID
   * @returns Updated material
   */
  async incrementDownloadCount(id: string): Promise<Material | null> {
    const material = await this.materialRepository.findById(id);
    if (!material) return null;

    const newCount = (material.downloadCount ?? 0) + 1;
    return this.materialRepository.update(id, {
      downloadCount: newCount,
    } as Partial<Material>);
  }

  /**
   * Check if material exists
   * @param id - Material ID
   * @returns true if exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    const material = await this.materialRepository.findById(id);
    return !!material;
  }

  /**
   * Count materials in a lesson
   * @param lessonId - Lesson ID
   * @returns Number of materials
   */
  async countInLesson(lessonId: string): Promise<number> {
    const materials = await this.findByLessonId(lessonId);
    return materials.length;
  }
}
