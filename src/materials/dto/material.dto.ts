import { ApiProperty } from '@nestjs/swagger';
import { MaterialType } from './create-material.dto';
import { UploadUrlDto } from '../../uploads/dto';

/**
 * DTO for material response
 */
export class MaterialDto {
  @ApiProperty({
    description: 'Unique identifier (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  id!: string;

  @ApiProperty({
    description: 'Lesson ID this material belongs to',
    example: '507f1f77bcf86cd799439012',
  })
  lessonId!: string;

  @ApiProperty({
    description: 'Material title',
    example: 'Course Notes PDF',
  })
  title!: string;

  @ApiProperty({
    description: 'File upload information (URL and file size)',
    type: UploadUrlDto,
  })
  file!: UploadUrlDto;

  @ApiProperty({
    description: 'Material type',
    enum: MaterialType,
    example: MaterialType.PDF,
  })
  type!: MaterialType;

  @ApiProperty({
    description: 'Description',
    example: 'Comprehensive course notes',
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    description: 'Number of downloads',
    example: 42,
    nullable: true,
  })
  downloadCount?: number | null;

  @ApiProperty({
    description: 'Soft-delete flag',
    example: false,
  })
  isDeleted!: boolean;

  @ApiProperty({
    description: 'Soft-delete timestamp',
    example: null,
    nullable: true,
  })
  deletedAt?: Date | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-03-05T10:00:00Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-03-05T11:00:00Z',
  })
  updatedAt!: Date;
}
