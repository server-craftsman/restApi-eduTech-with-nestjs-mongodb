import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsEnum,
  IsOptional,
} from 'class-validator';
import {
  TransactionStatus,
  PaymentProvider,
  SubscriptionPeriod,
} from '../../enums';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: 'Subscription plan ID',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString()
  @IsNotEmpty()
  planId!: string;

  @ApiProperty({
    description: 'Subscription period',
    enum: SubscriptionPeriod,
    enumName: 'SubscriptionPeriod',
    example: SubscriptionPeriod.Monthly,
  })
  @IsEnum(SubscriptionPeriod)
  @IsNotEmpty()
  subscriptionPeriod!: SubscriptionPeriod;

  @ApiProperty({
    description: 'Transaction amount (VND)',
    example: 99000,
  })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'VND',
    default: 'VND',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Payment provider',
    enum: PaymentProvider,
    enumName: 'PaymentProvider',
    example: PaymentProvider.SePay,
  })
  @IsEnum(PaymentProvider)
  @IsNotEmpty()
  provider!: PaymentProvider;

  @ApiProperty({
    description: 'Provider reference ID (unique order code)',
    example: 'EDUTECH1234567890',
  })
  @IsString()
  @IsNotEmpty()
  providerRefId!: string;

  @ApiProperty({
    description: 'Transaction status',
    enum: TransactionStatus,
    enumName: 'TransactionStatus',
    example: TransactionStatus.Pending,
  })
  @IsEnum(TransactionStatus)
  @IsNotEmpty()
  status!: TransactionStatus;

  @ApiPropertyOptional({
    description: 'Transfer description / content',
    example: 'Nang cap Pro Monthly',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
