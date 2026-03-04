import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ParentRelationship } from '../../enums';

export class UpdateParentProfileDto {
  @ApiPropertyOptional({
    description: 'Parent full name',
    example: 'Robert Williams',
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Parent phone number',
    example: '+9876543210',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  // ── Approval-review fields ─────────────────────────────────────────────────

  @ApiPropertyOptional({
    enum: ParentRelationship,
    enumName: 'ParentRelationship',
    description:
      'Relationship to the student (Father / Mother / Guardian / Other)',
    example: ParentRelationship.Father,
  })
  @IsEnum(ParentRelationship)
  @IsOptional()
  relationship?: ParentRelationship | null;

  @ApiPropertyOptional({
    description:
      'National ID card number (CCCD / CMND) for identity verification',
    example: '079200099999',
  })
  @IsString()
  @IsOptional()
  nationalIdNumber?: string | null;

  @ApiPropertyOptional({
    description: 'URL of the uploaded national ID card image',
    example: 'https://example.com/id-card-updated.jpg',
  })
  @IsString()
  @IsOptional()
  nationalIdImageUrl?: string | null;
}
