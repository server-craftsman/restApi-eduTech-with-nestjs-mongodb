import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { Chapter } from '../../../../domain/chapter';
import { ChapterDocumentType } from '../schemas/chapter.schema';

@Injectable()
export class ChapterMapper {
  toDomain(doc: ChapterDocumentType): Chapter {
    return {
      id: doc._id.toString(),
      courseId: doc.courseId.toString(),
      title: doc.title,
      description: doc.description ?? null,
      orderIndex: doc.orderIndex,
      isPublished: doc.isPublished ?? false,
      isDeleted: doc.isDeleted ?? false,
      deletedAt: doc.deletedAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  toDomainArray(docs: ChapterDocumentType[]): Chapter[] {
    return docs.map((doc) => this.toDomain(doc));
  }

  toDocument(chapter: Partial<Chapter>): Partial<ChapterDocumentType> {
    const doc: Record<string, unknown> = {};
    if (chapter.courseId !== undefined) {
      doc.courseId = new Types.ObjectId(chapter.courseId);
    }
    if (chapter.title !== undefined) doc.title = chapter.title;
    if (chapter.description !== undefined)
      doc.description = chapter.description;
    if (chapter.orderIndex !== undefined) doc.orderIndex = chapter.orderIndex;
    if (chapter.isPublished !== undefined)
      doc.isPublished = chapter.isPublished;
    if (chapter.isDeleted !== undefined) doc.isDeleted = chapter.isDeleted;
    if (chapter.deletedAt !== undefined) doc.deletedAt = chapter.deletedAt;
    return doc as Partial<ChapterDocumentType>;
  }
}
