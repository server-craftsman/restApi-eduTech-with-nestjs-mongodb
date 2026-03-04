import { Injectable } from '@nestjs/common';
import { ParentProfile } from '../../../../domain/parent-profile';
import {
  ParentProfileDocument,
  ParentProfileDocumentType,
} from '../schemas/parent-profile.schema';

@Injectable()
export class ParentProfileMapper {
  toDomain(doc: ParentProfileDocumentType): ParentProfile {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      fullName: doc.fullName,
      phoneNumber: doc.phoneNumber,
      relationship: doc.relationship ?? null,
      nationalIdNumber: doc.nationalIdNumber ?? null,
      nationalIdImageUrl: doc.nationalIdImageUrl ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  toDomainArray(docs: ParentProfileDocumentType[]): ParentProfile[] {
    return docs.map((doc) => this.toDomain(doc));
  }

  toDocument(data: Partial<ParentProfile>): Partial<ParentProfileDocument> {
    const doc: Record<string, unknown> = {};
    if (data.fullName !== undefined) doc.fullName = data.fullName;
    if (data.phoneNumber !== undefined) doc.phoneNumber = data.phoneNumber;
    if (data.relationship !== undefined) doc.relationship = data.relationship;
    if (data.nationalIdNumber !== undefined)
      doc.nationalIdNumber = data.nationalIdNumber;
    if (data.nationalIdImageUrl !== undefined)
      doc.nationalIdImageUrl = data.nationalIdImageUrl;
    return doc as Partial<ParentProfileDocument>;
  }
}
