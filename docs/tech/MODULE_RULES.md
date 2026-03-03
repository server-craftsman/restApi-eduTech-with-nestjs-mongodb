# Module Organization Rules

This document defines the structural and organizational rules for all modules in the EduTech Backend API (MongoDB + Mongoose).

## 1. Module Folder Structure

Every module must follow this exact directory structure:

```
src/
├── enums/                                     # Shared enums (if applicable)
│   ├── {entity}-status.enum.ts               # Status enums
│   └── index.ts                              # Barrel export
└── {module-name}/
    ├── domain/
    │   └── {entity}.ts                       # Domain interface (imports enums if needed)
    ├── dto/
    │   ├── create-{entity}.dto.ts
    │   ├── update-{entity}.dto.ts
    │   ├── update-{entity}-status.dto.ts   # Explicit status update (see §3.5)
    │   ├── query-{entity}.dto.ts           # FilterDto + SortDto + QueryDto (see §3.4)
    │   ├── {entity}.dto.ts
    │   ├── {entity}-statistics.dto.ts      # Admin aggregate stats (see §3.6)
    │   └── index.ts
    ├── infrastructure/
    │   └── persistence/
    │       └── document/
    │           ├── schemas/
    │           │   ├── {entity}.schema.ts
    │           │   └── index.ts
    │           ├── mappers/
    │           │   ├── {entity}.mapper.ts
    │           │   └── index.ts
    │           ├── repositories/
    │           │   ├── {entity}.repository.abstract.ts  # Abstract base class
    │           │   └── index.ts
    │           ├── {entity}.repository.ts               # Implementation
    │           ├── document-persistence.module.ts
    │           └── index.ts
    ├── {module-name}.controller.ts
    ├── {module-name}.service.ts
    ├── {module-name}.module.ts
    └── index.ts
```

## 2. Domain Layer Rules

### 2.1 File Naming

- File: `{entity}.ts` (singular, camelCase)
- Example: `track.ts`, `user.ts`

### 2.2 Enum Extraction Rule (IMPORTANT)

- **ALL enums MUST be extracted to `src/enums/` directory**
- Naming: `{entity}-status.enum.ts` (or other descriptive enum name)
- MUST NOT be defined in domain file
- Barrel export from `src/enums/index.ts`
- Domain imports from enums: `import { TrackStatus } from '../../enums'`

**Rationale**: Enums are shared concerns that may be used across multiple modules (domain, DTO, entity, API responses). Extracting them to a central location prevents circular dependencies and improves reusability.

### 2.3 Content Requirements

- Must export an `interface {Entity}` representing the data contract
- Must import enums from `src/enums/` if applicable
- Must export a class `{Entity}Domain` implementing the interface (optional, for complex logic)
- MUST NOT contain any ORM decorators (@Schema, @Prop, @Entity, @Column, etc.)
- MUST NOT contain any NestJS decorators (@Injectable, @Controller, etc.)
- MUST NOT import from infrastructure layer

### 2.4 Example

```typescript
// src/enums/track-status.enum.ts
export enum TrackStatus {
  Uploaded = 'uploaded',
  Processing = 'processing',
  Ready = 'ready',
  Failed = 'failed',
}

// src/tracks/domain/track.ts
import { TrackStatus } from '../../enums'; // Import from enums

export interface Track {
  id: string;
  title: string;
  status: TrackStatus;
  isDeleted: boolean; // Soft-delete flag (always present)
  deletedAt?: Date | null; // Set when softDelete() is called
  createdAt: Date;
  updatedAt: Date;
}

export class TrackDomain implements Track {
  // Optional: Add business logic methods
}
```

## 3. DTO Layer Rules

### 3.1 File Naming

| File                            | Purpose                                            |
| ------------------------------- | -------------------------------------------------- |
| `create-{entity}.dto.ts`        | Create payload — all required fields               |
| `update-{entity}.dto.ts`        | Full update payload — all fields optional          |
| `update-{entity}-status.dto.ts` | Single-field explicit status change (see §3.5)     |
| `query-{entity}.dto.ts`         | `FilterDto` + `SortDto` + `QueryDto` combined file |
| `{entity}.dto.ts`               | API response shape — mirrors domain interface      |
| `{entity}-statistics.dto.ts`    | Admin aggregate statistics response                |

Example: `create-user.dto.ts`, `update-user-status.dto.ts`, `query-user.dto.ts`

### 3.2 Content Requirements

- Use `@nestjs/class-validator` decorators for validation
- Response DTOs must extend/mirror domain interface
- Paginated DTOs must follow PaginatedResponse pattern:

```typescript
export class PaginatedTracksDto {
  @ApiProperty({ type: [TrackDto] })
  @Type(() => TrackDto)
  data: TrackDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;
}
```

### 3.3 Barrel Export

All DTOs must be exported from `dto/index.ts` using **named exports** (not `export *`) to keep the public surface explicit:

```typescript
// src/users/dto/index.ts
export { CreateUserDto } from './create-user.dto';
export { UpdateUserDto } from './update-user.dto';
export { UpdateUserStatusDto } from './update-user-status.dto';
export { UserDto } from './user.dto';
export { FilterUserDto, SortUserDto, QueryUserDto } from './query-user.dto';
export { UserStatisticsDto, UserRoleStatsDto } from './user-statistics.dto';
```

### 3.4 Query / Filter / Sort DTO Pattern

All `GET` list endpoints **MUST** use a single `QueryDto` instead of many route-level query parameters. This prevents endpoint proliferation and keeps filtering logic in one place.

#### 3.4.1 Structure

| Class               | Purpose                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------- |
| `Filter{Entity}Dto` | All filterable fields. Every field `@IsOptional`. Combined with AND logic in repo.           |
| `Sort{Entity}Dto`   | `orderBy: keyof Entity` + `order: 'asc'\|'desc'`. Always an **array** for multi-column sort. |
| `Query{Entity}Dto`  | Wraps `page`, `limit`, JSON-encoded `filters?`, JSON-encoded `sort?[]`.                      |

#### 3.4.2 FilterDto Rules (IMPORTANT)

- **ONE** `FilterDto` per entity — do NOT create separate filter DTOs per field.
- Every field is `@IsOptional()` — callers supply any combination.
- Array fields (e.g., `roles`) use `@IsArray()` + `@IsEnum(E, { each: true })` — OR semantics in repository.
- Boolean fields MUST include a `@Transform` to coerce `'true'`/`'false'` strings.
- Use `isDeleted?: boolean` to expose soft-delete visibility to admin callers.

#### 3.4.3 SortDto Rules

- `order` field typed as `'asc' | 'desc'` (not `string`) with `@IsEnum(['asc', 'desc'])`.
- Sort is always an **array** — supports multi-column ordering.
- Default sort (when no sort supplied) is defined at **repository level** (e.g., `{ createdAt: -1 }`).

#### 3.4.4 Example

