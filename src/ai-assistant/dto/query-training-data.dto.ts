import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { AiTrainingStatus } from '../../enums';

export class QueryTrainingDataDto {
  @ApiPropertyOptional({ type: Number, default: 1 })
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ type: Number, default: 10 })
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    enum: AiTrainingStatus,
    enumName: 'AiTrainingStatus',
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(AiTrainingStatus)
  status?: AiTrainingStatus;

  @ApiPropertyOptional({ description: 'Filter by subject (partial match)' })
  @IsOptional()
  @IsString()
  subject?: string;
}
