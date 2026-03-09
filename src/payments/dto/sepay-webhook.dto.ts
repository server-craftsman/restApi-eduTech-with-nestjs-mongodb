import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * Webhook payload sent by SePay when a bank transfer is detected.
 *
 * @see https://docs.sepay.vn/webhook.html
 *
 * SePay sends this JSON to our registered webhook URL.
 * We use `transferContent` (nội dung chuyển khoản) to match
 * the order code in our PENDING transaction.
 */
export class SePayWebhookDto {
  @ApiProperty({ description: 'SePay internal reference ID' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Gateway name', example: 'MBBank' })
  @IsString()
  gateway!: string;

  @ApiProperty({
    description: 'Transaction date from bank',
    example: '2025-06-10 14:30:00',
  })
  @IsString()
  transactionDate!: string;

  @ApiProperty({ description: 'Account number receiving the transfer' })
  @IsString()
  accountNumber!: string;

  @ApiPropertyOptional({ description: 'Sub-account (if applicable)' })
  @IsString()
  @IsOptional()
  subAccount?: string;

  @ApiProperty({ description: 'Transfer code from SePay' })
  @IsString()
  code!: string;

  @ApiProperty({
    description:
      'Transfer content (nội dung chuyển khoản) — contains our order code',
    example: 'EDUTECH1718000000123',
  })
  @IsString()
  content!: string;

  @ApiProperty({ description: 'Transferred amount', example: 99000 })
  @IsNumber()
  transferAmount!: number;

  @ApiProperty({
    description: 'IN for incoming, OUT for outgoing',
    example: 'in',
  })
  @IsString()
  transferType!: string;

  @ApiPropertyOptional({ description: 'Accumulated balance', example: 500000 })
  @IsNumber()
  @IsOptional()
  accumulated?: number;

  @ApiPropertyOptional({ description: 'Reference number from bank' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'Description / note from bank' })
  @IsString()
  @IsOptional()
  description?: string;
}
