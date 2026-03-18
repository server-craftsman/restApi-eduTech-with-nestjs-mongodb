import { ApiProperty } from '@nestjs/swagger';
import { BaseStatisticsDto } from '../../core/dto';
import { UserRole } from '../../enums';

/** Per-role document count (used inside UserStatisticsDto.byRole) */
export class UserRoleStatsDto {
  @ApiProperty({
    enum: UserRole,
    enumName: 'UserRole',
    example: UserRole.Student,
  })
  role!: UserRole;

  @ApiProperty({ example: 42 })
  count!: number;
}

/** Response shape for GET /users/admin/stats */
export class UserStatisticsDto extends BaseStatisticsDto {
  @ApiProperty({
    description: 'Count of non-deleted users grouped by role',
    example: {
      STUDENT: 80,
      PARENT: 20,
      TEACHER: 15,
      ADMIN: 5,
    },
  })
  byRole!: Record<string, number>;
}
