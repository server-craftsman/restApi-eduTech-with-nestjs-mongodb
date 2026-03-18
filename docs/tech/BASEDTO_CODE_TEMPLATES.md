# BaseDTO Code Snippets & Templates

Copy-paste ready code templates for quickly creating new modules with Base DTOs.

## Complete Module Setup

### 1. Response DTO Template

File: `src/module-name/dto/module-name.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseAuditDto } from '../../core/dto';
import { SomeEnum, AnotherEnum } from '../../enums';

/**
 * Response DTO for Module entity
 * Extends BaseAuditDto to automatically include:
 * - id: string
 * - isDeleted: boolean
 * - deletedAt?: Date | null
 * - createdAt: Date
 * - updatedAt: Date
 */
export class ModuleNameDto extends BaseAuditDto {
  @ApiProperty({
    description: 'Field description',
    example: 'example-value',
  })
  fieldName!: string;

  @ApiProperty({
    enum: SomeEnum,
    enumName: 'SomeEnum',
    example: SomeEnum.Value1,
  })
  enumField!: SomeEnum;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Optional nullable field',
    example: null,
  })
  optionalField?: string | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
  })
  optionalNumber?: number | null;

  @ApiProperty({ type: Boolean })
  isActive!: boolean;
}
```

### 2. Create DTO Template

File: `src/module-name/dto/create-module-name.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseCreateDto } from '../../core/dto';
import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { SomeEnum } from '../../enums';

/**
 * Create DTO for Module entity
 * DO NOT include:
 * - id (auto-generated)
 * - createdAt, updatedAt, isDeleted, deletedAt (auto-handled)
 */
export class CreateModuleNameDto extends BaseCreateDto {
  @ApiProperty({
    description: 'Required field',
    example: 'value',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fieldName!: string;

  @ApiProperty({
    enum: SomeEnum,
    enumName: 'SomeEnum',
  })
  @IsEnum(SomeEnum)
  enumField!: SomeEnum;

  @ApiPropertyOptional({
    description: 'Optional field',
    example: 'optional-value',
  })
  @IsOptional()
  @IsString()
  optionalField?: string;

  @ApiPropertyOptional({ type: Boolean, example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

### 3. Update DTO Template

File: `src/module-name/dto/update-module-name.dto.ts`

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseUpdateDto } from '../../core/dto';
import {
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { SomeEnum } from '../../enums';

/**
 * Update DTO for Module entity (PUT - full update)
 * All fields are optional
 * DO NOT include immutable fields: id, createdAt, updatedAt, isDeleted, deletedAt
 */
export class UpdateModuleNameDto extends BaseUpdateDto {
  @ApiPropertyOptional({
    description: 'Field description',
    example: 'new-value',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fieldName?: string;

  @ApiPropertyOptional({
    enum: SomeEnum,
    enumName: 'SomeEnum',
  })
  @IsOptional()
  @IsEnum(SomeEnum)
  enumField?: SomeEnum;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

### 4. Filter DTO Template

File: `src/module-name/dto/query-module-name.dto.ts`

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseFilterDto, BaseSortDto, BasePaginationQueryDto } from '../../core/dto';
import {
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { SomeEnum } from '../../enums';
import { ModuleEntity } from '../domain/module-entity';

/**
 * Filter DTO - all fields optional, combined with AND logic
 */
export class FilterModuleNameDto extends BaseFilterDto {
  @ApiPropertyOptional({
    enum: SomeEnum,
    enumName: 'SomeEnum',
    isArray: true,
    example: [SomeEnum.Value1],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SomeEnum, { each: true })
  enumFields?: SomeEnum[];

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  isActive?: boolean | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Partial text search',
    example: 'search-term',
  })
  @IsOptional()
  @IsString()
  searchTerm?: string | null;

  // isDeleted inherited from BaseFilterDto (Admin audit)
}

/**
 * Sort DTO - for multi-column sorting
 * Supply as array: [{ orderBy: 'field1', order: 'asc' }, ...]
 */
export class SortModuleNameDto extends BaseSortDto {
  @ApiPropertyOptional({
    enum: ['id', 'fieldName', 'isActive', 'createdAt', 'updatedAt'],
    example: 'createdAt',
  })
  @IsString()
  override orderBy!: keyof ModuleEntity;
}

/**
 * Query DTO combining pagination, filters, and sorting
 *
 * Usage:
 * GET /module-names?page=1&limit=10&filters={"enumFields":["VALUE1"],"isActive":true}&sort=[{"orderBy":"createdAt","order":"desc"}]
 */
export class QueryModuleNameDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    type: String,
    description: 'JSON-encoded FilterModuleNameDto',
    example: '{"enumFields":["VALUE1"],"isActive":true}',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value
      ? plainToInstance(FilterModuleNameDto, JSON.parse(value as string))
      : undefined,
  )
  @ValidateNested()
  @Type(() => FilterModuleNameDto)
  filters?: FilterModuleNameDto | null;

  @ApiPropertyOptional({
    type: String,
    description: 'JSON-encoded SortModuleNameDto[]',
    example: '[{"orderBy":"createdAt","order":"desc"}]',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value
      ? plainToInstance(SortModuleNameDto, JSON.parse(value as string))
      : undefined,
  )
  @ValidateNested({ each: true })
  @Type(() => SortModuleNameDto)
  sort?: SortModuleNameDto[] | null;
}
```