```typescript
// src/users/dto/query-user.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { User } from '../domain/user';
import { UserRole, EmailVerificationStatus } from '../../enums';

/**
 * FilterUserDto — all fields optional; combine freely.
 * Pass as JSON string: `filters={"roles":["ADMIN"],"isActive":true,"email":"john"}`
 */
export class FilterUserDto {
  // ── Array field: OR logic across supplied values ──────────────────────────
  @ApiPropertyOptional({
    enum: UserRole,
    enumName: 'UserRole', // ← generates $ref in Swagger instead of inline string array
    isArray: true,
    example: [UserRole.Admin],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[] | null;

  // ── Boolean field: MUST @Transform to coerce query-string 'true'/'false' ──
  @ApiPropertyOptional({ type: Boolean, example: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  isActive?: boolean | null;

  // ── Soft-delete audit field ───────────────────────────────────────────────
  @ApiPropertyOptional({
    type: Boolean,
    description: 'Set true to view soft-deleted records (Admin audit only)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  isDeleted?: boolean | null;

  @ApiPropertyOptional({
    enum: EmailVerificationStatus,
    enumName: 'EmailVerificationStatus',
  })
  @IsOptional()
  @IsEnum(EmailVerificationStatus)
  emailVerificationStatus?: EmailVerificationStatus | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Partial case-insensitive match',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  email?: string | null;
}

/**
 * SortUserDto — one sort criterion; supply an **array** for multi-column sort.
 * `sort=[{"orderBy":"role","order":"asc"},{"orderBy":"createdAt","order":"desc"}]`
 */
export class SortUserDto {
  // ── orderBy MUST be @ApiProperty (required), not @ApiPropertyOptional ────
  @ApiProperty({
    type: String,
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
  orderBy: keyof User;

  @ApiProperty({ enum: ['asc', 'desc'], example: 'desc' })
  @IsEnum(['asc', 'desc'])
  order: 'asc' | 'desc';
}

export class QueryUserDto {
  @ApiPropertyOptional({ type: Number, default: 1, minimum: 1, example: 1 })
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    type: Number,
    default: 10,
    minimum: 1,
    maximum: 100,
    example: 10,
  })
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    type: String,
    description:
      'JSON-encoded FilterUserDto. Example: `{"roles":["ADMIN"],"isActive":true}`',
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
      'JSON-encoded SortUserDto[]. Example: `[{"orderBy":"createdAt","order":"desc"}]`',
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
```

#### 3.4.5 Repository Implementation Pattern

```typescript
async findAllWithFilters(
  limit: number, offset: number,
  filters?: FilterUserDto, sort?: SortUserDto[],
): Promise<[Entity[], number]> {
  const query: Record<string, any> = {};

  // Soft-delete gate (ALWAYS applied)
  query.isDeleted = filters?.isDeleted === true ? true : { $ne: true };

  if (filters?.roles?.length)        query.role = { $in: filters.roles };
  if (filters?.isActive != null)     query.isActive = filters.isActive;
  if (filters?.emailVerificationStatus) query.emailVerificationStatus = filters.emailVerificationStatus;
  if (filters?.email)                query.email = { $regex: filters.email, $options: 'i' };

  const sortObj = sort?.length
    ? Object.fromEntries(sort.map(s => [s.orderBy, s.order === 'asc' ? 1 : -1]))
    : { createdAt: -1 };  // default

  const [docs, total] = await Promise.all([
    this.model.find(query).sort(sortObj).skip(offset).limit(limit).exec(),
    this.model.countDocuments(query).exec(),
  ]);
  return [this.mapper.toDomainArray(docs), total];
}
```

#### 3.4.6 Endpoint Consolidation Rule

> **DO NOT** create separate endpoints like `GET /users/role/:role` or `GET /users/search?email=` when a generic `GET /users?filters=...` endpoint already exists. Use `FilterUserDto` fields instead.

```
❌ GET /users/admin/role/:role   →  ✅ GET /users?filters={"roles":["ADMIN"]}
❌ GET /users/admin/search?email →  ✅ GET /users?filters={"email":"john"}
```

### 3.5 Explicit Status Update DTO Pattern

Do **NOT** use toggle endpoints (`PUT /toggle-active`) that blindly flip a boolean. Use an explicit DTO that sets the value deliberately — safer under concurrent requests and self-documenting.

```typescript
// src/users/dto/update-user-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({
    description: 'Set the active status of the user explicitly.',
    example: true,
  })
  @IsBoolean()
  isActive!: boolean;
}
```

Controller endpoint:

```typescript
// ❌  PUT /admin/:id/toggle-active  (no body, implicit flip)
// ✅  PATCH /admin/:id/status       (explicit body: { isActive: boolean })
@Patch('admin/:id/status')
async updateStatus(
  @Param('id') id: string,
  @Body() dto: UpdateUserStatusDto,
  @Res() res: Response,
): Promise<Response> {
  const user = await this.usersService.updateStatus(id, dto.isActive);
  return this.sendSuccess(res, user, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`);
}
```

Service method:

```typescript
async updateStatus(id: string, isActive: boolean): Promise<User> {
  const user = await this.findById(id);
  if (!user) throw new Error(`User with id ${id} not found`);
  return this.userRepository.update(id, { isActive }) as Promise<User>;
}
```

### 3.6 Statistics DTO Pattern

For admin aggregate endpoints (`GET /admin/stats`), define a typed response DTO with a per-role breakdown sub-DTO:

```typescript
// src/users/dto/user-statistics.dto.ts
import { ApiProperty } from '@nestjs/swagger';
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

/** Response shape for GET /{entity}/admin/stats */
export class UserStatisticsDto {
  @ApiProperty({ description: 'Total non-deleted users', example: 120 })
  total!: number;

  @ApiProperty({
    description: 'Count of non-deleted users grouped by role',
    example: { STUDENT: 80, TEACHER: 15, ADMIN: 5 },
  })
  byRole!: Record<string, number>;

  @ApiProperty({
    description: 'Non-deleted users with isActive = true',
    example: 110,
  })
  active!: number;

  @ApiProperty({
    description: 'Non-deleted users with isActive = false',
    example: 10,
  })
  inactive!: number;

  @ApiProperty({
    description: 'Soft-deleted users (isDeleted = true)',
    example: 3,
  })
  deleted!: number;
}
```

### 4.1 File Location & Naming

- Location: `infrastructure/persistence/document/schemas/`
- File: `{entity}.schema.ts`
- Example: `user.schema.ts`

### 4.2 Content Requirements

- MUST have `@Schema({ timestamps: true, collection: '{collection-name}' })` decorator
- MongoDB `_id` field is automatically created (mapped to `id` by mapper)
- MUST use Mongoose `@Prop()` decorators for all properties
- MUST use snake_case for collection names (e.g., `collection: 'student_profiles'`)
- Timestamps (`createdAt`, `updatedAt`) are auto-generated by `{ timestamps: true }`
- **CRITICAL**: For union types (e.g., `string | null`, `Date | null`), MUST use explicit `type` parameter: `@Prop({ type: String, default: null })` to avoid Mongoose `CannotDetermineTypeError`
- Use `HydratedDocument<T>` type for typed documents

### 4.3 Naming Convention

- Class name: `{Entity}Document` (PascalCase + Document suffix)
- Collection name: lowercase with underscores (`@Schema({ collection: 'collection_name' })`)
- Example: `UserDocument`, collection `users`
- Export schema: `{Entity}Schema` (e.g., `UserSchema = SchemaFactory.createForClass(UserDocument)`)

### 4.4 Example

```typescript
// src/users/infrastructure/persistence/document/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole, EmailVerificationStatus } from '../../../../../enums';

@Schema({ timestamps: true, collection: 'users' })
export class UserDocument {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  // ✅ CRITICAL: Union types (string | null) MUST use explicit type parameter
  @Prop({ type: String, default: null })
  passwordHash?: string | null;

  @Prop({ enum: UserRole, default: UserRole.Student })
  role!: UserRole;

  @Prop({ type: String, default: null })
  avatarUrl?: string | null;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({
    enum: EmailVerificationStatus,
    default: EmailVerificationStatus.Pending,
  })
  emailVerificationStatus!: EmailVerificationStatus;

  @Prop({ type: String, default: null })
  emailVerificationToken?: string | null;

  @Prop({ type: Date, default: null })
  emailVerificationExpires?: Date | null;

  // ── Soft-delete fields — MUST be present on every entity supporting soft delete ──
  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
  // createdAt + updatedAt auto-generated by { timestamps: true }
}

