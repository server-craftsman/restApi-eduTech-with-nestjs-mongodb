# Base DTO Quick Reference Card

## Import Statement

```typescript
import {
  BaseAuditDto,
  BaseCreateDto,
  BaseUpdateDto,
  BaseFilterDto,
  BaseSortDto,
  BasePaginatedResponseDto,
  BasePaginationQueryDto,
  BaseStatisticsDto,
  BaseTimestampsDto,
  createPaginatedResponse,
} from '../../core/dto';
```

## When to Use Which Base DTO

| Use Case | Extend | Contains |
| --- | --- | --- |
| Entity Response | `BaseAuditDto` | `id`, `isDeleted`, `deletedAt`, `createdAt`, `updatedAt` |
| Create Payload | `BaseCreateDto` | Nothing (extend with required fields) |
| Update Payload | `BaseUpdateDto` | Nothing (extend with optional fields) |
| List Query Params | `BasePaginationQueryDto` | `page`, `limit` |
| Filter Query | `BaseFilterDto` | `isDeleted` (extend with custom filters) |
| Sorting | `BaseSortDto` | `orderBy`, `order` |
| Paginated Response | `BasePaginatedResponseDto<T>` | `data`, `total`, `page`, `limit`, `totalPages`, etc. |
| Timestamps Only | `BaseTimestampsDto` | `createdAt`, `updatedAt` |
| Statistics | `BaseStatisticsDto` | `total`, `deleted`, `active`, percentages |

## DTO Checklist Template

```typescript
// ✅ Response DTO
export class EntityDto extends BaseAuditDto {
  @ApiProperty()
  field1!: type;
  @ApiPropertyOptional()
  field2?: type;
  // id, isDeleted, deletedAt, createdAt, updatedAt inherited
}

// ✅ Create DTO
export class CreateEntityDto extends BaseCreateDto {
  @ApiProperty()
  @IsRequired()
  field1!: type;
  @ApiPropertyOptional()
  @IsOptional()
  field2?: type;
}

// ✅ Update DTO
export class UpdateEntityDto extends BaseUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  field1?: type;
  @ApiPropertyOptional()
  @IsOptional()
  field2?: type;
}

// ✅ Filter DTO
export class FilterEntityDto extends BaseFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  field1?: type;
  // isDeleted inherited for soft-delete admin access
}

// ✅ Query DTO
export class QueryEntityDto extends BasePaginationQueryDto {
  @IsOptional()
  @Transform(...)
  @Type(() => FilterEntityDto)
  filters?: FilterEntityDto;

  @IsOptional()
  @Transform(...)
  @Type(() => SortEntityDto)
  sort?: SortEntityDto[];
}

// ✅ Statistics DTO
export class EntityStatisticsDto extends BaseStatisticsDto {
  @ApiProperty()
  byField!: Record<string, number>;
  // total, deleted, active, percentages inherited
}
```

## Common Code Snippets

### Paginated List Service

```typescript
async findAll(
  query: QueryEntityDto,
): Promise<BasePaginatedResponseDto<EntityDto>> {
  const page = query.page || 1;
  const limit = query.limit || 10;
  this.validatePagination(page, limit);

  const offset = this.calculateSkip(page, limit);
  const [items, total] = await this.repository.findAll(
    limit,
    offset,
    query.filters,
    query.sort,
  );

  return createPaginatedResponse(items, total, page, limit);
}
```

### Paginated List Controller

```typescript
@Get()
@ApiResponse({ status: 200, type: InfinityPaginationResponse(EntityDto) })
async findAll(
  @Query() query: QueryEntityDto,
  @Res() res: Response,
): Promise<Response> {
  const data = await this.service.findAll(query);
  return this.sendSuccess(res, data, 'Items retrieved successfully');
}
```

### Filter DTO with Multiple Types

```typescript
export class FilterEntityDto extends BaseFilterDto {
  // Array field (OR logic)
  @IsOptional()
  @IsArray()
  @IsEnum(Status, { each: true })
  statuses?: Status[];

  // Boolean field (needs @Transform)
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  isActive?: boolean;

  // String field (partial match)
  @IsOptional()
  @IsString()
  searchTerm?: string;

  // Enum field
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  // isDeleted inherited from BaseFilterDto
}
```

### Repository with Filters

