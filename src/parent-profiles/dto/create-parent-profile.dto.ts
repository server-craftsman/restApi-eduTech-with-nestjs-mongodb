import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ParentRelationship } from '../../enums';

export class CreateParentProfileDto {
  @ApiProperty({
    description: 'User ID this profile belongs to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: 'Parent full name',
    example: 'Robert Johnson',
  })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({
    description: 'Parent phone number',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  // ── Approval-review fields ─────────────────────────────────────────────────

  @ApiPropertyOptional({
    enum: ParentRelationship,
    enumName: 'ParentRelationship',
    description:
      'Relationship to the student (Father / Mother / Guardian / Other)',
    example: ParentRelationship.Mother,
  })
  @IsEnum(ParentRelationship)
  @IsOptional()
  relationship?: ParentRelationship | null;

  @ApiPropertyOptional({
    description:
      'National ID card number (CCCD / CMND) for identity verification',
    example: '079200012345',
  })
  @IsString()
  @IsOptional()
  nationalIdNumber?: string | null;

  @ApiPropertyOptional({
    description: 'URL of the uploaded national ID card image',
    example: 'https://example.com/id-card.jpg',
  })
  @IsString()
  @IsOptional()
  nationalIdImageUrl?: string | null;
}
