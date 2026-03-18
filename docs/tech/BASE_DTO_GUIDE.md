# Core Base DTO Guide

Hướng dẫn sử dụng Base DTO classes cho toàn bộ project EduTech Backend.

## Tổng Quan

Base DTOs được thiết kế để:

- ✅ Chuẩn hóa cấu trúc DTO trên toàn project
- ✅ Giảm code duplication
- ✅ Đảm bảo consistency trong API responses
- ✅ Hỗ trợ soft-delete pattern
- ✅ Tích hợp pagination, filtering, sorting

## Available Base DTOs

### 1. **BaseAuditDto** - Cho Entity Response DTOs

Sử dụng khi response cần trả về toàn bộ entity với audit fields.

**Fields:**
- `id: string` - MongoDB document ID
- `isDeleted: boolean` - Soft-delete flag
- `deletedAt?: Date | null` - Timestamp khi bị xóa
- `createdAt: Date` - Timestamp tạo
- `updatedAt: Date` - Timestamp cập nhật lần cuối

**Ví dụ:**

```typescript
// src/users/dto/user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { BaseAuditDto } from '../../core/dto';
import { UserRole, EmailVerificationStatus } from '../../enums';

export class UserDto extends BaseAuditDto {
  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
  role!: UserRole;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({
    enum: EmailVerificationStatus,
    enumName: 'EmailVerificationStatus',
  })
  emailVerificationStatus!: EmailVerificationStatus;
}
```

### 2. **BaseTimestampsDto** - Cho Timestamps Only

Sử dụng khi chỉ cần timestamp fields, không cần soft-delete.

**Fields:**
- `createdAt: Date`
- `updatedAt: Date`

**Ví dụ:**

```typescript
// Khi có sub-entity không cần soft-delete
export class CommentDto extends BaseTimestampsDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  content!: string;
}
```

### 3. **BaseCreateDto** - Cho Create Payload DTOs

Sử dụng cho POST body. Không include auto-generated fields.

**Quy tắc:**
- Không có: `id`, `createdAt`, `updatedAt`, `isDeleted`, `deletedAt`
- Tất cả required fields đều @IsRequired()
- Sử dụng @ApiProperty() cho tất cả fields

**Ví dụ:**

```typescript
// src/users/dto/create-user.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BaseCreateDto } from '../../core/dto';

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
```

### 4. **BaseUpdateDto** & **BasePatchDto** - Cho Update Payloads

Sử dụng cho PUT (full update) và PATCH (partial update).

**Quy tắc:**
- Tất cả fields là @IsOptional()
- Không include immutable fields: `id`, `createdAt`, `updatedAt`, `isDeleted`, `deletedAt`
- Sử dụng @ApiPropertyOptional()

**Ví dụ:**

```typescript
// src/users/dto/update-user.dto.ts
import { IsOptional, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseUpdateDto } from '../../core/dto';

export class UpdateUserDto extends BaseUpdateDto {
  @ApiPropertyOptional({ example: 'newemail@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayName?: string;
}
```

### 5. **BasePaginationQueryDto** - Cho Pagination Query Parameters

Sử dụng cho GET list endpoints.

**Fields:**
- `page?: number = 1` - Page number (1-indexed)
- `limit?: number = 10` - Items per page

**Ví dụ:**

```typescript
// src/users/dto/query-user.dto.ts
import { BasePaginationQueryDto } from '../../core/dto';

export class QueryUserDto extends BasePaginationQueryDto {
  // Extend with custom filter/sort fields
}
```

### 6. **BasePaginatedResponseDto** - Cho Paginated Responses

Generic paginated response wrapper.

**Fields:**
- `data: T[]` - Array of items
- `total: number` - Total count
- `page: number` - Current page
- `limit: number` - Items per page
- `totalPages: number` - Total pages
- `hasNextPage: boolean`
- `hasPreviousPage: boolean`

**Ví dụ:**