export type UserDocumentType = HydratedDocument<UserDocument> & {
  createdAt: Date;
  updatedAt: Date;
};

export const UserSchema = SchemaFactory.createForClass(UserDocument);
```

### 4.5 Barrel Export

Schemas must be exported from `schemas/index.ts`:

```typescript
export * from './user.schema';
export * from './student-profile.schema';
// ... other schemas
```

## 5. Mapper Layer Rules

### 5.1 File Location & Naming

- Location: `infrastructure/persistence/document/mappers/`
- File: `{entity}.mapper.ts`
- Example: `user.mapper.ts`

### 5.2 Content Requirements

- MUST be `@Injectable()` provider
- MUST have three methods:
  - `toDomain(document: {Entity}DocumentType): {Entity}`
  - `toDocument(domain: {Entity} | Partial<{Entity}>): Partial<{Entity}Document>`
  - `toDomainArray(documents: {Entity}DocumentType[]): {Entity}[]`

### 5.3 Responsibility

- Transforms Mongoose documents → domain models
- Transforms domain models → Mongoose documents (for creation/update)
- Handles all type conversions and property mappings (e.g., `_id` → `id`)
- NO business logic, only data transformation

### 5.4 Example

```typescript
// src/users/infrastructure/persistence/document/mappers/user.mapper.ts
import { Injectable } from '@nestjs/common';
import { User } from '../../../../domain/user';
import { UserDocument, UserDocumentType } from '../schemas/user.schema';
import { UserRole, EmailVerificationStatus } from '../../../../../enums';