```typescript
async findAllWithFilters(
  limit: number,
  offset: number,
  filters?: FilterEntityDto,
  sort?: SortEntityDto[],
): Promise<[EntityDto[], number]> {
  const query: Record<string, any> = {};

  // Soft-delete gate (ALWAYS)
  query.isDeleted = filters?.isDeleted === true ? true : { $ne: true };

  // Apply filters
  if (filters?.statuses?.length) query.status = { $in: filters.statuses };
  if (filters?.isActive != null) query.isActive = filters.isActive;
  if (filters?.searchTerm) query.name = { $regex: filters.searchTerm, $options: 'i' };

  // Build sort
  const sortObj = sort?.length
    ? Object.fromEntries(sort.map((s) => [s.orderBy, s.order === 'asc' ? 1 : -1]))
    : { createdAt: -1 };

  const [docs, total] = await Promise.all([
    this.model.find(query).sort(sortObj).skip(offset).limit(limit).exec(),
    this.model.countDocuments(query).exec(),
  ]);

  return [this.mapper.toDomainArray(docs), total];
}
```

### Statistics Endpoint

```typescript
// DTO
export class EntityStatisticsDto extends BaseStatisticsDto {
  byStatus!: Record<string, number>;
}

// Service
async getStatistics(): Promise<EntityStatisticsDto> {
  const stats = await this.repository.getStatistics();
  return {
    ...stats,
    deletedPercentage: (stats.deleted / stats.total) * 100,
    activePercentage: (stats.active / stats.total) * 100,
  };
}

// Controller
@Get('admin/stats')
@ApiResponse({ status: 200, type: EntityStatisticsDto })
async getStatistics(@Res() res: Response): Promise<Response> {
  const stats = await this.service.getStatistics();
  return this.sendSuccess(res, stats, 'Statistics retrieved');
}
```

## API Request/Response Examples

### Create Entity

```json
POST /entities
{
  "field1": "value1",
  "field2": "value2"
}

200 OK
{
  "success": true,
  "data": {
    "id": "mongo-id",
    "field1": "value1",
    "field2": "value2",
    "isDeleted": false,
    "deletedAt": null,
    "createdAt": "2026-03-18T10:00:00Z",
    "updatedAt": "2026-03-18T10:00:00Z"
  }
}
```

### List with Filters & Pagination

```json
GET /entities?page=1&limit=10&filters={"statuses":["ACTIVE"],"isActive":true}&sort=[{"orderBy":"createdAt","order":"desc"}]

200 OK
{
  "success": true,
  "data": {
    "data": [...],
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Statistics

```json
GET /entities/admin/stats

200 OK
{
  "success": true,
  "data": {
    "total": 95,
    "deleted": 5,
    "deletedPercentage": 5.26,
    "active": 90,
    "activePercentage": 94.74,
    "byStatus": {
      "ACTIVE": 70,
      "INACTIVE": 20,
      "ARCHIVED": 5
    }
  }
}
```

## Swagger Decorator Checklist

```typescript
// Always include these for DTOs
@ApiProperty({ enum: Enum, enumName: 'EnumName' })          // Enum fields
@ApiPropertyOptional({ nullable: true })                     // Nullable optional
@ApiProperty({ type: [SubDto] })                             // Array of DTOs

// Always include these for endpoints
@ApiOperation({ summary: 'Short description' })
@ApiResponse({ status: 200, type: ResponseDto })
@ApiResponse({ status: 404, description: 'Not found' })
@ApiBearerAuth()                                              // Protected endpoints
@ApiExtraModels(FilterDto, SortDto, StatsDto)               // Auxiliary DTOs

// Always include for controllers
@ApiTags('EntityName')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiExtraModels(FilterDto, SortDto, StatsDto)
```

## Don't Forget

- ❌ **Don't** duplicate `id`, timestamps in custom DTOs - inherit from Base
- ❌ **Don't** create endpoints like `GET /search` - use filters instead
- ❌ **Don't** forget `@Transform` for boolean query params
- ❌ **Don't** include `enumName` only in some places
- ✅ **Do** extend Base DTOs for consistency
- ✅ **Do** use `createPaginatedResponse()` helper
- ✅ **Do** apply soft-delete gate in all queries
- ✅ **Do** document every endpoint with `@ApiOperation` + `@ApiResponse`

---

**Quick Reference Version:** 1.0.0
