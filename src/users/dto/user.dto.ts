import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseAuditDto } from '../../core/dto';
import { UserRole, EmailVerificationStatus } from '../../enums';

export class UserDto extends BaseAuditDto {
  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
  role!: UserRole;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'https://cdn.example.com/avatar.png',
  })
  avatarUrl?: string | null;

  @ApiProperty({ description: 'Whether the account is active' })
  isActive!: boolean;

  @ApiProperty({
    enum: EmailVerificationStatus,
    enumName: 'EmailVerificationStatus',
  })
  emailVerificationStatus!: EmailVerificationStatus;

  @ApiPropertyOptional({ type: String, nullable: true })
  emailVerificationToken?: string | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  emailVerificationExpires?: Date | null;
}
