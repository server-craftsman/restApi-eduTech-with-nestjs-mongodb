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
  approvalNote?: string | null; // Admin's note when approving or rejecting the course
  isDeleted: boolean; // Soft delete support
  deletedAt?: Date | null; // Soft delete timestamp
  createdAt: Date;
  updatedAt: Date;
}
