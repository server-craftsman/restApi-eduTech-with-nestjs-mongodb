import { NotificationType } from '../../enums';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: NotificationType;
  /** Deep link URL for mobile/web — opens target screen directly */
  actionUrl?: string | null;
  /** Extra metadata (e.g., courseId, examId, badge name) */
  metadata?: Record<string, unknown> | null;
  /** Whether email was also sent for this notification */
  emailSent: boolean;
  /** Novu notification ID (for tracking) */
  novuMessageId?: string | null;
  createdAt: Date;
}
