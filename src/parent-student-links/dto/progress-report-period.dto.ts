import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum ReportPeriod {
  Weekly = 'weekly',
  Monthly = 'monthly',
}

/** Query param controlling whether to generate a weekly or monthly report */
export class ProgressReportPeriodDto {
  @ApiPropertyOptional({
    enum: ReportPeriod,
    enumName: 'ReportPeriod',
    description: 'Report period length. Defaults to "weekly".',
    default: ReportPeriod.Weekly,
  })
  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod;
}
