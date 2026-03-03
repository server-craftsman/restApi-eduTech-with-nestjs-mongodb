import { Injectable } from '@nestjs/common';
import { Subject } from '../../../../domain/subject';
import {
  SubjectDocument,
  SubjectDocumentType,
} from '../schemas/subject.schema';
import { BaseMapper } from '../../../../../core/base/base.mapper';

@Injectable()
export class SubjectMapper extends BaseMapper<Subject, SubjectDocumentType> {
  toDomain(doc: SubjectDocumentType): Subject {
    return {
      id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      iconUrl: {
        publicId: doc.iconUrl?.publicId ?? '',
        url: doc.iconUrl?.url ?? '',
      },
      // Soft-delete fields — always map with safe defaults
      isDeleted: doc.isDeleted ?? false,
      deletedAt: doc.deletedAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  // CRITICAL: explicit field-by-field mapping (NOT spread/destructure)
  // Prevents Mongoose from overwriting unrelated fields with undefined
  toDocument(subject: Partial<Subject>): Partial<SubjectDocument> {
    const doc: Record<string, unknown> = {};
    if (subject.name !== undefined) doc.name = subject.name;
    if (subject.slug !== undefined) doc.slug = subject.slug;
    if (subject.iconUrl !== undefined) {
      doc.iconUrl = {
        publicId: subject.iconUrl.publicId,
        url: subject.iconUrl.url,
      };
    }
    if (subject.isDeleted !== undefined) doc.isDeleted = subject.isDeleted;
    if (subject.deletedAt !== undefined) doc.deletedAt = subject.deletedAt;
    return doc as Partial<SubjectDocument>;
  }
}
