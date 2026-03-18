/**
 * EXAMPLE: Complete User Module Implementation with Base DTOs
 *
 * This file demonstrates how to use Base DTOs across a complete module.
 * Structure: src/users/ (example implementation)
 *
 * File Organization:
 * - dto/: All DTO classes extending Base DTOs
 * - domain/: Domain interfaces
 * - infrastructure/: Repositories & persistence
 * - users.service.ts: Business logic
 * - users.controller.ts: HTTP endpoints
 */

// ===== ENUMS (src/enums/user-role.enum.ts) =====
export enum UserRole {
  Student = 'STUDENT',
  Teacher = 'TEACHER',
  Admin = 'ADMIN',
  Parent = 'PARENT',
}

export enum EmailVerificationStatus {
  Pending = 'PENDING',
  Verified = 'VERIFIED',
  Failed = 'FAILED',
}

// ===== DOMAIN (src/users/domain/user.ts) =====
import { UserRole, EmailVerificationStatus } from '../../enums';

export interface User {
  id: string;
  email: string;
  passwordHash?: string | null;
  role: UserRole;
  avatarUrl?: string | null;
  isActive: boolean;
  emailVerificationStatus: EmailVerificationStatus;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ===== DTOs (src/users/dto/) =====

// 1. Response DTO - Extends BaseAuditDto
import {
  BaseAuditDto,
  BaseCreateDto,
  BaseUpdateDto,
  BaseFilterDto,
  BasePaginationQueryDto,
  BaseStatisticsDto,
} from '../../core/dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

export class UserDto extends BaseAuditDto {
  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
  role!: UserRole;

  @ApiPropertyOptional({ type: String, nullable: true })
  avatarUrl?: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ enum: EmailVerificationStatus, enumName: 'EmailVerificationStatus' })
  emailVerificationStatus!: EmailVerificationStatus;
}

// 2. Create DTO - Extends BaseCreateDto
export class CreateUserDto extends BaseCreateDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
  @IsEnum(UserRole)
  role!: UserRole;
}

// 3. Update DTO - Extends BaseUpdateDto
export class UpdateUserDto extends BaseUpdateDto {
  @ApiPropertyOptional({ example: 'newemail@example.com' })
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

// 4. Status Update DTO - Explicit status change (no toggle)
export class UpdateUserStatusDto extends BaseUpdateDto {
  @ApiProperty({
    description: 'Set the active status of the user explicitly',
    example: true,
  })
  isActive!: boolean;
}

// 5. Filter DTO - Extends BaseFilterDto
export class FilterUserDto extends BaseFilterDto {
  @ApiPropertyOptional({
    enum: UserRole,
    enumName: 'UserRole',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  isActive?: boolean;
}

// 6. Sort DTO - For multi-column sorting
export class SortUserDto {
  @ApiProperty({
    enum: ['id', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
  })
  @IsString()
  orderBy!: keyof User;

  @ApiProperty({ enum: ['asc', 'desc'] })
  @IsEnum(['asc', 'desc'])
  order!: 'asc' | 'desc';
}

// 7. Query DTO - Extends BasePaginationQueryDto
export class QueryUserDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    type: String,
    description: 'JSON-encoded FilterUserDto',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value ? plainToInstance(FilterUserDto, JSON.parse(value)) : undefined,
  )
  @ValidateNested()
  @Type(() => FilterUserDto)
  filters?: FilterUserDto;

  @ApiPropertyOptional({
    type: String,
    description: 'JSON-encoded SortUserDto[]',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value ? plainToInstance(SortUserDto, JSON.parse(value)) : undefined,
  )
  @ValidateNested({ each: true })
  @Type(() => SortUserDto)
  sort?: SortUserDto[];
}

// 8. Statistics DTO - Extends BaseStatisticsDto
export class UserStatisticsDto extends BaseStatisticsDto {
  @ApiProperty({
    type: 'object',
    example: { STUDENT: 100, TEACHER: 40, ADMIN: 5 },
  })
  byRole!: Record<string, number>;

  @ApiProperty({
    type: 'object',
    example: { VERIFIED: 140, PENDING: 5 },
  })
  byVerificationStatus!: Record<string, number>;
}

// ===== SERVICE (src/users/users.service.ts) =====
import { Injectable } from '@nestjs/common';
import { BaseService } from '../../core/base/base.service';
import { BasePaginatedResponseDto, createPaginatedResponse } from '../../core/dto';

@Injectable()
export class UsersService extends BaseService {
  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  async create(dto: CreateUserDto | Record<string, unknown>): Promise<User> {
    return this.userRepository.create(dto as Partial<User>);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async findAll(
    query: QueryUserDto,
  ): Promise<BasePaginatedResponseDto<UserDto>> {
    const { page = 1, limit = 10 } = query;
    this.validatePagination(page, limit);

    const offset = this.calculateSkip(page, limit);
    const [users, total] = await this.userRepository.findAllWithFilters(
      limit,
      offset,
      query.filters,
      query.sort,
    );

    // Use helper to create paginated response
    return createPaginatedResponse(users, total, page, limit);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.update(id, dto);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async updateStatus(id: string, isActive: boolean): Promise<User> {
    return this.update(id, { isActive });
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.softDelete(id);
  }

  async getStatistics(): Promise<UserStatisticsDto> {
    return this.userRepository.getStatistics();
  }
}

// ===== CONTROLLER (src/users/users.controller.ts) =====
import { Controller, Get, Post, Put, Patch, Delete, UseGuards } from '@nestjs/common';
import { BaseController } from '../../core/base/base.controller';
import { JwtAuthGuard, RolesGuard, Roles } from '../../auth';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiExtraModels(FilterUserDto, SortUserDto, UserStatisticsDto)
export class UsersController extends BaseController {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  @Post()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Create user (Admin only)' })
  @ApiResponse({ status: 201, type: UserDto })
  async create(
    @Body() dto: CreateUserDto,
    @Res() res: Response,
  ): Promise<Response> {
    const user = await this.usersService.create(dto);
    return this.sendSuccess(
      res,
      user,
      'User created successfully',
      HttpStatus.CREATED,
    );
  }

  @Get()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'List users (paginated, filterable)' })
  @ApiResponse({ status: 200, type: InfinityPaginationResponse(UserDto) })
  async findAll(
    @Query() query: QueryUserDto,
    @Res() res: Response,
  ): Promise<Response> {
    const data = await this.usersService.findAll(query);
    return this.sendSuccess(res, data, 'Users retrieved successfully');
  }

  @Get('admin/stats')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'User statistics (Admin only)' })
  @ApiResponse({ status: 200, type: UserStatisticsDto })
  async getStatistics(@Res() res: Response): Promise<Response> {
    const stats = await this.usersService.getStatistics();
    return this.sendSuccess(res, stats, 'Statistics retrieved successfully');
  }

