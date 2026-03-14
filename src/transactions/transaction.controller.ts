import {
  Controller,
  Get,
  Param,
  Res,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { TransactionService } from './transaction.service';
import { BaseController } from '../core/base/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../roles';
import { UserRole } from '../enums';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
@ApiBearerAuth()
export class TransactionController extends BaseController {
  constructor(private readonly transactionService: TransactionService) {
    super();
  }

  // ─── READ ───────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all transactions (Admin only)' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – Admin only' })
  async getAllTransactions(@Res() res: Response): Promise<Response> {
    const data = await this.transactionService.getAllTransactions();
    return this.sendSuccess(res, data, 'Transactions retrieved successfully');
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get transactions by user ID (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ObjectId' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – Admin only' })
  async getByUserId(
    @Param('userId') userId: string,
    @Res() res: Response,
  ): Promise<Response> {
    const data = await this.transactionService.findByUserId(userId);
    return this.sendSuccess(res, data, 'Transactions retrieved successfully');
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get transactions by status (Admin only)' })
  @ApiParam({
    name: 'status',
    description: 'TransactionStatus: PENDING | SUCCESS | FAILED',
  })
  @ApiResponse({ status: 200, description: 'Transactions retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – Admin only' })
  async getByStatus(
    @Param('status') status: string,
    @Res() res: Response,
  ): Promise<Response> {
    const data = await this.transactionService.findByStatus(status);
    return this.sendSuccess(res, data, 'Transactions retrieved successfully');
  }

  @Get('provider-ref/:providerRefId')
  @ApiOperation({
    summary: 'Get transaction by payment provider reference (Admin only)',
  })
  @ApiParam({
    name: 'providerRefId',
    description: 'External provider reference ID',
  })
  @ApiResponse({ status: 200, description: 'Transaction retrieved' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – Admin only' })
  async getByProviderRefId(
    @Param('providerRefId') providerRefId: string,
    @Res() res: Response,
  ): Promise<Response> {
    const data =
      await this.transactionService.findByProviderRefId(providerRefId);
    if (!data) {
      return this.sendError(
        res,
        'Transaction not found',
        'Transaction not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.sendSuccess(res, data, 'Transaction retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Transaction ObjectId' })
  @ApiResponse({ status: 200, description: 'Transaction retrieved' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – Admin only' })
  async getTransactionById(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    const data = await this.transactionService.getTransactionById(id);
    if (!data) {
      return this.sendError(
        res,
        'Transaction not found',
        'Transaction not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.sendSuccess(res, data, 'Transaction retrieved successfully');
  }

  // ─── WRITE ──────────────────────────────────────────────────────────────────

  // @Post()
  // @ApiOperation({ summary: 'Manually record a transaction (Admin only)' })
  // @ApiResponse({ status: 201, description: 'Transaction recorded' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 403, description: 'Forbidden – Admin only' })
  // async recordTransaction(
  //   @Body() data: CreateTransactionDto,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   const transaction = await this.transactionService.recordTransaction({
  //     ...data,
  //     currency: data.currency ?? 'VND',
  //     paidAt: null,
  //   });
  //   return this.sendSuccess(
  //     res,
  //     transaction,
  //     'Transaction recorded successfully',
  //     HttpStatus.CREATED,
  //   );
  // }

  // @Put(':id')
  // @ApiOperation({ summary: 'Update a transaction (Admin only)' })
  // @ApiParam({ name: 'id', description: 'Transaction ObjectId' })
  // @ApiResponse({ status: 200, description: 'Transaction updated' })
  // @ApiResponse({ status: 404, description: 'Transaction not found' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 403, description: 'Forbidden – Admin only' })
  // async updateTransaction(
  //   @Param('id') id: string,
  //   @Body() data: UpdateTransactionDto,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   const transaction = await this.transactionService.updateTransaction(
  //     id,
  //     data,
  //   );
  //   if (!transaction) {
  //     return this.sendError(
  //       res,
  //       'Transaction not found',
  //       'Transaction not found',
  //       HttpStatus.NOT_FOUND,
  //     );
  //   }
  //   return this.sendSuccess(
  //     res,
  //     transaction,
  //     'Transaction updated successfully',
  //   );
  // }

  // @Put(':id/status/:status')
  // @ApiOperation({ summary: 'Update transaction status (Admin only)' })
  // @ApiParam({ name: 'id', description: 'Transaction ObjectId' })
  // @ApiParam({
  //   name: 'status',
  //   description: 'TransactionStatus: PENDING | SUCCESS | FAILED',
  // })
  // @ApiResponse({ status: 200, description: 'Transaction status updated' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 403, description: 'Forbidden – Admin only' })
  // async updateStatus(
  //   @Param('id') id: string,
  //   @Param('status') status: string,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   const transaction = await this.transactionService.updateTransactionStatus(
  //     id,
  //     status,
  //   );
  //   return this.sendSuccess(
  //     res,
  //     transaction,
  //     'Transaction status updated successfully',
  //   );
  // }

  // @Delete(':id')
  // @ApiOperation({ summary: 'Delete a transaction (Admin only)' })
  // @ApiParam({ name: 'id', description: 'Transaction ObjectId' })
  // @ApiResponse({ status: 200, description: 'Transaction deleted' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 403, description: 'Forbidden – Admin only' })
  // async deleteTransaction(
  //   @Param('id') id: string,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   await this.transactionService.deleteTransaction(id);
  //   return this.sendSuccess(res, null, 'Transaction deleted successfully');
  // }
}