@Injectable()
export class UserMapper {
  toDomain(doc: UserDocumentType): User {
    return {
      id: doc._id.toString(), // ✅ Map MongoDB _id → domain id
      email: doc.email,
      passwordHash: doc.passwordHash ?? null,
      role: doc.role ?? UserRole.Student,
      avatarUrl: doc.avatarUrl ?? null,
      isActive: doc.isActive,
      emailVerificationStatus:
        doc.emailVerificationStatus ?? EmailVerificationStatus.Pending,
      emailVerificationToken: doc.emailVerificationToken ?? null,
      emailVerificationExpires: doc.emailVerificationExpires ?? null,
      // Soft-delete fields — always map with safe defaults
      isDeleted: doc.isDeleted ?? false,
      deletedAt: doc.deletedAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  toDomainArray(docs: UserDocumentType[]): User[] {
    return docs.map((doc) => this.toDomain(doc));
  }

  // ✅ CRITICAL: Use explicit field-by-field mapping (NOT spread/destructure).
  // Only write fields that are present in the partial, so partial updates
  // do not accidentally overwrite unrelated fields with undefined.
  toDocument(user: Partial<User>): Partial<UserDocument> {
    const doc: Record<string, unknown> = {};
    if (user.email !== undefined) doc.email = user.email;
    if (user.passwordHash !== undefined) doc.passwordHash = user.passwordHash;
    if (user.role !== undefined) doc.role = user.role;
    if (user.avatarUrl !== undefined) doc.avatarUrl = user.avatarUrl;
    if (user.isActive !== undefined) doc.isActive = user.isActive;
    if (user.emailVerificationStatus !== undefined)
      doc.emailVerificationStatus = user.emailVerificationStatus;
    if (user.emailVerificationToken !== undefined)
      doc.emailVerificationToken = user.emailVerificationToken;
    if (user.emailVerificationExpires !== undefined)
      doc.emailVerificationExpires = user.emailVerificationExpires;
    if (user.isDeleted !== undefined) doc.isDeleted = user.isDeleted;
    if (user.deletedAt !== undefined) doc.deletedAt = user.deletedAt;
    return doc as Partial<UserDocument>;
  }
}
```

> **Why field-by-field in `toDocument`?** The spread pattern `const { id, createdAt, updatedAt, ...rest } = domain` accidentally copies every field including those not present in the partial — causing Mongoose to overwrite fields with `undefined` and dropping data. Explicit `if (field !== undefined)` guards prevent this.

### 5.5 Barrel Export

Mappers must be exported from `mappers/index.ts`:

```typescript
export * from './track.mapper';
export * from './user.mapper';
// ... other mappers
```

## 6. Repository Abstract Class Rules

### 6.1 File Location & Naming

- Location: `infrastructure/persistence/document/repositories/`
- File: `{entity}.repository.abstract.ts`
- Example: `user.repository.abstract.ts`

### 6.2 Content Requirements

- MUST be a **standalone** `abstract class {Entity}RepositoryAbstract`
- **MUST NOT** extend BaseRepository (composition over inheritance)
- MUST define all public repository methods as abstract
- MUST include standard CRUD methods: `findById()`, `findAll()`, `create()`, `update()` (if applicable), `delete()`
- MUST use domain types in signatures (not entities)
- Return types MUST be Promises
- NO implementation, only method signatures
- NO constructor needed (standalone abstract class)

### 6.3 Required Methods

All abstract repositories must declare these standard CRUD methods:

- **Read Operations**:
  - `abstract findById(id: string): Promise<{Entity} | null>` — MUST exclude soft-deleted records
  - `abstract findAllWithFilters(limit, offset, filters?, sort?): Promise<[{Entity}[], number]>` — replaces bare `findAll`; includes soft-delete gate
- **Write Operations**:
  - `abstract create({entity}: Partial<{Entity}>): Promise<{Entity}>`
  - `abstract update(id: string, {entity}: Partial<{Entity}>): Promise<{Entity} | null>` — MUST NOT update soft-deleted records
  - `abstract softDelete(id: string): Promise<void>` — sets `isDeleted=true`, `deletedAt=now()`. **Never use hard-delete**.
- **Admin Aggregation**:
  - `abstract getStatistics(): Promise<{ total, byRole, active, inactive, deleted }>` — returns admin dashboard counts
- **Custom Methods**: Domain-specific queries (e.g., `findByEmail`, `findByVerificationToken`)

### 6.4 Example

```typescript
// src/users/infrastructure/persistence/document/repositories/user.repository.abstract.ts
import { User } from '../../../../domain/user';
import { FilterUserDto, SortUserDto } from '../../../../dto/query-user.dto';

export abstract class UserRepositoryAbstract {
  abstract findById(id: string): Promise<User | null>;
  abstract findAllWithFilters(
    limit: number,
    offset: number,
    filters?: FilterUserDto,
    sort?: SortUserDto[],
  ): Promise<[User[], number]>;
  abstract create(user: Partial<User>): Promise<User>;
  abstract update(id: string, user: Partial<User>): Promise<User | null>;
  abstract softDelete(id: string): Promise<void>;
  // Domain-specific custom queries
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findByVerificationToken(token: string): Promise<User | null>;
  // Admin aggregation
  abstract getStatistics(): Promise<{
    total: number;
    byRole: Record<string, number>;
    active: number;
    inactive: number;
    deleted: number;
  }>;
}
```

### 6.5 Barrel Export

Abstract classes must be exported from `repositories/index.ts`:

```typescript
export * from './track.repository.abstract';
export * from './user.repository.abstract';
// ... other abstracts
```

## 7. Repository Implementation Rules

### 7.1 File Location & Naming

- Location: `infrastructure/persistence/document/`
- File: `{entity}.repository.ts`
- Example: `user.repository.ts`

### 7.2 Content Requirements

- MUST be `@Injectable()` provider
- MUST extend `{Entity}RepositoryAbstract` abstract class
- MUST inject Mongoose `Model<{Entity}Document>` using `@InjectModel()`
- MUST inject `{Entity}Mapper` for transformations
- MUST use `this.mapper` for all transformations (Document ↔ Domain)
- MUST return domain types (not Mongoose documents)

### 7.3 Architecture Pattern

**Direct Mongoose Model Usage**: Concrete repositories:

1. Extend their domain-specific abstract class
2. Inject Mongoose Model via `@InjectModel({Entity}Document.name)`
3. Use Model methods directly (`.find()`, `.findById()`, `.create()`, etc.)
4. Apply mapper transformations to convert between Mongoose documents and domain objects

**Benefits**:

- Abstract repositories remain pure interfaces (no implementation coupling)
- Direct access to Mongoose's powerful query API
- Concrete repositories focus on domain-specific logic and mapping

### 7.4 Constructor Pattern

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument, UserDocumentType } from './schemas/user.schema';
import { UserMapper } from './mappers/user.mapper';
import { UserRepositoryAbstract } from './repositories/user.repository.abstract';

@Injectable()
export class UserRepository extends UserRepositoryAbstract {
  // ✅ Declare as private readonly fields, then assign in constructor body
  // This avoids TypeScript strictPropertyInitialization issues with super().
  private readonly model: Model<UserDocumentType>;
  private readonly mapper: UserMapper;

  constructor(
    @InjectModel(UserDocument.name)
    model: Model<UserDocumentType>,
    mapper: UserMapper,
  ) {
    super();
    this.model = model;
    this.mapper = mapper;
  }
}
```

### 7.5 Method Implementation Pattern

**Using Mongoose Model for CRUD**:

```typescript
// Sentinel — applied to all queries to exclude soft-deleted records
const NOT_DELETED = { isDeleted: { $ne: true } };

// findById — excludes soft-deleted
async findById(id: string): Promise<User | null> {
  const doc = await this.model.findOne({ _id: id, ...NOT_DELETED }).exec();
  return doc ? this.mapper.toDomain(doc) : null;
}

// findAllWithFilters — soft-delete gate always applied
async findAllWithFilters(
  limit = 10, offset = 0,
  filters?: FilterEntityDto, sort?: SortEntityDto[],
): Promise<[Entity[], number]> {
  const query: Record<string, any> = {};

  // Soft-delete gate: show deleted only when caller explicitly passes isDeleted=true
  query.isDeleted = filters?.isDeleted === true ? true : { $ne: true };

  // Array field: OR semantics
  if (filters?.roles?.length) query.role = { $in: filters.roles };
  // Boolean field
  if (filters?.isActive != null) query.isActive = filters.isActive;
  // Enum field
  if (filters?.emailVerificationStatus)
    query.emailVerificationStatus = filters.emailVerificationStatus;
  // Partial text search
  if (filters?.email) query.email = { $regex: filters.email, $options: 'i' };

  // Build sort: default newest-first
  const sortObj: Record<string, 1 | -1> = {};
  if (sort?.length) {
    for (const s of sort) sortObj[s.orderBy as string] = s.order === 'asc' ? 1 : -1;
  } else {
    sortObj.createdAt = -1;
  }

  const [docs, total] = await Promise.all([
    this.model.find(query).sort(sortObj).skip(offset).limit(limit).exec(),
    this.model.countDocuments(query).exec(),
  ]);
  return [this.mapper.toDomainArray(docs), total];
}

// create — always initialises isDeleted=false
async create(user: Partial<User>): Promise<User> {
  const doc = new this.model({
    ...this.mapper.toDocument(user),
    isDeleted: false,
    deletedAt: null,
  });
  return this.mapper.toDomain(await doc.save());
}

// update — guards against updating soft-deleted records
async update(id: string, user: Partial<User>): Promise<User | null> {
  const updated = await this.model
    .findOneAndUpdate(
      { _id: id, ...NOT_DELETED },
      { $set: this.mapper.toDocument(user) },
      { new: true },
    )
    .exec();
  return updated ? this.mapper.toDomain(updated) : null;
}

// softDelete — NEVER physically delete; use this instead of delete()
async softDelete(id: string): Promise<void> {
  await this.model
    .findOneAndUpdate(
      { _id: id, ...NOT_DELETED },
      { $set: { isDeleted: true, deletedAt: new Date() } },
    )
    .exec();
}

// Custom domain query — always includes NOT_DELETED
async findByEmail(email: string): Promise<User | null> {
  const doc = await this.model.findOne({ email, ...NOT_DELETED }).exec();
  return doc ? this.mapper.toDomain(doc) : null;
}

// getStatistics — $aggregate for byRole; raw countDocuments for scalars
async getStatistics(): Promise<{ total; byRole; active; inactive; deleted }> {
  const [total, active, inactive, deleted, byRoleAgg] = await Promise.all([
    this.model.countDocuments({ ...NOT_DELETED }).exec(),
    this.model.countDocuments({ isActive: true, ...NOT_DELETED }).exec(),
    this.model.countDocuments({ isActive: false, ...NOT_DELETED }).exec(),
    this.model.countDocuments({ isDeleted: true }).exec(),   // ← intentionally no NOT_DELETED
    this.model
      .aggregate<{ _id: string; count: number }>([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ])
      .exec(),
  ]);

  const byRole: Record<string, number> = Object.values(EntityRoleEnum).reduce(
    (acc, r) => ({ ...acc, [r]: 0 }),
    {},
  );
  for (const entry of byRoleAgg) byRole[entry._id] = entry.count;

  return { total, byRole, active, inactive, deleted };
}
```

### 7.6 Model Injection — Constructor Body Assignment

When a class extends an abstract base that requires `super()`, TypeScript's strict initialization rules may conflict with NestJS shorthand (`private readonly model: Model<T>` in constructor params). Always use the **declare-then-assign** pattern:

```typescript
// ❌ WRONG — shorthand not allowed when super() is required before assignment
constructor(@InjectModel(Doc.name) private model: Model<Doc>) { super(); }

// ✅ CORRECT — declare fields, call super(), then assign
private readonly model: Model<DocType>;
private readonly mapper: Mapper;
constructor(@InjectModel(Doc.name) model: Model<DocType>, mapper: Mapper) {
  super();
  this.model = model;
  this.mapper = mapper;
}
```

## 8. Service Layer Rules

### 8.1 File Naming

- File: `{module-name}.service.ts`
- Example: `tracks.service.ts`

### 8.2 Content Requirements

- MUST be `@Injectable()` provider
- MUST extend `BaseService` (from `src/core/base/base.service.ts`)
- Orchestrates repository and other services
- Implements business logic
- Returns domain types (from repositories)
- Accepts DTOs from controllers

### 8.3 Constructor Pattern

```typescript
@Injectable()
export class UsersService extends BaseService {
  constructor(private readonly userRepository: UserRepositoryAbstract) {
    super();
  }
}
```

### 8.4 Method Naming

| Method        | Signature                                                                        | Notes                                     |
| ------------- | -------------------------------------------------------------------------------- | ----------------------------------------- |
| Create        | `create(dto: CreateEntityDto \| Record<string, unknown>): Promise<Entity>`       | Accepts wide type to support OAuth upsert |
| Find by ID    | `findById(id: string): Promise<Entity \| null>`                                  |                                           |
| Find all      | `findAll(query: QueryEntityDto): Promise<InfinityPaginationResponseDto<Entity>>` | Uses infinityPagination helper            |
| Update        | `update(id: string, dto: UpdateEntityDto): Promise<Entity>`                      | Throws if not found                       |
| Update status | `updateStatus(id: string, isActive: boolean): Promise<Entity>`                   | Explicit status, no toggle                |
| Delete        | `delete(id: string): Promise<void>`                                              | Delegates to `softDelete`                 |
| Statistics    | `getStatistics(): Promise<StatsShape>`                                           | Delegates to repository                   |
| Custom        | e.g., `findByEmail(email: string)`                                               | Domain-specific                           |

## 9. Controller Layer Rules

### 9.1 File Naming

- File: `{module-name}.controller.ts`
- Example: `tracks.controller.ts`

### 9.2 Content Requirements

- MUST be `@Controller('{route}')` decorated
- MUST extend `BaseController` (from `src/core/base/base.controller.ts`)
- MUST apply `@UseGuards(JwtAuthGuard, RolesGuard)` + `@ApiBearerAuth()` at class level for fully-protected controllers
- Injects service layer only (never repository directly)
- Uses `@Res() res: Response` + `this.sendSuccess()` / `this.sendError()` for consistent response envelope
- Uses `@ApiExtraModels(...)` to register auxiliary DTOs (FilterDto, SortDto, StatsDto) that are not used as direct body/response types

### 9.3 Example Pattern

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiExtraModels,
} from '@nestjs/swagger';
import { Response } from 'express';
import { BaseController } from '../core/base/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../roles';
import { UserRole } from '../enums';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UpdateUserStatusDto } from './dto';
import { QueryUserDto, FilterUserDto, SortUserDto } from './dto/query-user.dto';
import { UserDto } from './dto/user.dto';
import { UserStatisticsDto } from './dto/user-statistics.dto';
import { InfinityPaginationResponse } from '../utils/dto/infinity-pagination-response.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
// ✅ Register auxiliary DTOs so Swagger generates their schemas
@ApiExtraModels(FilterUserDto, SortUserDto, UserStatisticsDto)
export class UsersController extends BaseController {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  @Post()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
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
  @ApiOperation({
    summary: 'List users — paginated, filterable, sortable (Admin only)',
  })
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
  @ApiOperation({ summary: 'Get user statistics (Admin only)' })
  @ApiResponse({ status: 200, type: UserStatisticsDto })
  async getStatistics(@Res() res: Response): Promise<Response> {
    const stats = await this.usersService.getStatistics();
    return this.sendSuccess(res, stats, 'Statistics retrieved successfully');
  }

