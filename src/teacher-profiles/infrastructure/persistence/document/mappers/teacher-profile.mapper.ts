import { Injectable } from '@nestjs/common';
import { TeacherProfile } from '../../../../domain/teacher-profile';
import {
  TeacherProfileDocument,
  TeacherProfileDocumentType,
} from '../schemas/teacher-profile.schema';

@Injectable()
export class TeacherProfileMapper {
  toDomain(doc: TeacherProfileDocumentType): TeacherProfile {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      fullName: doc.fullName,
      bio: doc.bio ?? null,
      phoneNumber: doc.phoneNumber ?? null,
      subjectsTaught: doc.subjectsTaught ?? [],
      yearsOfExperience: doc.yearsOfExperience ?? null,
      educationLevel: doc.educationLevel ?? null,
      certificateUrls: doc.certificateUrls ?? [],
      cvUrl: doc.cvUrl ?? null,
      linkedinUrl: doc.linkedinUrl ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  toDomainArray(docs: TeacherProfileDocumentType[]): TeacherProfile[] {
    return docs.map((doc) => this.toDomain(doc));
  }

  toDocument(data: Partial<TeacherProfile>): Partial<TeacherProfileDocument> {
    const doc: Record<string, unknown> = {};
    if (data.fullName !== undefined) doc.fullName = data.fullName;
    if (data.bio !== undefined) doc.bio = data.bio;
    if (data.phoneNumber !== undefined) doc.phoneNumber = data.phoneNumber;
    if (data.subjectsTaught !== undefined)
      doc.subjectsTaught = data.subjectsTaught;
    if (data.yearsOfExperience !== undefined)
      doc.yearsOfExperience = data.yearsOfExperience;
    if (data.educationLevel !== undefined)
      doc.educationLevel = data.educationLevel;
    if (data.certificateUrls !== undefined)
      doc.certificateUrls = data.certificateUrls;
    if (data.cvUrl !== undefined) doc.cvUrl = data.cvUrl;
    if (data.linkedinUrl !== undefined) doc.linkedinUrl = data.linkedinUrl;
    return doc as Partial<TeacherProfileDocument>;
  }
}
