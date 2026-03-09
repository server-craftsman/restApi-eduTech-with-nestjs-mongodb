import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Payload sent by the client to start a new payment flow.
 *
 * The server will:
 * 1. Look up the plan → use plan.price and plan.durationDays directly
 * 2. Generate a unique order code
 * 3. Create a PENDING Transaction
 * 4. Return QR code data for the user to scan & transfer
 *
 * Note: subscriptionPeriod is derived from the plan's durationDays on the server.
 * No need for the client to send it.
 */
export class InitiatePaymentDto {
  @ApiProperty({
    description: 'ID of the subscription plan to purchase',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString()
  @IsNotEmpty()
  planId!: string;
}