  @Get(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
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
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    return this.sendSuccess(res, user, 'User retrieved successfully');
  }

  @Put(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Update user by ID (Admin only)' })
  @ApiResponse({ status: 200, type: UserDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Res() res: Response,
  ): Promise<Response> {
    const user = await this.usersService.update(id, dto);
    return this.sendSuccess(res, user, 'User updated successfully');
  }

  // ✅ PATCH + explicit body (not PUT toggle)
  @Patch('admin/:id/status')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Update user active status explicitly (Admin only)',
  })
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
  @ApiOperation({ summary: 'Soft-delete user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User soft-deleted successfully' })
  async delete(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    await this.usersService.delete(id);
    return this.sendSuccess(res, null, 'User deleted successfully');
  }
}
```

## 10. Module Wiring Rules

### 10.1 Document Persistence Module

File: `infrastructure/persistence/document/document-persistence.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserDocument, UserSchema } from './schemas/user.schema';
import { UserMapper } from './mappers/user.mapper';
import { UserRepository } from './user.repository';
import { UserRepositoryAbstract } from './repositories/user.repository.abstract';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserDocument.name, schema: UserSchema },
    ]),
  ],
  providers: [
    UserMapper,
    // ✅ Bind abstract class token to concrete implementation
    // Consumers inject UserRepositoryAbstract; NestJS resolves it to UserRepository
    {
      provide: UserRepositoryAbstract,
      useClass: UserRepository,
    },
  ],
  exports: [UserRepositoryAbstract], // ← export the ABSTRACT token, not the implementation
})
export class DocumentUserPersistenceModule {}
```

### 10.2 Main Module

File: `{module-name}.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { DocumentUserPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [DocumentUserPersistenceModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Export service for other modules
})
export class UsersModule {}
```

### 10.3 Barrel Exports

Each module must export public API from `index.ts`:

```typescript
// src/tracks/index.ts
export * from './dto';
export * from './domain/track';
export * from './tracks.service';
export * from './tracks.module';
```

## 11. Dependency Injection Rules

### 11.1 Injection Hierarchy

```
Controller
    ↓ (injects)
Service
    ↓ (injects)
Repository
    ↓ (uses)
Entity + Mapper
```

### 11.2 No Circular Dependencies

- Controllers MUST NOT inject repositories directly
- Services MUST NOT inject controllers
- Domain layer MUST NOT depend on infrastructure

### 11.3 Provider Registration

- Register in module `providers` array
- Export from module if used by other modules
- Use `@Injectable()` decorator

## 12. Naming Conventions Summary

| Layer                       | Pattern                               | Example                               |
| --------------------------- | ------------------------------------- | ------------------------------------- |
| Enum                        | `{Entity}Status` / `{Entity}Role`     | `UserRole`, `EmailVerificationStatus` |
| Domain                      | `{Entity}` interface                  | `User`                                |
| Schema (Mongoose)           | `{Entity}Document` class              | `UserDocument`                        |
| Schema Document Type        | `{Entity}DocumentType`                | `UserDocumentType`                    |
| Schema Factory              | `{Entity}Schema` constant             | `UserSchema`                          |
| Mapper                      | `{Entity}Mapper` service              | `UserMapper`                          |
| Repository (Abstract)       | `{Entity}RepositoryAbstract`          | `UserRepositoryAbstract`              |
| Repository (Implementation) | `{Entity}Repository`                  | `UserRepository`                      |
| Service                     | `{Entities}Service` (plural)          | `UsersService`                        |
| Controller                  | `{Entities}Controller` (plural)       | `UsersController`                     |
| DTO (Create)                | `Create{Entity}Dto`                   | `CreateUserDto`                       |
| DTO (Update)                | `Update{Entity}Dto`                   | `UpdateUserDto`                       |
| DTO (Status update)         | `Update{Entity}StatusDto`             | `UpdateUserStatusDto`                 |
| DTO (Response)              | `{Entity}Dto`                         | `UserDto`                             |
| DTO (Filter)                | `Filter{Entity}Dto`                   | `FilterUserDto`                       |
| DTO (Sort)                  | `Sort{Entity}Dto`                     | `SortUserDto`                         |
| DTO (Query)                 | `Query{Entity}Dto`                    | `QueryUserDto`                        |
| DTO (Statistics)            | `{Entity}StatisticsDto`               | `UserStatisticsDto`                   |
| DTO (Role stats sub)        | `{Entity}RoleStatsDto`                | `UserRoleStatsDto`                    |
| Module                      | `{Entity}Module` / `{Entities}Module` | `UsersModule`                         |

## 13. Import Rules

### 13.1 Allowed Imports

```typescript
// ✅ Service importing from domain
import { Track } from './domain/track';

// ✅ Service/Domain importing from enums
import { TrackStatus } from '../../enums';

// ✅ Entity importing from enums
import { TrackStatus } from '../../../../../enums';

// ✅ DTO importing from enums and domain
import { TrackStatus } from '../../enums';
import { Track } from '../../domain/track';

// ✅ Repository importing from domain
import { Track } from '../domain/track';

// ✅ Controller importing from dto
import { TrackDto, CreateTrackDto } from './dto';

// ✅ Service importing repository
import { UserRepository } from './infrastructure/persistence/document/user.repository';
```

### 13.2 Forbidden Imports

```typescript
// ❌ Domain/DTO importing from infrastructure
import { UserDocument } from './infrastructure/persistence/document/schemas/user.schema';

// ❌ Importing abstract class as interface (use extends instead)
import { ITrackRepository } from './repositories/track.repository.interface';

// ❌ Controller importing repository directly
import { UserRepository } from './infrastructure/persistence/document/user.repository';

// ❌ Infrastructure importing from HTTP layer
import { TrackController } from './tracks.controller';

