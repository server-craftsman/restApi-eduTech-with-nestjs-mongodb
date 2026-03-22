import { Model, HydratedDocument, UpdateQuery, SortOrder } from 'mongoose';

type FindFilter<TDoc> = Parameters<Model<TDoc>['find']>[0];
type CountFilter<TDoc> = Parameters<Model<TDoc>['countDocuments']>[0];
type CreateInput<TDoc> = Parameters<Model<TDoc>['create']>[0];

/**
 * Base repository abstract class with common repository patterns for MongoDB/Mongoose
 *
 * @template TDomain - Domain model type (e.g., Course)
 * @template TDocument - Mongoose document class type (e.g., CourseDocument)
 * @template TDocumentType - Hydrated document type (e.g., CourseDocumentType)
 */
export abstract class BaseRepository<
  TDomain,
  TDocument,
  TDocumentType extends HydratedDocument<TDocument>,
> {
  protected abstract model: Model<TDocumentType>;
  protected abstract mapper: {
    toDomain(document: TDocumentType): TDomain;
    toDomainArray(documents: TDocumentType[]): TDomain[];
    toDocument?(domain: Partial<TDomain>): Partial<TDocument>;
  };

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<TDomain | null> {
    const doc = await this.model.findById(id).lean().exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  /**
   * Find all entities with pagination
   * @param limit - Number of items to return (default: 10)
   * @param offset - Number of items to skip (default: 0)
   * @returns Tuple of [items, total count]
   */
  async findAll(
    limit: number = 10,
    offset: number = 0,
  ): Promise<[TDomain[], number]> {
    const [docs, total] = await Promise.all([
      this.model
        .find()
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean()
        .exec(),
      this.model.countDocuments().exec(),
    ]);
    return [this.mapper.toDomainArray(docs), total];
  }

  /**
   * Find entities by filter with optional sorting
   * @param filter - MongoDB filter object
   * @param sort - MongoDB sort object
   * @returns Array of domain entities
   */
  async findByFilter(
    filter: Record<string, unknown>,
    sort?: Record<string, SortOrder | { $meta: 'textScore' }>,
  ): Promise<TDomain[]> {
    let query = this.model.find(filter as FindFilter<TDocumentType>);
    if (sort) {
      query = query.sort(sort);
    }
    const docs = await query.lean().exec();
    return this.mapper.toDomainArray(docs);
  }

  /**
   * Find entities by filter with pagination
   * @param filter - MongoDB filter object
   * @param sort - MongoDB sort object
   * @param skip - Number of items to skip
   * @param limit - Number of items to return
   * @returns Array of domain entities
   */
  async findByFilterWithPagination(
    filter: Record<string, unknown>,
    sort: Record<string, SortOrder | { $meta: 'textScore' }>,
    skip: number,
    limit: number,
  ): Promise<TDomain[]> {
    const docs = await this.model
      .find(filter as FindFilter<TDocumentType>)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
    return this.mapper.toDomainArray(docs);
  }

  /**
   * Create new entity
   * @param entity - Partial domain entity to create
   * @returns Created domain entity
   */
  async create(entity: Partial<TDomain>): Promise<TDomain> {
    const documentData = this.mapper.toDocument
      ? this.mapper.toDocument(entity)
      : entity;
    const created = await this.model.create(
      documentData as CreateInput<TDocumentType>,
    );
    return this.mapper.toDomain(created);
  }

  /**
   * Update entity by ID
   * @param id - Entity ID
   * @param entity - Partial domain entity with updates
   * @returns Updated domain entity or null if not found
   */
  async update(id: string, entity: Partial<TDomain>): Promise<TDomain | null> {
    const documentData = this.mapper.toDocument
      ? this.mapper.toDocument(entity)
      : entity;
    const doc = await this.model
      .findByIdAndUpdate(id, documentData as UpdateQuery<TDocumentType>, {
        new: true,
      })
      .exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  /**
   * Delete entity by ID (hard delete)
   * @param id - Entity ID
   */
  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }

  /**
   * Count documents matching filter
   * @param filter - MongoDB filter object
   * @returns Number of matching documents
   */
  async count(filter: Record<string, unknown> = {}): Promise<number> {
    return this.model.countDocuments(filter as CountFilter<TDocumentType>).exec();
  }

  /**
   * Check if document exists by ID
   * @param id - Entity ID
   * @returns true if exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.model
      .countDocuments({ _id: id } as CountFilter<TDocumentType>)
      .exec();
    return count > 0;
  }

  /**
   * Soft delete entity by ID (sets isDeleted flag)
   * @param id - Entity ID
   * @param deletedAt - Deletion timestamp (default: now)
   */
  async softDelete(id: string, deletedAt: Date = new Date()): Promise<void> {
    await this.model
      .findByIdAndUpdate(id, {
        isDeleted: true,
        deletedAt,
      } as UpdateQuery<TDocumentType>)
      .exec();
  }

  /**
   * Restore soft-deleted entity
   * @param id - Entity ID
   */
  async restore(id: string): Promise<TDomain | null> {
    const doc = await this.model
      .findByIdAndUpdate(
        id,
        {
          isDeleted: false,
          deletedAt: null,
        } as UpdateQuery<TDocumentType>,
        { new: true },
      )
      .exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }
}
