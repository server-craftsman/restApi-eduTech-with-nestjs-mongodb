import { Injectable } from '@nestjs/common';
import { StudentProfile } from '../../../../domain/student-profile';
import { StudentProfileDocumentType } from '../schemas/student-profile.schema';

@Injectable()
export class StudentProfileMapper {
  toDomain(doc: StudentProfileDocumentType): StudentProfile {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      fullName: doc.fullName,
      gender: doc.gender ?? null,
      dateOfBirth: doc.dateOfBirth ?? null,
      schoolName: doc.schoolName ?? null,
      gradeLevel: doc.gradeLevel ?? null,
      preferredSubjectIds: doc.preferredSubjectIds ?? [],
      onboardingCompleted: doc.onboardingCompleted ?? false,
      diamondBalance: doc.diamondBalance,
      xpTotal: doc.xpTotal,
      currentStreak: doc.currentStreak,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  toDomainArray(docs: StudentProfileDocumentType[]): StudentProfile[] {
    return docs.map((doc) => this.toDomain(doc));
  }
}
