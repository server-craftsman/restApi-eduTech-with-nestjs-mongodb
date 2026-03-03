import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

/**
 * Cloudinary file reference — obtain values from POST /uploads response.
 *
 * Workflow:
 *   1. Call POST /uploads with your image file
 *   2. Copy the returned `publicId` and `url` into this object
 *   3. Pass this object as `iconUrl` in CreateSubjectDto / UpdateSubjectDto
 */
export class IconUrlDto {
  @ApiProperty({
    description:
      'Cloudinary public_id — copy from POST /uploads response field `publicId`',
    example: 'edutech/subjects/xk8v3t2abcdef',
  })
  @IsString()
  @IsNotEmpty()
  publicId!: string;

  @ApiProperty({
    description:
      'Secure HTTPS URL — copy from POST /uploads response field `url`',
    example:
      'https://res.cloudinary.com/my-cloud/image/upload/v1234/edutech/subjects/xk8v3t2abcdef.svg',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url!: string;
}
