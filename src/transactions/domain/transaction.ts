import {
  PaymentProvider,
  TransactionStatus,
  SubscriptionPeriod,
} from '../../enums';

/**
 * Transaction domain interface — represents a single payment attempt.
 *
 * ── Flow ──────────────────────────────────────────────────────────────────
 * 1. User selects a plan → POST /payments/initiate → creates Transaction (PENDING)
 * 2. SePay webhook fires → PATCH status to SUCCESS
 * 3. PaymentService auto-creates UserSubscription (ACTIVE)
 */
export interface Transaction {
  id: string;

  /** Người thực hiện thanh toán */
  userId: string;

  /** Gói đăng ký mà giao dịch này liên quan */
  planId: string;

  /** Chu kỳ thanh toán: MONTHLY | YEARLY */
  subscriptionPeriod: SubscriptionPeriod;

  /** Số tiền (VND) */
  amount: number;

  /** Đơn vị tiền tệ */
  currency: string;

  /** Cổng thanh toán: SEPAY | MOMO | VNPAY */
  provider: PaymentProvider;

  /** Mã giao dịch phía cổng thanh toán (unique) */
  providerRefId: string;

  /** Trạng thái giao dịch */
  status: TransactionStatus;

  /** Mô tả nội dung chuyển khoản */
  description?: string | null;

  /** Thời điểm thanh toán thành công */
  paidAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}