// ❌ Importing enum from domain (should import from enums)
import { TrackStatus } from './domain/track'; // WRONG
// Instead:
import { TrackStatus } from '../../enums'; // CORRECT
```

### 13.3 Interface Extraction Rules

- **One interface per file** inside `<module>/interfaces/` (or `/config/interfaces` for config-only types).
- **Barrel export** all interfaces from `interfaces/index.ts`; consumers import from the barrel, never deep paths.
- **No inline interface declarations** inside services, strategies, processors, or config files—move them to `interfaces/`.
- **Naming**: `{descriptive-name}.interface.ts` (e.g., `oauth-profile.interface.ts`, `stream-payload.interface.ts`, `transcode-job.interface.ts`).
- **Example structure**:

```
src/auth/interfaces/oauth-profile.interface.ts
src/auth/interfaces/jwt-payload.interface.ts
src/auth/interfaces/index.ts
```

- **Usage**:

```typescript
// ✅ Service/strategy importing shared interface
import { OAuthProfile } from './interfaces';
```

## 14. File Size Guidelines

| File Type                 | Max Lines | Purpose                  |
| ------------------------- | --------- | ------------------------ |
| Enum                      | 10-30     | Status/state definitions |
| Domain                    | 50-100    | Pure data structures     |
| DTO                       | 30-60     | Validation rules         |
| Schema (Mongoose)         | 40-80     | ODM mapping              |
| Mapper                    | 40-80     | Data transformation      |
| Repository Abstract       | 20-40     | Contract definition      |
| Repository Implementation | 80-150    | Data access              |
| Service                   | 150-300   | Business logic           |
| Controller                | 100-200   | HTTP endpoints           |
| Module                    | 20-40     | Dependency wiring        |

_If files exceed these limits, consider splitting into sub-modules or extracting helper services._

## 15. Testing Strategy

### 15.1 What to Test

- **Enum**: N/A (no logic)
- **Domain**: Business logic methods (if any)
- **Mapper**: `toDomain()` and `toDocument()` transformations
- **Repository**: All data access methods (with mock Mongoose Model)
- **Service**: All business logic (with mocked repositories)
- **Controller**: HTTP contract (with mocked services)

### 15.2 Test File Naming

- Domain logic: `{entity}.spec.ts` in domain folder
- Service: `{module-name}.service.spec.ts`
- Controller: `{module-name}.controller.spec.ts`
- Repository: `{entity}.repository.spec.ts` in repository folder

## 16. Validation Rules

### 16.1 DTO Validation

All DTOs must use `class-validator` decorators:

```typescript
import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateTrackDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
```

### 16.2 Custom Validators

Create custom decorators in `validators/` folder if needed:

```typescript
// src/validators/is-valid-uuid.validator.ts
export class IsValidUuid implements ValidatorConstraintInterface {
  validate(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }
}
```

## 17. Error Handling

### 17.1 Error Types by Layer

- **Controller**: HTTP exceptions (`BadRequestException`, `NotFoundException`, etc.)
- **Service**: Custom business exceptions or HTTP exceptions
- **Repository**: Catch Mongoose errors, throw application exceptions

### 17.2 Example

```typescript
// In Service
async findOneOrFail(id: string): Promise<Track> {
  const track = await this.trackRepository.findById(id);
  if (!track) {
    throw new NotFoundException(`Track with id ${id} not found`);
  }
  return track;
}
```

## 18. Documentation Rules

### 18.1 JSDoc Comments

- All public methods must have JSDoc comments
- All complex algorithms must be explained
- All parameters and return types documented

```typescript
/**
 * Creates a new track from uploaded file
 * @param file - Multer file object with audio content
 * @param dto - Track creation data
 * @returns Promise resolving to created Track domain object
 * @throws BadRequestException if file is missing
 */
async createFromUpload(file: Express.Multer.File, dto: CreateTrackDto): Promise<Track>
```

### 18.2 Module Documentation

Each module should include `README.md`:

```markdown
# Tracks Module

Handles track management, including:

- Track creation and metadata
- Audio file storage and streaming
- Asynchronous transcoding via BullMQ

## Public API

- `TracksService.findOne(id)`
- `TracksService.create(dto)`
- `TracksService.findAll()`

## Dependencies

- StorageService (S3 uploads)
- MediaQueue (Transcoding jobs)
```

## 19. Checklist for New Modules

**Domain**

- [ ] Domain interface created (`interface {Entity}`)
- [ ] Soft-delete fields added: `isDeleted: boolean`, `deletedAt?: Date | null`
- [ ] All enums extracted to `src/enums/` and imported from there

**DTOs**

- [ ] `create-{entity}.dto.ts` with `@ApiProperty` on all fields
- [ ] `update-{entity}.dto.ts` with `@ApiPropertyOptional` on all fields
- [ ] `update-{entity}-status.dto.ts` with explicit `isActive: boolean` (no toggle endpoints)
- [ ] `query-{entity}.dto.ts` with `FilterDto` + `SortDto` + `QueryDto`
  - [ ] Every filter field is `@IsOptional()`
  - [ ] Boolean filter fields have `@Transform` for string coercion
  - [ ] Array filter fields have `@IsArray()` + `@IsEnum(E, { each: true })`
  - [ ] `isDeleted` field present for admin audit visibility
  - [ ] `SortDto.orderBy` + `SortDto.order` both use `@ApiProperty` (required)
  - [ ] `QueryDto.filters` and `QueryDto.sort` use `plainToInstance` + `JSON.parse` in `@Transform`
- [ ] `{entity}.dto.ts` mirrors domain interface exactly (no stale/extra fields)
  - [ ] All enum fields use `enumName: 'EnumName'` in `@ApiProperty`
  - [ ] Nullable fields use `@ApiPropertyOptional({ nullable: true })`
- [ ] `{entity}-statistics.dto.ts` if aggregation endpoint exists
- [ ] `dto/index.ts` barrel with **named** exports (not `export *`)

**Schema**

- [ ] `@Schema({ timestamps: true, collection: '{snake_case}' })`
- [ ] All union types use explicit `type` param: `@Prop({ type: String, default: null })`
- [ ] Soft-delete props: `@Prop({ default: false }) isDeleted!: boolean` and `@Prop({ type: Date, default: null }) deletedAt?: Date | null`
- [ ] `{Entity}DocumentType = HydratedDocument<{Entity}Document> & { createdAt: Date; updatedAt: Date }`

**Mapper**

- [ ] `toDomain`: maps `_id.toString()` → `id`; maps `isDeleted` and `deletedAt` with safe defaults
- [ ] `toDocument`: uses explicit `if (field !== undefined)` per field (no spread/destructure)
- [ ] `toDomainArray`: delegates to `toDomain`

**Repository Abstract**

- [ ] `findById`, `findAllWithFilters`, `create`, `update`, `softDelete` declared
- [ ] `getStatistics()` declared (if needed)
- [ ] Domain-specific queries declared (e.g., `findByEmail`)

**Repository Implementation**

- [ ] `const NOT_DELETED = { isDeleted: { $ne: true } }` at module scope
- [ ] Every query spreads `...NOT_DELETED` (or uses it as soft-delete gate)
- [ ] `softDelete()` sets `{ isDeleted: true, deletedAt: new Date() }`
- [ ] `create()` always passes `isDeleted: false, deletedAt: null`
- [ ] `findAllWithFilters()` builds all filter fields + sort from DTOs
- [ ] Constructor uses declare-then-assign pattern (not shorthand with `super()`)

**Persistence Module**

- [ ] `MongooseModule.forFeature([{ name: Doc.name, schema: Schema }])`
- [ ] `{ provide: AbstractClass, useClass: ConcreteClass }` provider binding
- [ ] Exports the **abstract** token (not the implementation class)

**Service**

- [ ] Extends `BaseService`
- [ ] Injects `{Entity}RepositoryAbstract` (not the concrete class)
- [ ] `updateStatus(id, isActive)` present (no `toggleActiveStatus`)
- [ ] `delete()` delegates to `softDelete()` (never calls hard delete)
- [ ] `getStatistics()` delegates to repository

**Controller**

- [ ] Extends `BaseController`
- [ ] `@UseGuards(JwtAuthGuard, RolesGuard)` + `@ApiBearerAuth()` at class level
- [ ] `@ApiExtraModels(FilterDto, SortDto, StatsDto)` at class level
- [ ] All handlers use `@Res() res: Response` + `this.sendSuccess()` / `this.sendError()`
- [ ] `PATCH /admin/:id/status` with `UpdateEntityStatusDto` body (not PUT toggle)
- [ ] `GET /admin/stats` with `@ApiResponse({ type: StatisticsDto })`
- [ ] `DELETE /:id` calls soft delete, not hard delete
- [ ] No dedicated filter endpoints (`/search`, `/role/:role`, etc.)

**Swagger**

- [ ] All `@ApiProperty({ enum: E })` include `enumName: 'EnumName'`
- [ ] `@ApiProperty` used for required fields, `@ApiPropertyOptional` for optional
- [ ] All endpoints have `@ApiOperation({ summary: '...' })`
- [ ] Auth/forbidden responses documented: `401`, `403`, `404`

**Wiring**

- [ ] Persistence module imported in main module
- [ ] `UsersService` exported from main module
- [ ] Barrel exports in `index.ts`

## 20. Enum Organization Rules

### 20.1 Where to Place Enums

- Location: `src/enums/` directory (top-level, not inside modules)
- File naming: `{entity}-{type}.enum.ts`
- Examples: `track-status.enum.ts`, `user-role.enum.ts`

### 20.2 Enum Extraction Rule

**MANDATORY**: Any enum that represents a status, type, or role of an entity MUST be:

1. Defined in `src/enums/{entity}-{type}.enum.ts`
2. Exported from `src/enums/index.ts`
3. Imported by domain, entity, DTO, and service layers
4. NEVER defined inline in domain, dto, or entity files

### 20.3 Rationale

Enums are cross-cutting concerns used by:

- Domain layer (in type definitions)
- Entity layer (in ORM decorators)
- DTO layer (in response DTOs)
- Service layer (in business logic)
- Controller layer (in API responses)

Centralizing them prevents circular dependencies and ensures consistency.

### 20.4 Structure Example

```
src/
├── enums/
│   ├── track-status.enum.ts          # TrackStatus enum
│   ├── user-role.enum.ts             # UserRole enum (if needed)
│   └── index.ts                      # Barrel export
├── tracks/
│   ├── domain/track.ts               # imports TrackStatus from enums
│   ├── dto/track.dto.ts              # imports TrackStatus from enums
│   └── infrastructure/.../track.entity.ts  # imports TrackStatus from enums
└── users/
    └── ...