```typescript
// Service method
async findAll(query: QueryUserDto): Promise<BasePaginatedResponseDto<UserDto>> {
  const [users, total] = await this.userRepository.findAllWithFilters(
    query.limit || 10,
    this.calculateSkip(query.page || 1, query.limit || 10),
  );

  return createPaginatedResponse(
    users,
    total,
    query.page || 1,
    query.limit || 10,
  );
}

// Controller
@Get()
@ApiResponse({ status: 200, type: InfinityPaginationResponse(UserDto) })
async findAll(@Query() query: QueryUserDto, @Res() res: Response) {
  const data = await this.usersService.findAll(query);
  return this.sendSuccess(res, data, 'Users retrieved successfully');
}
```

### 7. **BaseFilterDto** - Cho Filter Queries

Base class cho tất cả FilterDtos.

**Built-in Fields:**
- `isDeleted?: boolean` - Soft-delete audit filtering (Admin only)

**Quy tắc:**
- Tất cả custom filter fields là @IsOptional()
- Array fields sử dụng OR semantics: `@IsArray() @IsEnum(E, { each: true })`
- Boolean fields sử dụng @Transform để coerce string 'true'/'false'
- Export từ module: `export class FilterUserDto extends BaseFilterDto`

**Ví dụ:**

```typescript
// src/users/dto/query-user.dto.ts
import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { BaseFilterDto } from '../../core/dto';
import { UserRole } from '../../enums';

export class FilterUserDto extends BaseFilterDto {
  @ApiPropertyOptional({
    enum: UserRole,
    enumName: 'UserRole',
    isArray: true,
    example: [UserRole.Admin],
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
```

### 8. **BaseSortDto** - Cho Sorting

Base class cho sorting queries.

**Fields:**
- `orderBy: string` - Field name to sort by
- `order: 'asc' | 'desc'` - Sort direction

**Ví dụ:**

```typescript
// src/users/dto/query-user.dto.ts
import { BaseSortDto } from '../../core/dto';

// SortUserDto không cần extend, sử dụng BaseSortDto directly
// hoặc tạo custom nếu cần validate specific fields:
export class SortUserDto extends BaseSortDto {
  @ApiProperty({
    enum: ['id', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
  })
  @IsEnum(['id', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'])
  override orderBy!: keyof User;
}
```

### 9. **BaseStatisticsDto** - Cho Statistics/Aggregate Responses

Base class cho admin dashboard stats.

**Fields:**
- `total: number` - Total non-deleted count
- `deleted: number` - Soft-deleted count
- `deletedPercentage: number`
- `active: number` - Active count
- `activePercentage: number`

**Ví dụ:**

```typescript
// src/users/dto/user-statistics.dto.ts
import { BaseStatisticsDto, BaseBreakdownStatisticsDto } from '../../core/dto';

export class UserRoleStatsDto {
  @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
  role!: UserRole;

  @ApiProperty()
  count!: number;
}

export class UserStatisticsDto extends BaseStatisticsDto {
  @ApiProperty({
    type: 'object',
    description: 'Breakdown by role',
    example: { STUDENT: 100, TEACHER: 40, ADMIN: 5 },
  })
  byRole!: Record<string, number>;

  @ApiProperty({
    type: 'object',
    description: 'Breakdown by verification status',
  })
  byVerificationStatus!: Record<string, number>;
}
```

## Common Patterns

### Pattern 1: Complete Entity Response

```typescript
// Entity DTO extending BaseAuditDto
export class UserDto extends BaseAuditDto {
  email!: string;
  role!: UserRole;
  isActive!: boolean;
  // createdAt, updatedAt, isDeleted, deletedAt inherited from BaseAuditDto
}
```

### Pattern 2: Paginated List Endpoint

```typescript
// Query DTO
export class QueryUserDto extends BasePaginationQueryDto {
  // Add custom filters if needed
}

// Service
async findAll(query: QueryUserDto): Promise<BasePaginatedResponseDto<UserDto>> {
  const { page = 1, limit = 10 } = query;
  const offset = (page - 1) * limit;

  const [users, total] = await this.userRepository.findAllWithFilters(
    limit,
    offset,
  );

  return createPaginatedResponse(users, total, page, limit);
}
```

### Pattern 3: Filtered & Sorted List

