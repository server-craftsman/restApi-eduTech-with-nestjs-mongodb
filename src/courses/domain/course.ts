import { CourseStatus, CourseType } from '../../enums';
import { CloudinaryAsset } from '../../core/interfaces/cloudinary-asset.interface';

export interface Course {
  id: string;
  subjectId: string;
  gradeLevelId: string;
  authorId: string;
  title: string;
  description: string;
  thumbnailUrl: CloudinaryAsset;
  status: CourseStatus;
  type: CourseType;
  isDeleted: boolean; // Soft delete support
  deletedAt?: Date | null; // Soft delete timestamp
  createdAt: Date;
  updatedAt: Date;
}
