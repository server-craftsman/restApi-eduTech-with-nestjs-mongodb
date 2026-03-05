import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for file/URL metadata information
 * Used for storing and retrieving file information from uploads
 */
export class FileInfoDto {
  @ApiProperty({
    description: 'File URL (CDN or storage service)',
    example:
      'https://res.cloudinary.com/your-account/video/upload/v1234567890/lessons/intro.mp4',
  })
  url!: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 2097152,
  })
  fileSize!: number;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'video/mp4',
  })
  mimeType!: string;

  @ApiProperty({
    description: 'Last modified date of the file',
    example: '2024-01-15T10:30:00Z',
  })
  lastModified?: Date;
}