### 5. Statistics DTO Template

File: `src/module-name/dto/module-name-statistics.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { BaseStatisticsDto } from '../../core/dto';
import { SomeEnum } from '../../enums';

/**
 * Statistics DTO - Admin aggregate data
 * Extends BaseStatisticsDto to automatically include:
 * - total: number
 * - deleted: number
 * - deletedPercentage: number
 * - active: number
 * - activePercentage: number
 */
export class ModuleNameStatisticsDto extends BaseStatisticsDto {
  @ApiProperty({
    description: 'Breakdown by status',
    type: Object,
    example: {
      VALUE1: 50,
      VALUE2: 30,
      VALUE3: 20,
    },
  })
  byEnumField!: Record<string, number>;

  @ApiProperty({
    description: 'Count of active vs inactive',
    example: {
      active: 140,
      inactive: 10,
    },
  })
  byActiveStatus!: Record<string, number>;
}
```

### 6. DTO Barrel Export Template

File: `src/module-name/dto/index.ts`

```typescript
/**
 * Module Name DTOs
 * All DTOs exported with named exports (not export *)
 */

// Response
export { ModuleNameDto } from './module-name.dto';

// CRUD
export { CreateModuleNameDto } from './create-module-name.dto';
export { UpdateModuleNameDto } from './update-module-name.dto';

// Query & Filtering
export {
  FilterModuleNameDto,
  SortModuleNameDto,
  QueryModuleNameDto,
} from './query-module-name.dto';

// Statistics
export { ModuleNameStatisticsDto } from './module-name-statistics.dto';
```

### 7. Service Method Templates

File: `src/module-name/module-name.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from '../../core/base/base.service';
import {
  BasePaginatedResponseDto,
  createPaginatedResponse,
} from '../../core/dto';
import { ModuleNameRepository } from './infrastructure/persistence/document/module-name.repository';
import {
  ModuleNameDto,
  CreateModuleNameDto,
  UpdateModuleNameDto,
  QueryModuleNameDto,
  ModuleNameStatisticsDto,
} from './dto';
import { ModuleEntity } from './domain/module-entity';

@Injectable()
export class ModuleNameService extends BaseService {
  constructor(
    private readonly repository: ModuleNameRepository,
  ) {
    super();
  }

  /**
   * Create new entity
   */
  async create(
    dto: CreateModuleNameDto | Record<string, unknown>,
  ): Promise<ModuleNameDto> {
    return this.repository.create(dto as Partial<ModuleEntity>);
  }

  /**
   * Find single entity by ID
   */
  async findById(id: string): Promise<ModuleNameDto | null> {
    return this.repository.findById(id);
  }

  /**
   * Find all entities with filtering, sorting, pagination
   */
  async findAll(
    query: QueryModuleNameDto,
  ): Promise<BasePaginatedResponseDto<ModuleNameDto>> {
    const page = query.page || 1;
    const limit = query.limit || 10;

    // Validate pagination parameters
    this.validatePagination(page, limit);

    // Calculate offset
    const offset = this.calculateSkip(page, limit);

    // Query repository with filters
    const [items, total] = await this.repository.findAllWithFilters(
      limit,
      offset,
      query.filters,
      query.sort,
    );

    // Return paginated response
    return createPaginatedResponse(items, total, page, limit);
  }

  /**
   * Update entity
   */
  async update(
    id: string,
    dto: UpdateModuleNameDto,
  ): Promise<ModuleNameDto> {
    const entity = await this.repository.update(id, dto);
    if (!entity) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }
    return entity;
  }

  /**
   * Soft-delete entity
   */
  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  /**
   * Get statistics (Admin only)
   */
  async getStatistics(): Promise<ModuleNameStatisticsDto> {
    const stats = await this.repository.getStatistics();

    // Calculate percentages
    const total = stats.total || 1;
    const deletedPercentage = (stats.deleted / total) * 100;
    const activePercentage = (stats.active / total) * 100;

    return {
      ...stats,
      deletedPercentage,
      activePercentage,
    };
  }
}
```

