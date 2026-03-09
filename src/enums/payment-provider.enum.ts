/**
 * Payment provider / gateway identifiers.
 *
 * SePay is the primary gateway for EduTech.
 * Legacy values (MOMO, VNPAY) are kept for backward compatibility.
 */
export enum PaymentProvider {
  SePay = 'SEPAY',
  Momo = 'MOMO',
  VnPay = 'VNPAY',
}
