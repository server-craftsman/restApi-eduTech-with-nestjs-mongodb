import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, EmailVerificationStatus, GradeLevel } from '../../enums';

// ── Profile DTOs ──────────────────────────────────────────────────────────────

export class StudentProfileDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  fullName!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  gender?: string | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  dateOfBirth?: Date | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  schoolName?: string | null;

  @ApiPropertyOptional({
    enum: GradeLevel,
    enumName: 'GradeLevel',
    nullable: true,
  })
  gradeLevel?: GradeLevel | null;

  @ApiProperty()
  diamondBalance!: number;

  @ApiProperty()
  xpTotal!: number;

  @ApiProperty()
  currentStreak!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class TeacherProfileDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  fullName!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  bio?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class ParentProfileDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  phoneNumber!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class AuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
  role!: UserRole;

  @ApiPropertyOptional({ type: String, nullable: true })
  avatarUrl?: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({
    enum: EmailVerificationStatus,
    enumName: 'EmailVerificationStatus',
  })
  emailVerificationStatus!: EmailVerificationStatus;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  // Profile dựa trên role — chỉ 1 trong 3 sẽ có giá trị
  @ApiPropertyOptional({ type: StudentProfileDto })
  studentProfile?: StudentProfileDto | null;

  @ApiPropertyOptional({ type: TeacherProfileDto })
  teacherProfile?: TeacherProfileDto | null;

  @ApiPropertyOptional({ type: ParentProfileDto })
  parentProfile?: ParentProfileDto | null;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;

  @ApiPropertyOptional()
  sessionId?: string;

  @ApiPropertyOptional()
  message?: string;
}