```

### 20.5 Barrel Export Pattern

```typescript
// src/enums/index.ts
export * from './track-status.enum';
export * from './user-role.enum';
// ... other enums
```

### 20.6 Usage in Different Layers

```typescript
// Domain layer
import { UserRole } from '../../enums';
export interface User {
  role: UserRole;
}

// DTO layer
import { UserRole } from '../../enums';
export class UserDto {
  @ApiProperty({ enum: UserRole })
  role: UserRole;
}

// Schema layer
import { UserRole } from '../../../../../enums';
@Schema()
export class UserDocument {
  @Prop({ enum: UserRole, default: UserRole.Student })
  role: UserRole;
}
```

## 21. Authentication & Authorization Rules

### 21.1 JWT Authentication Setup

**Location**: `src/auth/` module handles all authentication concerns.

**Components**:

- `JwtStrategy`: Passport strategy that validates JWT tokens and loads user
- `JwtAuthGuard`: Guard that protects endpoints requiring authentication
- `@CurrentUser` decorator: Extracts authenticated user from request

### 21.2 Protecting Endpoints

All endpoints requiring authentication MUST use `@UseGuards(JwtAuthGuard)`:

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '../auth';
import { User } from '../users/domain/user';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('tracks')
@ApiTags('Tracks')
export class TracksController {
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() // Adds "Authorize" button in Swagger UI
  async upload(
    @Body() dto: CreateTrackDto,
    @CurrentUser() user: User, // Automatically extracts user from JWT token
  ) {
    return this.tracksService.create(dto, user.id);
  }
}
```

### 21.3 User ID Extraction Rule (IMPORTANT)

**NEVER accept `userId` from request body or query parameters for actions on behalf of authenticated users.**

❌ **WRONG - Security Vulnerability**:

```typescript
export class CreateTrackDto {
  @ApiProperty()
  userId!: string; // ❌ User can fake this!
}

@Post()
async upload(@Body() dto: CreateTrackDto) {
  return this.service.create(dto.userId); // ❌ Insecure!
}
```

✅ **CORRECT - Extract from JWT Token**:

```typescript
export class CreateTrackDto {
  @ApiProperty()
  title!: string;
  // ✅ No userId field - extracted from token
}

@Post()
@UseGuards(JwtAuthGuard)
async upload(
  @Body() dto: CreateTrackDto,
  @CurrentUser() user: User, // ✅ Secure: from verified token
) {
  return this.service.create(dto, user.id);
}
```

### 21.4 Service Layer Pattern

Services receiving user-specific actions MUST accept `userId` as a separate parameter:

```typescript
@Injectable()
export class TracksService {
  async createFromUpload(
    file: Express.Multer.File,
    dto: CreateTrackDto,
    userId: string, // ✅ Received from controller, extracted from token
  ): Promise<Track> {
    // Use userId for ownership and quota checks
    const user = await this.usersService.findById(userId);
    // ... business logic
  }
}
```

### 21.5 @CurrentUser Decorator

**Location**: `src/auth/decorators/current-user.decorator.ts`

