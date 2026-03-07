import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({
    description:
      'Cloudinary public_id — save this value as iconUrl.publicId when creating a subject',
    example: 'edutech/subjects/xk8v3t2abcdef',
  })
  publicId!: string;

  @ApiProperty({
    description:
      'Secure HTTPS URL — save this value as iconUrl.url when creating a subject',
    example:
      'https://res.cloudinary.com/my-cloud/image/upload/v1234567890/edutech/subjects/xk8v3t2abcdef.svg',
  })
  url!: string;

  @ApiProperty({
    description: 'Cloudinary resource type',
    example: 'image',
    enum: ['image', 'video', 'raw'],
  })
  resourceType!: string;

  @ApiProperty({
    description: 'File format/extension',
    example: 'svg',
  })
  format!: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 4096,
  })
  bytes!: number;

  @ApiProperty({
    description: 'Cloudinary folder path where file was stored',
    example: 'edutech',
  })
  folder!: string;

  @ApiPropertyOptional({
    description: 'Image width in pixels (images only)',
    example: 512,
  })
  width?: number;

  @ApiPropertyOptional({
    description: 'Image height in pixels (images only)',
    example: 512,
  })
  height?: number;

  @ApiPropertyOptional({
    description:
      'Video duration in seconds (videos only). ' +
      'Pass this value as video.durationSeconds when creating a lesson — ' +
      'durationSeconds will be auto-filled from it.',
    example: 382,
  })
  durationSeconds?: number;
}
