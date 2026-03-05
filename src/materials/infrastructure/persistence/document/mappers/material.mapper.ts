import { Injectable } from '@nestjs/common';
import { Material } from '../../../../domain/material';
import { MaterialDocumentType } from '../schemas/material.schema';

@Injectable()
export class MaterialMapper {
  toDomain(doc: MaterialDocumentType): Material {
    return {
      id: doc._id.toString(),
      lessonId: doc.lessonId.toString(),
      title: doc.title,
      file: {
        url: doc.file.url,
        fileSize: doc.file.fileSize ?? undefined,
        publicId: doc.file.publicId ?? undefined,
      },
      type: doc.type,
      description: doc.description,
      downloadCount: doc.downloadCount ?? 0,
      isDeleted: doc.isDeleted ?? false,
      deletedAt: doc.deletedAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  toDomainArray(docs: MaterialDocumentType[]): Material[] {
    return docs.map((doc) => this.toDomain(doc));
  }
}
