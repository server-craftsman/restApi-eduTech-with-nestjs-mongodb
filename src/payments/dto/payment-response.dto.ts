import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus } from '../../enums';

/**
 * Response returned after initiating a payment.
 * Contains the QR code URL and transfer details for the user.
 */
export class PaymentInitiatedResponseDto {
  @ApiProperty({
    description: 'Transaction ID',
    example: '665a1b2c3d4e5f6a7b8c9d0e',
  })
  transactionId!: string;

  @ApiProperty({
    description: 'Unique order code used as transfer content',
    example: 'EDUTECH1718000000123',
  })
  orderCode!: string;

  @ApiProperty({
    description: 'QR code image URL for bank transfer',
    example:
      'https://qr.sepay.vn/img?acc=0123456789&bank=MBBank&amount=99000&des=EDUTECH1718000000123',
  })
  qrCodeUrl!: string;

  @ApiProperty({ description: 'Amount to transfer (VND)', example: 99000 })
  amount!: number;

  @ApiProperty({ description: 'Bank account number', example: '0123456789' })
  bankAccount!: string;

  @ApiProperty({
    description: 'Transfer content — user MUST enter this exactly',
    example: 'EDUTECH1718000000123',
  })
  transferContent!: string;

  @ApiProperty({
    description: 'Transaction status (always PENDING at this stage)',
    enum: TransactionStatus,
    enumName: 'TransactionStatus',
    example: TransactionStatus.Pending,
  })
  status!: TransactionStatus;
}

/**
 * Response when checking payment / transaction status.
 */
export class PaymentStatusResponseDto {
  @ApiProperty({ description: 'Transaction ID' })
  transactionId!: string;

  @ApiProperty({
    description: 'Current transaction status',
    enum: TransactionStatus,
    enumName: 'TransactionStatus',
  })
  status!: TransactionStatus;

  @ApiPropertyOptional({
    description: 'Timestamp when payment was confirmed',
    type: Date,
    nullable: true,
  })
  paidAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Subscription ID created after successful payment',
    nullable: true,
  })
  subscriptionId?: string | null;
}
