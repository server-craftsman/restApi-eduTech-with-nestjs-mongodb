/**
 * ApprovalStatus — controls whether a Teacher or Parent account
 * is allowed to log in after verifying their email.
 *
 * State machine:
 *   Student registers → NotRequired (bypass approval, login immediately)
 *   Teacher/Parent registers → (email verify) → PendingApproval
 *     → Admin approves → Approved  (can login)
 *     → Admin rejects  → Rejected  (blocked; user can resubmit)
 *     → User resubmits → PendingApproval  (cycle repeats)
 */
export enum ApprovalStatus {
  /** Used for Student accounts — no approval step required. */
  NotRequired = 'NOT_REQUIRED',
  /** Teacher/Parent account has been email-verified; awaiting admin review. */
  PendingApproval = 'PENDING_APPROVAL',
  /** Admin approved — account can log in with full access. */
  Approved = 'APPROVED',
  /** Admin rejected — login blocked until user resubmits and is approved. */
  Rejected = 'REJECTED',
}
