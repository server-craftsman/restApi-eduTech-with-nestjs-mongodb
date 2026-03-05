export interface Chapter {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  isPublished: boolean;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