```typescript
// Query DTO với Filter + Sort
export class QueryUserDto extends BasePaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) =>
    value ? plainToInstance(FilterUserDto, JSON.parse(value)) : undefined,
  )
  @ValidateNested()
  @Type(() => FilterUserDto)
  filters?: FilterUserDto;

  @IsOptional()
  @Transform(({ value }) =>
    value ? plainToInstance(SortUserDto, JSON.parse(value)) : undefined,
  )
  @ValidateNested({ each: true })
  @Type(() => SortUserDto)
  sort?: SortUserDto[];
}

// Repository
async findAllWithFilters(
  limit: number,
  offset: number,
  filters?: FilterUserDto,
  sort?: SortUserDto[],
): Promise<[UserDto[], number]> {
  const query: Record<string, any> = {};

  // Soft-delete gate
  query.isDeleted = filters?.isDeleted === true ? true : { $ne: true };

  // Apply filters
  if (filters?.roles?.length) query.role = { $in: filters.roles };
  if (filters?.isActive != null) query.isActive = filters.isActive;

  // Build sort
  const sortObj = sort?.length
    ? Object.fromEntries(
        sort.map((s) => [s.orderBy, s.order === 'asc' ? 1 : -1]),
      )
    : { createdAt: -1 };

  const [docs, total] = await Promise.all([
    this.model.find(query).sort(sortObj).skip(offset).limit(limit).exec(),
    this.model.countDocuments(query).exec(),
  ]);

  return [this.mapper.toDomainArray(docs), total];
}
```

## Migration Checklist

Khi refactor existing modules để sử dụng Base DTOs:

- [ ] Response DTOs extend **BaseAuditDto** (nếu có audit fields)
- [ ] Create DTOs extend **BaseCreateDto**
- [ ] Update DTOs extend **BaseUpdateDto**
- [ ] Filter DTOs extend **BaseFilterDto**
- [ ] Paginated responses sử dụng **BasePaginatedResponseDto<T>**
- [ ] Statistics DTOs extend **BaseStatisticsDto**
- [ ] Query DTOs extend **BasePaginationQueryDto**
- [ ] Cập nhật barrel export từ `core/dto/index.ts`
- [ ] Xóa các base fields trong entity DTOs (id, createdAt, updatedAt, etc.)
- [ ] Thêm JSDoc comments giải thích từng DTO

## Best Practices

### ✅ DO:

1. **Extend Base DTOs** cho consistency
   ```typescript
   export class UserDto extends BaseAuditDto { ... }
   ```

2. **Sử dụng @Transform** cho boolean query params
   ```typescript
   @Transform(({ value }) =>
     value === 'true' ? true : value === 'false' ? false : value,
   )
   ```

3. **Include enumName** trong @ApiProperty/@ApiPropertyOptional
   ```typescript
   @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
   ```

4. **Return paginated responses** từ list endpoints
   ```typescript
   return createPaginatedResponse(data, total, page, limit);
   ```

### ❌ DON'T:

1. **Tạo base DTO mới** nếu Base classes tồn tại
2. **Duplicate audit fields** trong custom DTOs
3. **Include immutable fields** (id, timestamps) trong Create/Update DTOs
4. **Forget @ApiExtraModels** cho auxiliary DTOs (Filter, Sort, Stats)

## API Endpoint Examples

### Example 1: Create User

```
POST /users
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepass123",
  "role": "STUDENT"
}

Response:
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "STUDENT",
    "isActive": true,
    "isDeleted": false,
    "deletedAt": null,
    "createdAt": "2026-03-18T10:30:00Z",
    "updatedAt": "2026-03-18T10:30:00Z"
  }
}
```

### Example 2: List Users with Filters

```
GET /users?page=1&limit=10&filters={"roles":["ADMIN"],"isActive":true}&sort=[{"orderBy":"createdAt","order":"desc"}]

Response:
{
  "success": true,
  "data": {
    "data": [...],
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

### Example 3: Admin Statistics

```
GET /users/admin/stats

Response:
{
  "success": true,
  "data": {
    "total": 145,
    "deleted": 5,
    "deletedPercentage": 3.33,
    "active": 140,
    "activePercentage": 96.67,
    "byRole": {
      "STUDENT": 100,
      "TEACHER": 40,
      "ADMIN": 5
    }
  }
}
```

---

**Last Updated:** March 18, 2026  
**Version:** 1.0.0
