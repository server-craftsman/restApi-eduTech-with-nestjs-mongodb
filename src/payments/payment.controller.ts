import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Headers,
  Res,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExtraModels,
} from '@nestjs/swagger';
import { Response } from 'express';
import { BaseController } from '../core/base/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../roles';
import { UserRole } from '../enums';
import { CurrentUser } from '../auth/decorators';
import { User } from '../users/domain/user';
import { PaymentService } from './payment.service';
import {
  InitiatePaymentDto,
  PaymentInitiatedResponseDto,
  PaymentStatusResponseDto,
  PlanComparisonResponseDto,
  PlanBenefitDto,
  PlanPricingDto,
  SePayWebhookDto,
  SeedPlansResponseDto,
} from './dto';

@ApiTags('Payments')
@Controller('payments')
@ApiExtraModels(
  PlanBenefitDto,
  PlanPricingDto,
  PaymentInitiatedResponseDto,
  PaymentStatusResponseDto,
  SeedPlansResponseDto,
)
export class PaymentController extends BaseController {
  constructor(private readonly paymentService: PaymentService) {
    super();
  }

  // ─────────────────────────────────────────────────────────────────
  // POST /payments/admin/seed-plans — Seed default plans (admin only)
  // ─────────────────────────────────────────────────────────────────

  @Post('admin/seed-plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Seed default subscription plans (Admin only)',
    description:
      'Idempotent seed API for Free, Pro Monthly, Pro Yearly plans. ' +
      'If a plan exists by name, it will be updated to latest defaults.',
  })
  @ApiResponse({ status: 201, type: SeedPlansResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  async seedPlans(@Res() res: Response): Promise<Response> {
    const result = await this.paymentService.seedDefaultPlans();
    return this.sendSuccess(
      res,
      result,
      'Default subscription plans seeded successfully',
      HttpStatus.CREATED,
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // POST /payments/admin/simulate-payment/:orderCode — Dev test only
  // ─────────────────────────────────────────────────────────────────

  //   @Post('admin/simulate-payment/:orderCode')
  //   @UseGuards(JwtAuthGuard, RolesGuard)
  //   @Roles(UserRole.Admin)
  //   @ApiBearerAuth()
  //   @ApiOperation({
  //     summary: '[DEV] Simulate SePay webhook — confirm payment by order code',
  //     description:
  //       'Manually confirms a PENDING transaction and activates the subscription. ' +
  //       'Use this in development when SePay cannot reach localhost. ' +
  //       'Equivalent to what the real SePay webhook does after a bank transfer.',
  //   })
  //   @ApiResponse({
  //     status: 200,
  //     description: 'Payment simulated and subscription activated',
  //   })
  //   @ApiResponse({ status: 400, description: 'Transaction already processed' })
  //   @ApiResponse({ status: 401, description: 'Unauthorized' })
  //   @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  //   @ApiResponse({ status: 404, description: 'Order code not found' })
  //   async simulatePayment(
  //     @Param('orderCode') orderCode: string,
  //     @Res() res: Response,
  //   ): Promise<Response> {
  //     const result = await this.paymentService.simulatePayment(orderCode);
  //     return this.sendSuccess(res, result, result.message);
  //   }

  // ─────────────────────────────────────────────────────────────────
  // POST /payments/initiate — Start a payment (authenticated)
  // ─────────────────────────────────────────────────────────────────

  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Initiate a payment for subscription upgrade',
    description:
      'Creates a PENDING transaction, generates a QR code URL for bank transfer via SePay. ' +
      'User scans QR → transfers money → SePay webhook confirms → subscription activates.',
  })
  @ApiResponse({ status: 201, type: PaymentInitiatedResponseDto })
  @ApiResponse({ status: 400, description: 'Already has active subscription' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async initiatePayment(
    @Body() dto: InitiatePaymentDto,
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.paymentService.initiatePayment(user.id, dto);
    return this.sendSuccess(
      res,
      result,
      'Payment initiated. Please scan the QR code to complete the transfer.',
      HttpStatus.CREATED,
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // POST /payments/sepay/webhook — SePay webhook callback (public)
  // ─────────────────────────────────────────────────────────────────

  @Post('sepay/webhook')
  @ApiOperation({
    summary: 'SePay webhook callback (called by SePay server)',
    description:
      'Receives bank transfer notifications from SePay. ' +
      'Matches transfer content to pending transactions, confirms payment, ' +
      'and auto-activates user subscription.',
  })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  @ApiResponse({ status: 403, description: 'Invalid webhook signature' })
  async handleSePayWebhook(
    @Body() dto: SePayWebhookDto,
    @Headers('authorization') authHeader: string | undefined,
    @Res() res: Response,
  ): Promise<Response> {
    // Only process incoming transfers
    if (dto.transferType?.toLowerCase() !== 'in') {
      return this.sendSuccess(res, {
        success: true,
        message: 'Ignored outgoing transfer',
      });
    }

    const result = await this.paymentService.handleSePayWebhook(
      dto.content,
      dto.transferAmount,
      authHeader,
    );
    return this.sendSuccess(res, result, result.message);
  }

  // ─────────────────────────────────────────────────────────────────
  // GET /payments/:id/status — Check payment status (authenticated)
  // ─────────────────────────────────────────────────────────────────

  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check payment status (poll for confirmation)',
    description:
      'Client polls this endpoint after initiating payment to know when ' +
      'the bank transfer is confirmed by SePay.',
  })
  @ApiResponse({ status: 200, type: PaymentStatusResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Transaction does not belong to you',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getPaymentStatus(
    @Param('id') transactionId: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.paymentService.getPaymentStatus(
      transactionId,
      user.id,
    );
    return this.sendSuccess(res, result, 'Payment status retrieved');
  }

  // ─────────────────────────────────────────────────────────────────
  // GET /payments/plans/compare — Free vs Pro comparison (authenticated)
  // ─────────────────────────────────────────────────────────────────

  @Get('plans/compare')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get plan comparison for paywall screen',
    description:
      'Returns a side-by-side comparison of Free vs Pro benefits, ' +
      'available pricing options, and whether the user is already Pro.',
  })
  @ApiResponse({ status: 200, type: PlanComparisonResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPlanComparison(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.paymentService.getPlanComparison(user.id);
    return this.sendSuccess(res, result, 'Plan comparison retrieved');
  }
}