### 8. Controller Template

File: `src/module-name/module-name.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Res,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExtraModels,
} from '@nestjs/swagger';
import { Response } from 'express';
import { BaseController } from '../../core/base/base.controller';
import { JwtAuthGuard, RolesGuard, Roles } from '../../auth';
import { UserRole } from '../../enums';
import { InfinityPaginationResponse } from '../../utils/dto/infinity-pagination-response.dto';
import { ModuleNameService } from './module-name.service';
import {
  ModuleNameDto,
  CreateModuleNameDto,
  UpdateModuleNameDto,
  QueryModuleNameDto,
  FilterModuleNameDto,
  SortModuleNameDto,
  ModuleNameStatisticsDto,
} from './dto';

@ApiTags('Module Names')
@Controller('module-names')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiExtraModels(FilterModuleNameDto, SortModuleNameDto, ModuleNameStatisticsDto)
export class ModuleNameController extends BaseController {
  constructor(private readonly service: ModuleNameService) {
    super();
  }

  /**
   * Create new entity (Admin only)
   */
  @Post()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Create new entity (Admin only)' })
  @ApiResponse({ status: 201, type: ModuleNameDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Body() dto: CreateModuleNameDto,
    @Res() res: Response,
  ): Promise<Response> {
    const entity = await this.service.create(dto);
    return this.sendSuccess(
      res,
      entity,
      'Entity created successfully',
      HttpStatus.CREATED,
    );
  }

  /**
   * List all entities (paginated, filterable, sortable)
   */
  @Get()
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'List all entities (paginated, filterable, sortable)',
  })
  @ApiResponse({
    status: 200,
    type: InfinityPaginationResponse(ModuleNameDto),
  })
  async findAll(
    @Query() query: QueryModuleNameDto,
    @Res() res: Response,
  ): Promise<Response> {
    const data = await this.service.findAll(query);
    return this.sendSuccess(res, data, 'Entities retrieved successfully');
  }

  /**
   * Get statistics (Admin only)
   */
  @Get('admin/stats')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Get entity statistics (Admin only)' })
  @ApiResponse({ status: 200, type: ModuleNameStatisticsDto })
  async getStatistics(@Res() res: Response): Promise<Response> {
    const stats = await this.service.getStatistics();
    return this.sendSuccess(res, stats, 'Statistics retrieved successfully');
  }

  /**
   * Get entity by ID
   */
  @Get(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Get entity by ID' })
  @ApiResponse({ status: 200, type: ModuleNameDto })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async findById(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    const entity = await this.service.findById(id);
    if (!entity) {
      return this.sendError(
        res,
        'Entity not found',
        'NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.sendSuccess(res, entity, 'Entity retrieved successfully');
  }

  /**
   * Update entity
   */
  @Put(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Update entity by ID' })
  @ApiResponse({ status: 200, type: ModuleNameDto })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateModuleNameDto,
    @Res() res: Response,
  ): Promise<Response> {
    const entity = await this.service.update(id, dto);
    return this.sendSuccess(res, entity, 'Entity updated successfully');
  }

  /**
   * Soft-delete entity
   */
  @Delete(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Soft-delete entity by ID' })
  @ApiResponse({
    status: 200,
    description: 'Entity soft-deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async delete(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    await this.service.delete(id);
    return this.sendSuccess(res, null, 'Entity deleted successfully');
  }
}
```

## Domain Entity Template

```typescript
// src/module-name/domain/module-entity.ts
import { SomeEnum } from '../../enums';

export interface ModuleEntity {
  id: string;
  fieldName: string;
  enumField: SomeEnum;
  optionalField?: string | null;
  optionalNumber?: number | null;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

## Module Declaration Template

```typescript
// src/module-name/module-name.module.ts
import { Module } from '@nestjs/common';
import { DocumentModuleNamePersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { ModuleNameController } from './module-name.controller';
import { ModuleNameService } from './module-name.service';

@Module({
  imports: [DocumentModuleNamePersistenceModule],
  controllers: [ModuleNameController],
  providers: [ModuleNameService],
  exports: [ModuleNameService],
})
export class ModuleNameModule {}
```

---

**Copy these templates** when creating new modules and customize field names and types as needed.
