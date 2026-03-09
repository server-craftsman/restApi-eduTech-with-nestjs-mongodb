import { ExamScope } from '../../enums';

/**
 * Exam domain interface — represents a curated set of questions with a time limit.
 *
 * Mỗi đề thi phải thuộc về một khoá học (`courseId`) và có thể được gắn với
 * một chương cụ thể (`chapterId`) nếu `scope = 'chapter'`.
 *
 * ─── Ownership ────────────────────────────────────────────────────────────
 * - `createdBy` : userId của giáo viên / admin tạo đề.
 * - `courseId`  : ID khoá học mà đề thi này thuộc về.
 * - `chapterId` : ID chương (chỉ có khi scope = 'chapter').
 *
 * ─── Scope ─────────────────────────────────────────────────────────────────
 * - ExamScope.Course  → Đề thi cuối khoá (toàn bộ nội dung khoá học).
 * - ExamScope.Chapter → Đề thi cuối chương (chỉ nội dung một chương).
 */
export interface Exam {
  id: string;

  /** Tiêu đề hiển thị cho học sinh */
  title: string;

  /** Hướng dẫn hoặc mô tả tuỳ chọn */
  description?: string | null;

  // ── Ownership / Context ───────────────────────────────────────────────────

  /** Phạm vi đề thi: cuối khoá học hay cuối chương */
  scope: ExamScope;

  /** ID khoá học mà đề thi này thuộc về (bắt buộc) */
  courseId: string;

  /** ID chương — bắt buộc khi scope = 'chapter', null khi scope = 'course' */
  chapterId?: string | null;

  /** userId của giáo viên / admin đã tạo đề thi */
  createdBy: string;

  // ── Content ───────────────────────────────────────────────────────────────

  /** Danh sách ID câu hỏi theo đúng thứ tự trong đề */
  questionIds: string[];

  /** Số câu hỏi (đồng bộ với questionIds.length) */
  totalQuestions: number;

  /** Thời gian làm bài tính bằng giây (frontend dùng để đếm ngược) */
  timeLimitSeconds: number;

  /** Điểm tối thiểu (0–100) để qua môn. Mặc định 50. */
  passingScore: number;

  /** Đề thi có hiển thị với học sinh không */
  isPublished: boolean;

  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
