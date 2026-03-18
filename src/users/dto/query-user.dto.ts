import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import {
  BaseFilterDto,
  BaseSortDto,
  BasePaginationQueryDto,
} from '../../core/dto';
import { User } from '../domain/user';
import { UserRole, EmailVerificationStatus } from '../../enums';

/**
 * FilterUserDto — all fields optional; combine freely.
 * Pass as JSON string: `filters={"roles":["ADMIN"],"isActive":true,"email":"john"}`
 */
export class FilterUserDto extends BaseFilterDto {
  @ApiPropertyOptional({
    enum: UserRole,
    enumName: 'UserRole',
    isArray: true,
    description:
      'OR filter: include users whose role matches any of the supplied values',
    example: [UserRole.Admin, UserRole.Teacher],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[] | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Filter by account active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }): boolean | null | undefined => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean | null | undefined;
  })
  isActive?: boolean | null;

  @ApiPropertyOptional({
    type: Boolean,
    description:
      'Set true to view soft-deleted records (Admin audit only). Defaults to false.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }): boolean | null | undefined => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean | null | undefined;
  })
  declare isDeleted?: boolean | null;

  @ApiPropertyOptional({
    enum: EmailVerificationStatus,
    enumName: 'EmailVerificationStatus',
    description: 'Filter by email verification status',
    example: EmailVerificationStatus.Verified,
  })
  @IsOptional()
  @IsEnum(EmailVerificationStatus)
  emailVerificationStatus?: EmailVerificationStatus | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Partial case-insensitive email match',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  email?: string | null;
}

/**
 * SortUserDto — one sort criterion. Supply an array to sort by multiple fields.
 * Example: `sort=[{"orderBy":"role","order":"asc"},{"orderBy":"createdAt","order":"desc"}]`
 */
export class SortUserDto extends BaseSortDto {
  @ApiProperty({
    type: String,
    description: 'Field to sort by (must be a valid key of the User entity)',
    example: 'createdAt',
    enum: [
      'id',
      'email',
      'role',
      'isActive',
      'isDeleted',
      'emailVerificationStatus',
      'createdAt',
      'updatedAt',
    ],
  })
  @IsString()
  declare orderBy: keyof User;

  @ApiProperty({
    enum: ['asc', 'desc'],
    description: 'Sort direction',
    example: 'desc',
  })
  @IsEnum(['asc', 'desc'])
  declare order: 'asc' | 'desc';
}

export class QueryUserDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    type: String,
    description:
      'JSON-encoded FilterUserDto. Example: `{"roles":["ADMIN","TEACHER"],"isActive":true,"email":"john"}`',
    example: '{"roles":["ADMIN"],"isActive":true}',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value
      ? plainToInstance(FilterUserDto, JSON.parse(value as string))
      : undefined,
  )
  @ValidateNested()
  @Type(() => FilterUserDto)
  filters?: FilterUserDto | null;

  @ApiPropertyOptional({
    type: String,
    description:
      'JSON-encoded SortUserDto[]. Example: `[{"orderBy":"role","order":"asc"},{"orderBy":"createdAt","order":"desc"}]`',
    example: '[{"orderBy":"createdAt","order":"desc"}]',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value
      ? plainToInstance(SortUserDto, JSON.parse(value as string))
      : undefined,
  )
  @ValidateNested({ each: true })
  @Type(() => SortUserDto)
  sort?: SortUserDto[] | null;
}
