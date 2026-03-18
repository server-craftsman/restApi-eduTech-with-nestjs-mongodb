import { ApiProperty } from '@nestjs/swagger';
import { BaseAuditDto } from '../../core/dto';

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

export class SubjectDto extends BaseAuditDto {
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
}
