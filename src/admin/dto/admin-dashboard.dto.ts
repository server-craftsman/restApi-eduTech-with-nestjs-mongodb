import { ApiProperty } from '@nestjs/swagger';

export class UserStatsDto {
  @ApiProperty({ description: 'Total non-deleted users', example: 1234 })
  total!: number;

  @ApiProperty({
    description: 'Count per role',
    example: { STUDENT: 1000, TEACHER: 200, ADMIN: 10, PARENT: 24 },
  })
  byRole!: Record<string, number>;

  @ApiProperty({ example: 1100 })
  active!: number;

  @ApiProperty({ example: 134 })
  inactive!: number;

  @ApiProperty({ example: 5 })
  deleted!: number;

  @ApiProperty({
    description: 'Teachers awaiting admin approval',
    example: 15,
  })
  pendingApprovals!: number;
}

export class CourseStatsDto {
  @ApiProperty({ example: 150 })
  total!: number;

  @ApiProperty({ example: 80 })
  published!: number;

  @ApiProperty({ example: 20 })
  underReview!: number;

  @ApiProperty({ example: 40 })
  draft!: number;

  @ApiProperty({ example: 5 })
  rejected!: number;

  @ApiProperty({ example: 2 })
  archived!: number;

  @ApiProperty({ example: 3 })
  deleted!: number;
}

export class RevenueStatsDto {
  @ApiProperty({
    description: 'Sum of all SUCCESS transactions (VND)',
    example: 50000000,
  })
  totalRevenue!: number;

  @ApiProperty({ example: 300 })
  successfulTransactions!: number;

  @ApiProperty({ example: 10 })
  pendingTransactions!: number;

  @ApiProperty({ example: 5 })
  failedTransactions!: number;
}

export class SubscriptionStatsDto {
  @ApiProperty({ example: 310 })
  total!: number;

  @ApiProperty({ example: 280 })
  active!: number;

  @ApiProperty({ example: 25 })
  expired!: number;

  @ApiProperty({ example: 5 })
  cancelled!: number;
}

export class AdminDashboardDto {
  @ApiProperty({ type: UserStatsDto })
  users!: UserStatsDto;

  @ApiProperty({ type: CourseStatsDto })
  courses!: CourseStatsDto;

  @ApiProperty({ type: RevenueStatsDto })
  revenue!: RevenueStatsDto;

  @ApiProperty({ type: SubscriptionStatsDto })
  subscriptions!: SubscriptionStatsDto;

  @ApiProperty({
    description: 'Timestamp when stats were generated',
    example: '2026-03-12T00:00:00.000Z',
  })
  generatedAt!: string;
}
