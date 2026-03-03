import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubjectIconDto {
  @ApiProperty({
    description: 'Cloudinary public_id',
    example: 'edutech/subjects/xk8v3t2abcdef',
  })
  publicId!: string;

  @ApiProperty({
    description: 'Secure HTTPS URL',
    example:
      'https://res.cloudinary.com/my-cloud/image/upload/v1234/edutech/subjects/xk8v3t2abcdef.svg',
  })
  url!: string;
}

export class SubjectDto {
  @ApiProperty({
    description: 'Subject MongoDB ID',
    example: '65f7d8b2b58d59f90cf59225',
  })
  id!: string;

  @ApiProperty({ description: 'Subject name', example: 'Toán Học' })
  name!: string;

  @ApiProperty({
    description: 'URL-friendly slug (auto-generated from name)',
    example: 'toan-hoc',
  })
  slug!: string;

  @ApiProperty({
    description: 'Subject icon from Cloudinary',
    type: SubjectIconDto,
  })
  iconUrl!: SubjectIconDto;

  @ApiProperty({ description: 'Soft-delete flag', example: false })
  isDeleted!: boolean;

  @ApiPropertyOptional({
    description: 'Soft-delete timestamp — null when active',
    nullable: true,
    type: String,
    format: 'date-time',
    example: null,
  })
  deletedAt?: Date | null;

  @ApiProperty({
    description: 'Creation timestamp',
    type: String,
    format: 'date-time',
    example: '2026-03-03T10:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    type: String,
    format: 'date-time',
    example: '2026-03-03T10:30:00.000Z',
  })
  updatedAt!: Date;
}
