import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';
import { CloudinaryAsset } from '../../core/interfaces';

export class UpdateUserAvatarDto {
  @ApiProperty({
    type: 'object',
    properties: {
      publicId: {
        type: 'string',
        description: 'Cloudinary public_id from uploads module',
        example: 'edutech/avatars/abc123def456',
      },
      url: {
        type: 'string',
        description: 'Cloudinary secure HTTPS URL from uploads module',
        example:
          'https://res.cloudinary.com/my-cloud/image/upload/v1234567890/edutech/avatars/abc123def456.jpg',
      },
    },
    required: ['publicId', 'url'],
    description: 'Avatar object from POST /uploads response',
  })
  @IsObject()
  avatarUrl!: CloudinaryAsset;
}
