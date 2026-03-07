import { Injectable } from '@nestjs/common';
import { Course } from '../../../../domain/course';
import { CourseDocumentType } from '../schemas/course.schema';
import { BaseMapper } from '../../../../../core/base/base.mapper';

@Injectable()
export class CourseMapper extends BaseMapper<Course, CourseDocumentType> {
  toDomain(doc: CourseDocumentType): Course {
    return {
      id: doc._id.toString(),
      subjectId: doc.subjectId.toString(),
      gradeLevelId: doc.gradeLevelId.toString(),
      authorId: doc.authorId.toString(),
      title: doc.title,
      description: doc.description,
      thumbnailUrl: {
        publicId: doc.thumbnailUrl?.publicId || '',
        url: doc.thumbnailUrl?.url || '',
      },
      status: doc.status,
      type: doc.type,
      approvalNote: doc.approvalNote ?? null,
      isDeleted: doc.isDeleted,
      deletedAt: doc.deletedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
