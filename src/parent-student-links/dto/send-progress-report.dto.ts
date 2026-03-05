import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ReportPeriod } from './progress-report-period.dto';

/** Body sent by a parent/admin to trigger an immediate progress report for one child */
export class SendProgressReportDto {
  @ApiProperty({
    description:
      'The parent-student link ID identifying which child to report on',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  linkId!: string;

  @ApiPropertyOptional({
    enum: ReportPeriod,
    enumName: 'ReportPeriod',
    description: 'Report period — defaults to weekly',
    example: ReportPeriod.Weekly,
  })
  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod;
}
