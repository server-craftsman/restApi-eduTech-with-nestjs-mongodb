import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/**
 * Explicit publish/unpublish DTO — sets the status deliberately
 */
export class UpdateChapterPublishStatusDto {
  @ApiProperty({
    description: 'Set the published status of the chapter explicitly',
    example: true,
  })
  @IsBoolean()
  isPublished!: boolean;
}
