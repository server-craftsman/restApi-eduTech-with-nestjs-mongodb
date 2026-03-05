import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { GradeLevelRepositoryAbstract } from './infrastructure/persistence/document/repositories/grade-level.repository.abstract';
import { GradeLevel } from './domain/grade-level';
import { BaseService } from '../core/base/base.service';

@Injectable()
export class GradeLevelService extends BaseService {
  constructor(
    private readonly gradeLevelRepository: GradeLevelRepositoryAbstract,
  ) {
    super();
  }

  /**
   * Create a new grade level
   * Validates that name and value are unique
   * @param data - CreateGradeLevelDto with name and value
   * @returns Created GradeLevel
   * @throws BadRequestException if name or value already exists
   */
  async createGradeLevel(
    data: Omit<GradeLevel, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<GradeLevel> {
    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      throw new BadRequestException(
        'Grade level name is required and cannot be empty',
      );
    }
    if (data.value === undefined || data.value === null) {
      throw new BadRequestException('Grade level value is required');
    }

    // Check for duplicate name
    const existingByName = await this.gradeLevelRepository.findByName(
      data.name.trim(),
    );
    if (existingByName) {
      throw new BadRequestException(
        `Grade level with name "${data.name}" already exists`,
      );
    }

    // Check for duplicate value
    const existingByValue = await this.gradeLevelRepository.findByValue(
      data.value,
    );
    if (existingByValue) {
      throw new BadRequestException(
        `Grade level with value ${data.value} already exists`,
      );
    }

    return this.gradeLevelRepository.create({
      name: data.name.trim(),
      value: data.value,
    });
  }

  /**
   * Get grade level by ID
   * @param id - Grade level ID
   * @returns GradeLevel or null if not found
   */
  async getGradeLevelById(id: string): Promise<GradeLevel | null> {
    if (!id) {
      throw new BadRequestException('Grade level ID is required');
    }
    return this.gradeLevelRepository.findById(id);
  }

  /**
   * Get all grade levels
   * @returns Array of all GradeLevel records
   */
  async getAllGradeLevels(): Promise<GradeLevel[]> {
    return this.gradeLevelRepository.findAll();
  }

  /**
   * Update a grade level
   * @param id - Grade level ID
   * @param data - UpdateGradeLevelDto with optional name and value
   * @returns Updated GradeLevel
   * @throws NotFoundException if grade level not found
   * @throws BadRequestException if validation fails
   */
  async updateGradeLevel(
    id: string,
    data: Partial<GradeLevel>,
  ): Promise<GradeLevel | null> {
    // Validate grade level exists
    const existingGradeLevel = await this.gradeLevelRepository.findById(id);
    if (!existingGradeLevel) {
      throw new NotFoundException(`Grade level with id ${id} not found`);
    }

    // Validate at least one field provided
    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'At least one field must be provided for update',
      );
    }

    // Validate name if provided
    if (data.name !== undefined) {
      if (data.name.trim().length === 0) {
        throw new BadRequestException('Grade level name cannot be empty');
      }

      // Check name uniqueness (excluding current record)
      const existingByName = await this.gradeLevelRepository.findByName(
        data.name.trim(),
      );
      if (existingByName && existingByName.id !== id) {
        throw new BadRequestException(
          `Grade level with name "${data.name}" already exists`,
        );
      }
      data.name = data.name.trim();
    }

    // Validate value if provided
    if (data.value !== undefined) {
      const existingByValue = await this.gradeLevelRepository.findByValue(
        data.value,
      );
      if (existingByValue && existingByValue.id !== id) {
        throw new BadRequestException(
          `Grade level with value ${data.value} already exists`,
        );
      }
    }

    return this.gradeLevelRepository.update(id, data);
  }

  /**
   * Delete a grade level (hard delete)
   * @param id - Grade level ID
   * @throws NotFoundException if grade level not found
   */
  async deleteGradeLevel(id: string): Promise<void> {
    const existingGradeLevel = await this.gradeLevelRepository.findById(id);
    if (!existingGradeLevel) {
      throw new NotFoundException(`Grade level with id ${id} not found`);
    }
    return this.gradeLevelRepository.delete(id);
  }

  /**
   * Find grade level by name
   * @param name - Grade level name
   * @returns GradeLevel or null if not found
   */
  async findByName(name: string): Promise<GradeLevel | null> {
    if (!name) {
      throw new BadRequestException('Grade level name is required');
    }
    return this.gradeLevelRepository.findByName(name);
  }

  /**
   * Find grade level by numeric value
   * @param value - Grade level value (0-12)
   * @returns GradeLevel or null if not found
   */
  async findByValue(value: number): Promise<GradeLevel | null> {
    if (value === undefined || value === null) {
      throw new BadRequestException('Grade level value is required');
    }
    return this.gradeLevelRepository.findByValue(value);
  }

  /**
   * Seed 12 grade levels (Grades 0-12 for Vietnamese education system)
   * Only call once during initialization
   * @returns Array of created GradeLevel records
   */
  async seedGradeLevels(): Promise<GradeLevel[]> {
    // Check if already seeded
    const existing = await this.gradeLevelRepository.findAll();
    if (existing.length >= 12) {
      throw new BadRequestException(
        'Grade levels already exist in the database',
      );
    }

    const gradeLevels = [
      { name: 'Mầm non', value: 0 },
      { name: 'Lớp 1', value: 1 },
      { name: 'Lớp 2', value: 2 },
      { name: 'Lớp 3', value: 3 },
      { name: 'Lớp 4', value: 4 },
      { name: 'Lớp 5', value: 5 },
      { name: 'Lớp 6', value: 6 },
      { name: 'Lớp 7', value: 7 },
      { name: 'Lớp 8', value: 8 },
      { name: 'Lớp 9', value: 9 },
      { name: 'Lớp 10', value: 10 },
      { name: 'Lớp 11', value: 11 },
      { name: 'Lớp 12', value: 12 },
    ];

    const created: GradeLevel[] = [];
    for (const data of gradeLevels) {
      const result = await this.gradeLevelRepository.create(data);
      created.push(result);
    }

    return created;
  }
}
