import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { TransactionService } from '../transactions/transaction.service';
import { SubscriptionPlanService } from '../subscription-plans/subscription-plan.service';
import { UserSubscriptionService } from '../user-subscriptions/user-subscription.service';
import { SePayService } from './services/sepay.service';
import { InitiatePaymentDto } from './dto';
import {
  PaymentProvider,
  TransactionStatus,
  SubscriptionPeriod,
  SubscriptionStatus,
} from '../enums';
import { Transaction } from '../transactions/domain/transaction';
import {
  PlanBenefitDto,
  PlanPricingDto,
  PlanComparisonResponseDto,
} from './dto/plan-comparison.dto';
import { UsersService } from '../users/users.service';
import { NotificationTriggersService } from '../notifications/services';

/**
 * Payment orchestration service.
 *
 * ── Bước 1: initiatePayment ───────────────────────────────────────────
 *   Client sends planId + period → we create a PENDING transaction,
 *   generate QR code, return transfer info.
 *
 * ── Bước 2: handleSePayWebhook ────────────────────────────────────────
 *   SePay detects bank transfer → sends webhook → we match the order
 *   code → mark transaction SUCCESS → auto-activate subscription.
 *
 * ── Bước 3: getPaymentStatus ──────────────────────────────────────────
 *   Client polls this endpoint to know when payment is confirmed.
 *
 * ── Plan comparison ──────────────────────────────────────────────────
 *   Returns Free vs Pro benefits and pricing for the paywall screen.
 */
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly transactionService: TransactionService,
    private readonly subscriptionPlanService: SubscriptionPlanService,
    private readonly userSubscriptionService: UserSubscriptionService,
    private readonly sePayService: SePayService,
    private readonly usersService: UsersService,
    private readonly notificationTriggers: NotificationTriggersService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════
  // Bước 1 — Initiate Payment
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Start a payment flow: validate plan, create PENDING transaction,
   * build QR code URL for the user to scan.
   */
  async initiatePayment(
    userId: string,
    dto: InitiatePaymentDto,
  ): Promise<{
    transactionId: string;
    orderCode: string;
    qrCodeUrl: string;
    amount: number;
    bankAccount: string;
    transferContent: string;
    status: TransactionStatus;
  }> {
    // 1. Look up the plan
    const plan = await this.subscriptionPlanService.getPlanById(dto.planId);
    if (!plan) {
      throw new NotFoundException(`Subscription plan ${dto.planId} not found`);
    }

    // 2. Check if user already has an active subscription
    const existingSub =
      await this.userSubscriptionService.findActiveSubscription(userId);
    if (existingSub) {
      const isValid =
        await this.userSubscriptionService.isSubscriptionValid(userId);
      if (isValid) {
        throw new BadRequestException(
          'You already have an active Pro subscription. It expires on ' +
            existingSub.endDate.toISOString(),
        );
      }
    }

    // 3. Use plan price directly
    const amount = plan.price;
    const subscriptionPeriod = this.guessPeriod(plan.durationDays);

    // 4. Generate unique order code
    const orderCode = this.sePayService.generateOrderCode();

    // 5. Build QR code URL
    const qrCodeUrl = this.sePayService.buildQrCodeUrl(amount, orderCode);

    // 6. Create PENDING transaction
    const transaction = await this.transactionService.recordTransaction({
      userId,
      planId: dto.planId,
      subscriptionPeriod,
      amount,
      currency: 'VND',
      provider: PaymentProvider.SePay,
      providerRefId: orderCode,
      status: TransactionStatus.Pending,
      description: `Nang cap ${plan.name}`,
      paidAt: null,
    });

    this.logger.log(
      `Payment initiated: user=${userId}, plan=${plan.name}, ` +
        `period=${subscriptionPeriod}, amount=${amount}, order=${orderCode}`,
    );

    return {
      transactionId: transaction.id,
      orderCode,
      qrCodeUrl,
      amount,
      bankAccount: this.sePayService.getBankAccount(),
      transferContent: orderCode,
      status: TransactionStatus.Pending,
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // Bước 2 — Handle SePay Webhook
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Process an incoming SePay webhook.
   *
   * @param content      — Transfer content from the webhook payload
   * @param amount       — Transfer amount from the webhook
   * @param authHeader   — Authorization header for verification
   * @returns true if transaction was matched and confirmed
   */
  async handleSePayWebhook(
    content: string,
    amount: number,
    authHeader: string | undefined,
  ): Promise<{ success: boolean; message: string }> {
    // 1. Verify webhook authenticity
    if (!this.sePayService.verifyWebhookSignature(authHeader)) {
      throw new ForbiddenException('Invalid webhook signature');
    }

    // 2. Extract our order code from transfer content
    const orderCode = this.sePayService.extractOrderCode(content);
    if (!orderCode) {
      this.logger.warn(`No order code found in content: "${content}"`);
      return {
        success: false,
        message: 'Order code not found in transfer content',
      };
    }

    // 3. Find the PENDING transaction by providerRefId
    const transaction =
      await this.transactionService.findByProviderRefId(orderCode);
    if (!transaction) {
      this.logger.warn(`No transaction found for order code: ${orderCode}`);
      return { success: false, message: 'Transaction not found' };
    }

    // 4. Check it's still PENDING
    if (transaction.status !== TransactionStatus.Pending) {
      this.logger.warn(
        `Transaction ${transaction.id} already ${transaction.status}`,
      );
      return {
        success: false,
        message: `Transaction already ${transaction.status}`,
      };
    }

    // 5. Verify amount matches
    if (amount < transaction.amount) {
      this.logger.warn(
        `Amount mismatch: expected ${transaction.amount}, got ${amount}`,
      );
      return { success: false, message: 'Amount mismatch' };
    }

    // 6. Mark transaction as SUCCESS
    await this.transactionService.updateTransaction(transaction.id, {
      status: TransactionStatus.Success,
      paidAt: new Date(),
    });

    // 7. Activate subscription
    await this.activateSubscription(transaction);

    this.logger.log(
      `Payment confirmed: txn=${transaction.id}, user=${transaction.userId}, ` +
        `amount=${amount}, order=${orderCode}`,
    );

    return {
      success: true,
      message: 'Payment confirmed and subscription activated',
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // [DEV] Simulate Payment — manually confirm without real webhook
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Manually confirm a PENDING transaction by its order code.
   *
   * FOR DEVELOPMENT / TESTING ONLY.
   * Simulates exactly what the SePay webhook does so you can test the
   * full payment → subscription activation flow on localhost without
   * needing ngrok or a public URL.
   *
   * Endpoint: POST /payments/admin/simulate-payment/:orderCode
   */
  async simulatePayment(
    orderCode: string,
  ): Promise<{ success: boolean; message: string }> {
    const transaction =
      await this.transactionService.findByProviderRefId(orderCode);
    if (!transaction) {
      throw new NotFoundException(
        `No PENDING transaction found for order code: ${orderCode}`,
      );
    }
    if (transaction.status !== TransactionStatus.Pending) {
      throw new BadRequestException(
        `Transaction is already ${transaction.status}. Only PENDING transactions can be simulated.`,
      );
    }

    await this.transactionService.updateTransaction(transaction.id, {
      status: TransactionStatus.Success,
      paidAt: new Date(),
    });

    await this.activateSubscription(transaction);

    this.logger.log(
      `[DEV SIMULATE] Payment confirmed: txn=${transaction.id}, ` +
        `user=${transaction.userId}, order=${orderCode}`,
    );

    return {
      success: true,
      message: `Transaction ${orderCode} confirmed and subscription activated (simulated).`,
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // Bước 3 — Check Payment Status
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get the current status of a payment transaction.
   * Used by the client to poll for payment confirmation.
   */
  async getPaymentStatus(
    transactionId: string,
    userId: string,
  ): Promise<{
    transactionId: string;
    status: TransactionStatus;
    paidAt: Date | null;
    subscriptionId: string | null;
  }> {
    const transaction =
      await this.transactionService.getTransactionById(transactionId);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    if (transaction.userId !== userId) {
      throw new ForbiddenException('Transaction does not belong to you');
    }

    // If payment is SUCCESS, look up the subscription
    let subscriptionId: string | null = null;
    if (transaction.status === TransactionStatus.Success) {
      const sub =
        await this.userSubscriptionService.findActiveSubscription(userId);
      subscriptionId = sub?.id ?? null;
    }

    return {
      transactionId: transaction.id,
      status: transaction.status,
      paidAt: transaction.paidAt ?? null,
      subscriptionId,
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // Plan Comparison — Paywall screen data
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Build the plan comparison data for the paywall / upgrade screen.
   */
  async getPlanComparison(userId: string): Promise<PlanComparisonResponseDto> {
    // 1. Check if user is already Pro
    const isCurrentlyPro =
      await this.userSubscriptionService.isSubscriptionValid(userId);

    // 2. Load all plans to get pricing and features
    const plans = await this.subscriptionPlanService.getAllPlans();

    // 3. Build pricing options (only Pro plans)
    const pricing: PlanPricingDto[] = plans
      .filter((p) => p.price > 0) // exclude free tier
      .map((p) => ({
        planId: p.id,
        period: this.guessPeriod(p.durationDays),
        price: p.price,
        originalPrice: null,
        durationDays: p.durationDays,
      }));

    // 4. Build benefit comparison dynamically from plan features
    const freePlan = plans.find((p) => p.name === 'free');
    const proPlan = plans.find((p) => p.price > 0); // First pro plan

    const benefits: PlanBenefitDto[] = this.buildBenefitsComparison(
      freePlan?.features ?? [],
      proPlan?.features ?? [],
    );

    return { benefits, pricing, isCurrentlyPro };
  }

  /**
   * Seed default subscription plans (idempotent).
   *
   * - If a plan does not exist by name => create
   * - If a plan exists => update price/duration/features to latest defaults
   */
  async seedDefaultPlans(): Promise<{
    created: string[];
    updated: string[];
    total: number;
  }> {
    const defaults: Array<{
      name: string;
      price: number;
      durationDays: number;
      features: string[];
    }> = [
      {
        name: 'free',
        price: 0,
        durationDays: 36500,
        features: [
          'Giới hạn 5 bài học/ngày',
          'Giới hạn 2 lần thi/ngày',
          'AI trợ lý cơ bản',
          'Có quảng cáo',
        ],
      },
      {
        name: 'pro_monthly',
        price: 99000,
        durationDays: 30,
        features: [
          'Học không giới hạn',
          'Thi không giới hạn',
          'AI trợ lý nâng cao',
          'Không quảng cáo',
          'Tải offline',
          'Thống kê chi tiết',
          'Hỗ trợ ưu tiên',
        ],
      },
      {
        name: 'pro_yearly',
        price: 990000,
        durationDays: 365,
        features: [
          'Học không giới hạn',
          'Thi không giới hạn',
          'AI trợ lý nâng cao',
          'Không quảng cáo',
          'Tải offline',
          'Thống kê chi tiết',
          'Hỗ trợ ưu tiên',
        ],
      },
    ];

    const created: string[] = [];
    const updated: string[] = [];

    for (const plan of defaults) {
      const existing = await this.subscriptionPlanService.findByName(plan.name);
      if (!existing) {
        await this.subscriptionPlanService.createPlan(plan);
        created.push(plan.name);
        continue;
      }

      await this.subscriptionPlanService.updatePlan(existing.id, {
        price: plan.price,
        durationDays: plan.durationDays,
        features: plan.features,
      });
      updated.push(plan.name);
    }

    return {
      created,
      updated,
      total: defaults.length,
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // Private helpers
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Auto-create an ACTIVE UserSubscription after payment success.
   */
  private async activateSubscription(transaction: Transaction): Promise<void> {
    const plan = await this.subscriptionPlanService.getPlanById(
      transaction.planId,
    );
    if (!plan) {
      this.logger.error(
        `Plan ${transaction.planId} not found during subscription activation`,
      );
      return;
    }

    // Expire any existing active subscription first
    const existing = await this.userSubscriptionService.findActiveSubscription(
      transaction.userId,
    );
    if (existing) {
      await this.userSubscriptionService.expireSubscription(existing.id);
    }

    // Calculate subscription period
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    await this.userSubscriptionService.createSubscription({
      userId: transaction.userId,
      planId: transaction.planId,
      startDate,
      endDate,
      status: SubscriptionStatus.Active,
    });

    void this.tryPushPaymentNotifications(transaction, plan.name, endDate);

    this.logger.log(
      `Subscription activated: user=${transaction.userId}, ` +
        `plan=${plan.name}, until=${endDate.toISOString()}`,
    );
  }

  private async tryPushPaymentNotifications(
    transaction: Transaction,
    planName: string,
    endDate: Date,
  ): Promise<void> {
    try {
      const user = await this.usersService.findById(transaction.userId);
      if (!user?.email) return;

      await this.notificationTriggers.onPaymentConfirmed(
        user.id,
        user.email,
        transaction.amount,
        planName,
        user.email.split('@')[0],
      );

      await this.notificationTriggers.onSubscriptionUpdate(
        user.id,
        user.email,
        planName,
        'activated',
        endDate,
        user.email.split('@')[0],
      );
    } catch {
      // Notification failure must never block payment flow
    }
  }

  /**
   * Guess the period from durationDays (for display purposes and transaction metadata).
   */
  private guessPeriod(durationDays: number): SubscriptionPeriod {
    if (durationDays <= 31) return SubscriptionPeriod.Monthly;
    return SubscriptionPeriod.Yearly;
  }

  /**
   * Build benefit comparison rows from Free and Pro plan features.
   * Maps each index to a row with label derived from feature text.
   */
  private buildBenefitsComparison(
    freeFeatures: string[],
    proFeatures: string[],
  ): PlanBenefitDto[] {
    const maxLength = Math.max(freeFeatures.length, proFeatures.length);
    const benefits: PlanBenefitDto[] = [];

    for (let i = 0; i < maxLength; i++) {
      const freeText = freeFeatures[i] ?? '';
      const proText = proFeatures[i] ?? '';

      // Extract label from either feature (prefer pro if available)
      const label = this.extractFeatureLabel(proText || freeText);

      benefits.push({
        label,
        free: freeText || 'Không hỗ trợ',
        pro: proText || 'Không hỗ trợ',
      });
    }

    return benefits;
  }

  /**
   * Extract a clean label from feature text.
   * Example: "Giới hạn 5 bài học/ngày" → "Bài học"
   */
  private extractFeatureLabel(feature: string): string {
    // Simple heuristic: take first meaningful word/phrase
    // You can enhance this with more sophisticated parsing
    if (feature.includes('bài học')) return 'Truy cập bài học';
    if (feature.includes('thi')) return 'Đề thi thử';
    if (feature.includes('AI') || feature.includes('trợ lý'))
      return 'Trợ lý AI';
    if (feature.includes('quảng cáo')) return 'Quảng cáo';
    if (feature.includes('offline') || feature.includes('tải'))
      return 'Tải offline';
    if (feature.includes('thống kê')) return 'Thống kê học tập';
    if (feature.includes('hỗ trợ')) return 'Hỗ trợ';

    // Default: use first 3 words or full text if short
    const words = feature.split(' ');
    return words.slice(0, 3).join(' ');
  }
}
