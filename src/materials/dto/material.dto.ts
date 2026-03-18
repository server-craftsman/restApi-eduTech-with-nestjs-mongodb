import { ApiProperty } from '@nestjs/swagger';
import { BaseAuditDto } from '../../core/dto';
import { MaterialType } from './create-material.dto';
import { UploadUrlDto } from '../../uploads/dto';

/**
 * DTO for material response
 */
export class MaterialDto extends BaseAuditDto {
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
}
