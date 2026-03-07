import { Injectable } from '@nestjs/common';
import { Lesson } from '../../../../domain/lesson';
import { LessonDocumentType } from '../schemas/lesson.schema';

@Injectable()
export class LessonMapper {
  toDomain(doc: LessonDocumentType): Lesson {
    return {
      id: doc._id.toString(),
      chapterId: doc.chapterId.toString(),
      title: doc.title,
      description: doc.description,
      orderIndex: doc.orderIndex,
      video: {
        url: doc.video.url,
        fileSize: doc.video.fileSize ?? undefined,
        publicId: doc.video.publicId ?? undefined,
        durationSeconds: doc.video.durationSeconds ?? undefined,
      },
      contentMd: doc.contentMd,
      isPreview: doc.isPreview,
      quizId: doc.quizId?.toString() ?? undefined,
      isDeleted: doc.isDeleted ?? false,
      deletedAt: doc.deletedAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  toDomainArray(docs: LessonDocumentType[]): Lesson[] {
    return docs.map((doc) => this.toDomain(doc));
  }
}
