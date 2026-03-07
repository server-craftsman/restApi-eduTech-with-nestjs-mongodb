import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiTrainingStatus } from '../../enums';

export class TrainingDataDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  question!: string;

  @ApiProperty()
  answer!: string;

  @ApiPropertyOptional({ nullable: true })
  subject?: string | null;

  @ApiPropertyOptional({ nullable: true })
  gradeLevel?: string | null;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty({
    enum: AiTrainingStatus,
    enumName: 'AiTrainingStatus',
  })
  status!: AiTrainingStatus;

  @ApiProperty()
  createdBy!: string;

  @ApiPropertyOptional({ nullable: true })
  reviewedBy?: string | null;

  @ApiPropertyOptional({ nullable: true })
  reviewedAt?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  reviewNote?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