**Usage**: Extracts the authenticated user object from the request (populated by JwtStrategy)

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/domain/user';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Populated by JwtStrategy.validate()
  },
);
```

### 21.6 Public vs Protected Endpoints

**Public Endpoints** (no authentication required):

- Auth endpoints: `/auth/sign-in`, `/auth/sign-up`
- Public content: `/tracks/:id/stream` (read-only)
- Health checks, status pages

**Protected Endpoints** (JWT required):

- Create/Update/Delete operations: `POST /tracks`, `PUT /tracks/:id`
- User profile: `GET /users/me`, `PUT /users/me`
- User-specific listings: `GET /tracks/my-uploads`

### 21.7 Swagger/OpenAPI Documentation

Protected endpoints MUST include `@ApiBearerAuth()` decorator:

```typescript
@Post()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth() // Adds "Authorize" button in Swagger
async upload(@CurrentUser() user: User) {
  // ...
}
```

This enables the "Authorize" button in Swagger UI where users can input their JWT token.

### 21.8 Error Handling

Authentication failures return standard HTTP status codes:

- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Valid token but insufficient permissions
- `400 Bad Request`: Quota exceeded, validation errors

### 21.9 Checklist for Authenticated Endpoints

- [ ] `@UseGuards(JwtAuthGuard)` applied to controller method
- [ ] `@ApiBearerAuth()` added for Swagger documentation
- [ ] `@CurrentUser()` decorator used to extract user
- [ ] NO `userId` in request DTO
- [ ] Service method accepts `userId` as separate parameter
- [ ] Ownership/quota checks implemented in service layer

## 21. Migration Path for Existing Code

When refactoring existing modules to follow these rules:

1. **Enum extraction**:
   - Extract enum from domain/schema to `src/enums/{entity}-{type}.enum.ts`
   - Update all imports to use enums from `src/enums`

2. **Repository refactoring**:
   - Create `{entity}.repository.abstract.ts` with abstract methods
   - Update `{entity}.repository.ts` to extend abstract class and inject Mongoose Model
   - Change `implements IInterface` to `extends Abstract`

3. **Domain layer**:
   - Remove all ORM decorators (@Schema, @Prop, @Entity, @Column)
   - Keep pure interfaces and enum imports

4. **Schema layer (Mongoose)**:
   - Ensure all `@Schema` and `@Prop` decorators present
   - Add explicit `type` parameter for union types: `@Prop({ type: String, default: null })`
   - Import enums from `src/enums`
   - Use `HydratedDocument<T>` for type safety

5. **Mapper**:
   - Update `toEntity()` → `toDocument()`
   - Handle `_id` → `id` mapping in `toDomain()`
   - Exclude timestamps and id when mapping to document

6. **Service**:
   - Update repository type hints
   - No changes needed if using abstract repository pattern

7. **Persistence Module**:
   - Replace `TypeOrmModule.forFeature([Entity])` with `MongooseModule.forFeature([{ name: Document.name, schema: Schema }])`

8. **Testing**:
   - Test all endpoints, verify mapper transformations work
   - Verify enum usage consistent across layers
   - Mock Mongoose Model instead of TypeORM Repository

## 22. Soft Delete Pattern

### 22.1 Principle

**Records are NEVER physically removed from the database.** Deletion is a state change, not a destruction.

| Operation                               | Result                                                |
| --------------------------------------- | ----------------------------------------------------- |
| `DELETE /resource/:id`                  | Sets `isDeleted=true`, `deletedAt=now()`              |
| All reads (`findById`, `findAll`, etc.) | Auto-filter `{ isDeleted: { $ne: true } }`            |
| Admin audit                             | Pass `filters.isDeleted=true` to `findAllWithFilters` |

### 22.2 Domain Requirements

Every entity that supports soft delete MUST add these fields to its domain interface:

```typescript
export interface User {
  // ... other fields
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### 22.3 Schema Requirements

```typescript
@Schema({ timestamps: true, collection: 'users' })
export class UserDocument {
  // ... other props

  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}
```

### 22.4 Repository Sentinel Constant

Define at module scope so it is reused by every query method:

```typescript
const NOT_DELETED = { isDeleted: { $ne: true } };
```

Apply to **every** Mongoose query:

```typescript
// ✅ Correct
this.model.findOne({ email, ...NOT_DELETED })
this.model.find({ role, ...NOT_DELETED })
this.model.countDocuments({ ...NOT_DELETED })
this.model.findOneAndUpdate({ _id: id, ...NOT_DELETED }, ...)

// ❌ Wrong — missing soft-delete guard
this.model.findById(id)
this.model.find({ role })
```

### 22.5 Mapper Requirements

Both `toDomain` and `toDocument` must handle soft-delete fields:

```typescript
toDomain(doc: UserDocumentType): User {
  return {
    // ...
    isDeleted: doc.isDeleted ?? false,
    deletedAt: doc.deletedAt ?? null,
  };
}

toDocument(user: Partial<User>): Partial<UserDocument> {
  const doc: Record<string, unknown> = {};
  // ...
  if (user.isDeleted !== undefined) doc.isDeleted = user.isDeleted;
  if (user.deletedAt !== undefined) doc.deletedAt = user.deletedAt;
  return doc as Partial<UserDocument>;
}
```

### 22.6 Statistics — Include Deleted Count

`getStatistics()` should expose deleted count for admin dashboards:

```typescript
async getStatistics() {
  const [total, deleted] = await Promise.all([
    this.model.countDocuments({ isDeleted: { $ne: true } }).exec(),
    this.model.countDocuments({ isDeleted: true }).exec(),
  ]);
  return { total, deleted, ... };
}
```

### 22.7 FilterDto isDeleted Field

Admin callers can access deleted records via `FilterUserDto.isDeleted=true`:

```typescript
export class FilterUserDto {
  /** Set to true to view soft-deleted records (Admin audit only) */
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  isDeleted?: boolean | null;
}
```

Repository logic:

```typescript
// isDeleted=true  → show only deleted
// isDeleted=false → show only active (default if omitted)
// isDeleted unset → show active (same as false)
query.isDeleted = filters?.isDeleted === true ? true : { $ne: true };
```

## 23. Swagger / OpenAPI Documentation Rules

### 23.1 enumName Rule (CRITICAL)

All `@ApiProperty({ enum: E })` fields **MUST** include `enumName`. Without it, Swagger inlines the enum values as a plain string array instead of generating a reusable `$ref` schema.

```typescript
// ❌ WRONG — Swagger inlines ["STUDENT","ADMIN",...] everywhere
@ApiProperty({ enum: UserRole })
role: UserRole;

// ✅ CORRECT — Swagger generates $ref pointing to named 'UserRole' schema
@ApiProperty({ enum: UserRole, enumName: 'UserRole' })
role: UserRole;
```

Apply `enumName` to:

- `@ApiProperty` in response DTOs
- `@ApiPropertyOptional` in create/update DTOs
- `@ApiPropertyOptional` in FilterDto enum fields
- Sub-DTOs like `UserRoleStatsDto`

### 23.2 @ApiProperty vs @ApiPropertyOptional

| Use                         | When                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `@ApiProperty(...)`         | Field is **required** in the schema (non-optional class property or required DTO field) |
| `@ApiPropertyOptional(...)` | Field is **optional** (`?` in TypeScript or explicitly optional in the DTO)             |

> **Pitfall**: `SortDto.orderBy` and `SortDto.order` are both required — use `@ApiProperty`, not `@ApiPropertyOptional`.

### 23.3 @ApiExtraModels — Registering Auxiliary DTOs

DTOs that are never used directly as `@Body()` or `type:` in `@ApiResponse` will not appear in Swagger schemas. Register them at the **controller class level**:

```typescript
@ApiExtraModels(FilterUserDto, SortUserDto, UserStatisticsDto)
@Controller('users')
export class UsersController extends BaseController { ... }
```

Typically needed for:

- `FilterDto` (not a body type — nested inside JSON query param)
- `SortDto` (same reason)
- Statistics DTOs (used as `@ApiResponse` type only, still needs explicit registration)

### 23.4 Nullable Fields

```typescript
// ✅ Nullable optional field
@ApiPropertyOptional({ type: String, nullable: true, example: 'https://...' })
avatarUrl?: string | null;

// ✅ Nullable required field
@ApiProperty({ type: Date, nullable: true })
deletedAt!: Date | null;
```

### 23.5 Required Swagger Decorators per Endpoint

Every controller method MUST have:

```typescript
@ApiOperation({ summary: 'Short description of what the endpoint does' })
@ApiResponse({ status: 200, type: ResponseDto })
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 403, description: 'Forbidden' })
// For GET/:id, PUT/:id, DELETE/:id:
@ApiResponse({ status: 404, description: 'Resource not found' })
```

### 23.6 Controller-Level Guards + Swagger

For controllers where every endpoint is protected, apply guards and `@ApiBearerAuth()` at **class level** to avoid repetition:

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()                         // ← applies to all endpoints in this controller
@ApiExtraModels(FilterUserDto, SortUserDto)
export class UsersController extends BaseController { ... }
```

---

**Last Updated**: February 26, 2026  
**Version**: 3.0.0 (+ Status DTO pattern, Statistics DTO, Swagger rules, updated examples from users module)  
**Status**: Active
