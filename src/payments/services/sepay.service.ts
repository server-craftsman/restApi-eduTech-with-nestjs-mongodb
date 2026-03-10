import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * SePay payment gateway service.
 *
 * SePay is a Vietnamese payment aggregator that works by monitoring
 * bank account transactions and sending webhooks when a transfer is detected.
 *
 * Flow:
 * 1. We generate a unique order code (transfer content)
 * 2. Build a QR code URL containing: bank account, amount, transfer content
 * 3. User scans QR → makes bank transfer with exact content
 * 4. SePay detects the transfer → sends webhook to our endpoint
 * 5. We match transfer content → confirm the transaction
 */
@Injectable()
export class SePayService {
  private readonly logger = new Logger(SePayService.name);
  private readonly apiKey: string;
  private readonly bankAccount: string;
  private readonly bankName: string;
  private readonly webhookSecret: string;

  constructor(private readonly configService: ConfigService) {
    const sepay = this.configService.get<{
      apiKey: string;
      bankAccount: string;
      bankName: string;
      webhookSecret: string;
    }>('sepay')!;

    this.apiKey = sepay.apiKey;
    this.bankAccount = sepay.bankAccount;
    this.bankName = sepay.bankName;
    this.webhookSecret = sepay.webhookSecret;
  }

  /**
   * Generate a unique order code to be used as transfer content.
   * Format: EDUTECH + timestamp + random suffix
   * This ensures each payment has a unique identifier that SePay
   * will include in the webhook payload.
   */
  generateOrderCode(): string {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `EDUTECH${timestamp}${random}`;
  }

  /**
   * Build the SePay QR code URL for bank transfer.
   *
   * @see https://docs.sepay.vn/qr-code.html
   *
   * @param amount    — Amount in VND
   * @param orderCode — Unique transfer content (nội dung chuyển khoản)
   * @returns QR code image URL
   */
  buildQrCodeUrl(amount: number, orderCode: string): string {
    const params = new URLSearchParams({
      acc: this.bankAccount,
      bank: this.bankName,
      amount: amount.toString(),
      des: orderCode,
    });
    return `https://qr.sepay.vn/img?${params.toString()}`;
  }

  /**
   * Get the bank account number for display to the user.
   */
  getBankAccount(): string {
    return this.bankAccount;
  }

  /**
   * Verify the webhook signature from SePay.
   *
   * SePay sends an `Authorization` header with `Apikey <api_key>`.
   * We compare it against our stored API key to authenticate the webhook.
   *
   * NOTE: crypto.timingSafeEqual throws if buffer lengths differ —
   * we guard against this explicitly before calling it.
   *
   * Dev-mode bypass: if SEPAY_API_KEY is not configured (empty string),
   * signature verification is skipped with a warning so local development
   * can test without real SePay credentials.
   *
   * @param authorizationHeader — The full Authorization header value
   * @returns true if the webhook is authentic
   */
  verifyWebhookSignature(authorizationHeader: string | undefined): boolean {
    if (!authorizationHeader) {
      this.logger.warn('SePay webhook: missing Authorization header');
      return false;
    }

    // Dev-mode bypass: SEPAY_WEBHOOK_SECRET not configured → skip verification
    if (!this.webhookSecret) {
      this.logger.warn(
        'SEPAY_WEBHOOK_SECRET is not set — skipping signature verification. ' +
          'This is only safe in development. Set SEPAY_WEBHOOK_SECRET in production!',
      );
      return true;
    }

    // SePay sends: "Apikey <your_webhook_secret>"
    const expectedHeader = `Apikey ${this.webhookSecret}`;
    const a = Buffer.from(authorizationHeader);
    const b = Buffer.from(expectedHeader);

    // CRITICAL: crypto.timingSafeEqual throws ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH
    // if the two buffers have different byte lengths. Guard explicitly.
    if (a.length !== b.length) {
      this.logger.warn(
        `SePay webhook: Authorization header length mismatch ` +
          `(received ${a.length} bytes, expected ${b.length} bytes). ` +
          `Check that SEPAY_API_KEY matches the key in your SePay portal.`,
      );
      return false;
    }

    const isValid = crypto.timingSafeEqual(a, b);
    if (!isValid) {
      this.logger.warn('SePay webhook: API key mismatch');
    }
    return isValid;
  }

  /**
   * Extract the order code from the transfer content.
   *
   * The bank transfer content may contain extra text added by the bank.
   * We look for our EDUTECH prefix pattern to extract the order code.
   *
   * @param content — Raw transfer content from SePay webhook
   * @returns The extracted order code, or null if not found
   */
  extractOrderCode(content: string): string | null {
    // Our order codes start with EDUTECH followed by digits + hex
    const match = content.match(/EDUTECH[A-Z0-9]+/i);
    return match ? match[0].toUpperCase() : null;
  }
}
