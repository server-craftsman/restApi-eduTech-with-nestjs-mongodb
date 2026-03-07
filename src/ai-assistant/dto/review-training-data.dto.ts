import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AiTrainingStatus } from '../../enums';

export class ReviewTrainingDataDto {
  @ApiProperty({
    enum: AiTrainingStatus,
    enumName: 'AiTrainingStatus',
    description: 'Approve or reject the training data entry',
    example: AiTrainingStatus.Approved,
  })
  @IsEnum(AiTrainingStatus)
  status!: AiTrainingStatus;

  @ApiPropertyOptional({
    description: 'Review note or rejection reason',
    example: 'Good example, approved for training.',
  })
  @IsOptional()
  @IsString()
  reviewNote?: string;
}
