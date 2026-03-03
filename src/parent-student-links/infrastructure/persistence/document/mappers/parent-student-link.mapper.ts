import { Injectable } from '@nestjs/common';
import { ParentStudentLink } from '../../../../domain/parent-student-link';
import { ParentStudentLinkDocumentType } from '../schemas/parent-student-link.schema';

@Injectable()
export class ParentStudentLinkMapper {
  toDomain(doc: ParentStudentLinkDocumentType): ParentStudentLink {
    const raw = doc as unknown as Record<string, unknown>;
    return {
      id: doc._id.toString(),
      parentId: doc.parentId.toString(),
      studentId: doc.studentId.toString(),
      isVerified: doc.isVerified,
      linkCode: (raw['linkCode'] as string | null | undefined) ?? null,
      linkCodeExpires:
        (raw['linkCodeExpires'] as Date | null | undefined) ?? null,
      createdAt: doc.createdAt,
    };
  }

  toDomainArray(docs: ParentStudentLinkDocumentType[]): ParentStudentLink[] {
    return docs.map((doc) => this.toDomain(doc));
  }
}
