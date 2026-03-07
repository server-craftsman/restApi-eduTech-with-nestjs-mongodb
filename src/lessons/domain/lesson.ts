import { IUploadFile } from '../../uploads/interfaces';

export interface Lesson {
  id: string;
  chapterId: string;
  title: string;
  description: string;
  orderIndex: number;
  video: IUploadFile; // includes durationSeconds for video files
  contentMd: string;
  isPreview: boolean;
  // Soft-delete fields
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
