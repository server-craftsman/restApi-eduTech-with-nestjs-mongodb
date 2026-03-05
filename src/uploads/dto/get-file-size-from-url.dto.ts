import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

/**
 * DTO for retrieving file size from URL
 * Used to fetch file metadata from a remote URL
 */
export class GetFileSizeFromUrlDto {
  @ApiProperty({
    description: 'File URL to retrieve metadata from',
    example:
      'https://res.cloudinary.com/your-account/raw/upload/v1234567890/materials/notes.pdf',
  })
  @IsString({ message: 'URL must be a string' })
  @IsNotEmpty({ message: 'URL is required' })
  @IsUrl({}, { message: 'Must be a valid URL' })
  url!: string;
}