  @Get(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    const user = await this.usersService.findById(id);
    if (!user)
      return this.sendError(
        res,
        'User not found',
        'NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    return this.sendSuccess(res, user, 'User retrieved successfully');
  }

  @Put(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, type: UserDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Res() res: Response,
  ): Promise<Response> {
    const user = await this.usersService.update(id, dto);
    return this.sendSuccess(res, user, 'User updated successfully');
  }

  @Patch(':id/status')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Update user active status' })
  @ApiResponse({ status: 200, type: UserDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @Res() res: Response,
  ): Promise<Response> {
    const user = await this.usersService.updateStatus(id, dto.isActive);
    return this.sendSuccess(
      res,
      user,
      `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    );
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Soft-delete user' })
  @ApiResponse({ status: 200, description: 'User soft-deleted successfully' })
  async delete(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    await this.usersService.delete(id);
    return this.sendSuccess(res, null, 'User deleted successfully');
  }
}

// ===== API USAGE EXAMPLES =====

/*
1. CREATE USER
   POST /users
   {
     "email": "student@example.com",
     "password": "SecurePass123",
     "role": "STUDENT"
   }

   Response:
   {
     "success": true,
     "data": {
       "id": "507f1f77bcf86cd799439011",
       "email": "student@example.com",
       "role": "STUDENT",
       "avatarUrl": null,
       "isActive": true,
       "emailVerificationStatus": "PENDING",
       "isDeleted": false,
       "deletedAt": null,
       "createdAt": "2026-03-18T10:30:00Z",
       "updatedAt": "2026-03-18T10:30:00Z"
     }
   }

2. LIST USERS (WITH FILTERS & PAGINATION)
   GET /users?page=1&limit=10&filters={"roles":["ADMIN","TEACHER"],"isActive":true}&sort=[{"orderBy":"createdAt","order":"desc"}]

   Response:
   {
     "success": true,
     "data": {
       "data": [...],
       "total": 45,
       "page": 1,
       "limit": 10,
       "totalPages": 5,
       "hasNextPage": true,
       "hasPreviousPage": false
     }
   }

3. GET STATISTICS
   GET /users/admin/stats

   Response:
   {
     "success": true,
     "data": {
       "total": 150,
       "deleted": 5,
       "deletedPercentage": 3.33,
       "active": 145,
       "activePercentage": 96.67,
       "byRole": {
         "STUDENT": 100,
         "TEACHER": 40,
         "ADMIN": 5,
         "PARENT": 5
       },
       "byVerificationStatus": {
         "VERIFIED": 140,
         "PENDING": 10
       }
     }
   }

4. UPDATE USER
   PUT /users/507f1f77bcf86cd799439011
   {
     "email": "newemail@example.com",
     "role": "TEACHER"
   }

5. UPDATE STATUS
   PATCH /users/507f1f77bcf86cd799439011/status
   {
     "isActive": false
   }

6. SOFT DELETE
   DELETE /users/507f1f77bcf86cd799439011
*/
