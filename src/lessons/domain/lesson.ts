import { IUploadFile } from '../../uploads/interfaces';

export interface Lesson {
  id: string;
  chapterId: string;
  title: string;
  description: string;
  orderIndex: number;
  durationSeconds: number;
  video: IUploadFile;
  quizId?: string; // Link to quiz
  contentMd: string;
  isPreview: boolean;
  // Soft-delete fields
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
