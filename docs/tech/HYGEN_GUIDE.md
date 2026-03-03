# Quick Start - Hygen Module Generator

## Generate a New Module

```bash
bun run generate:module
```

## Example Session

```bash
$ bun run generate:module

✔ Module name (singular, e.g., "track", "user"): · category
✔ Plural form (e.g., "tracks", "users"): · categories
✔ Create status enum? (y/N) · true
✔ Enum name (e.g., "TrackStatus", "UserRole"): · CategoryStatus

Loaded templates: .hygen
       added: src/enums/category-status.enum.ts
       added: src/categories/domain/category.ts
       added: src/categories/dto/create-category.dto.ts
       added: src/categories/dto/update-category.dto.ts
       added: src/categories/dto/category.dto.ts
       added: src/categories/dto/paginated-categories.dto.ts
       added: src/categories/dto/index.ts
       added: src/categories/infrastructure/persistence/relational/entities/category.entity.ts
       added: src/categories/infrastructure/persistence/relational/entities/index.ts
       added: src/categories/infrastructure/persistence/relational/mappers/category.mapper.ts
       added: src/categories/infrastructure/persistence/relational/mappers/index.ts
       added: src/categories/infrastructure/persistence/relational/repositories/category.repository.abstract.ts
       added: src/categories/infrastructure/persistence/relational/repositories/index.ts
       added: src/categories/infrastructure/persistence/relational/category.repository.ts
       added: src/categories/infrastructure/persistence/relational/index.ts
       added: src/categories/infrastructure/persistence/relational/relational-persistence.module.ts
       added: src/categories/service/categories.service.ts
       added: src/categories/service/index.ts
       added: src/categories/categories.controller.ts
       added: src/categories/categories.module.ts
       added: src/categories/index.ts
```

## Post-Generation Checklist

### 1. Update Enum Export (if enum was created)

```typescript
// src/enums/index.ts
export * from './track-status.enum';
export * from './user-role.enum';
export * from './category-status.enum'; // ← Add this
```

### 2. Register Module in App

```typescript
// src/app.module.ts
import { CategoriesModule } from './categories/categories.module';

@Module({
  imports: [
    // ... other modules
    CategoriesModule, // ← Add this
  ],
})
export class AppModule {}
```

### 3. Customize Entity

```typescript
// src/categories/infrastructure/persistence/relational/entities/category.entity.ts
@Entity({ name: 'categories' })
export class CategoryEntity {
  // Add your custom columns here
  @Column({ type: 'varchar', length: 100, unique: true })
  slug!: string;

  @Column({ type: 'integer', default: 0 })
  displayOrder!: number;

  // ... existing generated fields
}
```

### 4. Add Custom Repository Methods

```typescript
// src/categories/infrastructure/persistence/relational/repositories/category.repository.abstract.ts
export abstract class CategoryRepositoryAbstract {
  // ... existing CRUD methods

  // Add custom domain queries
  abstract findBySlug(slug: string): Promise<Category | null>;
  abstract findActive(): Promise<Category[]>;
}
```

### 5. Implement Custom Methods

```typescript
// src/categories/infrastructure/persistence/relational/category.repository.ts
export class CategoryRepository extends CategoryRepositoryAbstract {
  // ... existing methods

  async findBySlug(slug: string): Promise<Category | null> {
    const entity = await this.typOrmRepository.findOne({ where: { slug } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findActive(): Promise<Category[]> {
    const entities = await this.typOrmRepository.find({
      where: { status: CategoryStatus.Active },
      order: { displayOrder: 'ASC' },
    });
    return this.mapper.toDomainArray(entities);
  }
}
```

### 6. Update Service

```typescript
// src/categories/service/categories.service.ts
export class CategoriesService {
  // Add business logic methods
  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findBySlug(slug);
    if (!category) {
      throw new NotFoundException(`Category with slug ${slug} not found`);
    }
    return category;
  }
}
```

### 7. Create Migration

```bash
bun run migration:generate src/database/migrations/CreateCategoriesTable
```

### 8. Run Migration

```bash
bun run migration:run
```

### 9. Test Endpoints

- GET `/api/v1/categories` - List all
- GET `/api/v1/categories/:id` - Get one
- POST `/api/v1/categories` - Create (auth required)
- PUT `/api/v1/categories/:id` - Update (auth required)
- DELETE `/api/v1/categories/:id` - Delete (auth required)

## Tips

- **Module name**: Use singular, lowercase (e.g., `product`, not `Product` or `products`)
- **Plural form**: Manually specify plural (e.g., `category` → `categories`)
- **Enum naming**: Use PascalCase with descriptive suffix (e.g., `ProductStatus`, `OrderType`)
- **Always run lint**: `bun run lint` after generation to fix any formatting
- **Always run build**: `bun run build` to verify TypeScript compilation

## Templates Location

Templates are stored in `.hygen/module/new/` directory. You can customize them as needed.

## Architecture Benefits

✅ Full CRUD operations out of the box
✅ Follows MODULE_RULES.md structure
✅ Repository pattern with BaseRepositoryImpl
✅ Swagger documentation included
✅ JWT authentication guards on protected endpoints
✅ Proper error handling (NotFoundException)
✅ Pagination support
✅ TypeORM entity with snake_case columns
✅ Domain-driven design separation

## Need Help?

See [.hygen/README.md](.hygen/README.md) for detailed documentation.
