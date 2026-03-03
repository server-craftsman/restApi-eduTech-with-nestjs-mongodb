import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SubjectDocument,
  SubjectDocumentType,
} from '../schemas/subject.schema';
import { SubjectRepositoryAbstract } from './subject.repository.abstract';
import { SubjectMapper } from '../mappers/subject.mapper';
import { Subject } from '../../../../domain/subject';
import { BaseRepositoryImpl } from '../../../../../core/base/base.repository.impl';

// Sentinel applied to all queries to exclude soft-deleted records
const NOT_DELETED = { isDeleted: { $ne: true } };

@Injectable()
export class SubjectRepository
  extends BaseRepositoryImpl<Subject, SubjectDocument, SubjectDocumentType>
  implements SubjectRepositoryAbstract
{
  constructor(
    @InjectModel(SubjectDocument.name)
    protected readonly model: Model<SubjectDocumentType>,
    protected readonly mapper: SubjectMapper,
  ) {
    super(model, mapper);
  }

  // ── Override base methods to add soft-delete gate ─────────────────────────────

  /** findById — always excludes soft-deleted records */
  async findById(id: string): Promise<Subject | null> {
    const doc = await this.model.findOne({ _id: id, ...NOT_DELETED }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  /** update — guards against updating soft-deleted records */
  async update(id: string, entity: Partial<Subject>): Promise<Subject | null> {
    const documentData = this.mapper.toDocument(entity);
    const doc = await this.model
      .findOneAndUpdate(
        { _id: id, ...NOT_DELETED },
        { $set: documentData },
        { new: true },
      )
      .exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  // ── Domain-specific methods ──────────────────────────────────────────────

  /** find all non-deleted subjects ordered newest first */
  async findAllSubjects(): Promise<Subject[]> {
    const docs = await this.model
      .find({ ...NOT_DELETED })
      .sort({ createdAt: -1 })
      .exec();
    return this.mapper.toDomainArray(docs);
  }

  /**
   * create — always initialises soft-delete fields to their default state
   * and persists iconUrl as a nested object { publicId, url }
   */
  async create(
    data: Omit<
      Subject,
      'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'
    >,
  ): Promise<Subject> {
    const doc = await this.model.create({
      name: data.name,
      slug: data.slug,
      iconUrl: {
        publicId: data.iconUrl.publicId,
        url: data.iconUrl.url,
      },
      isDeleted: false,
      deletedAt: null,
    });
    return this.mapper.toDomain(doc);
  }

  /** findBySlug — always excludes soft-deleted records */
  async findBySlug(slug: string): Promise<Subject | null> {
    const doc = await this.model.findOne({ slug, ...NOT_DELETED }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }
}
