import { IUploadFile } from '../../uploads/interfaces';

/**
 * Material domain interface
 * Represents downloadable materials/resources for lessons
 */
export interface Material {
  id: string;
  lessonId: string;
  title: string;
  file: IUploadFile;
  type: string; // PDF, DOC, IMAGE, VIDEO, etc.
  description?: string;
  downloadCount?: number;
  // Soft-delete fields
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
