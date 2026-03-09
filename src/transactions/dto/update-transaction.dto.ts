import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsEnum, IsOptional } from 'class-validator';
import {
  TransactionStatus,
  PaymentProvider,
  SubscriptionPeriod,
} from '../../enums';

export class UpdateTransactionDto {
  @ApiPropertyOptional({
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Subscription plan ID',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString()
  @IsOptional()
  planId?: string;

  @ApiPropertyOptional({
    description: 'Subscription period',
    enum: SubscriptionPeriod,
    enumName: 'SubscriptionPeriod',
  })
  @IsEnum(SubscriptionPeriod)
  @IsOptional()
  subscriptionPeriod?: SubscriptionPeriod;

  @ApiPropertyOptional({
    description: 'Transaction amount (VND)',
    example: 99000,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'VND',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Payment provider',
    enum: PaymentProvider,
    enumName: 'PaymentProvider',
  })
  @IsEnum(PaymentProvider)
  @IsOptional()
  provider?: PaymentProvider;

  @ApiPropertyOptional({
    description: 'Provider reference ID',
    example: 'EDUTECH1718000000123',
  })
  @IsString()
  @IsOptional()
  providerRefId?: string;

  @ApiPropertyOptional({
    description: 'Transaction status',
    enum: TransactionStatus,
    enumName: 'TransactionStatus',
  })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @ApiPropertyOptional({
    description: 'Transfer description',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
