import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto, UpdateTransactionDto } from './dto';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get('user/:userId')
  async getByUserId(@Param('userId') userId: string) {
    return this.transactionService.findByUserId(userId);
  }

  @Get('status/:status')
  async getByStatus(@Param('status') status: string) {
    return this.transactionService.findByStatus(status);
  }

  @Get('provider-ref/:providerRefId')
  async getByProviderRefId(@Param('providerRefId') providerRefId: string) {
    return this.transactionService.findByProviderRefId(providerRefId);
  }

  @Get(':id')
  async getTransactionById(@Param('id') id: string) {
    return this.transactionService.getTransactionById(id);
  }

  @Get()
  async getAllTransactions() {
    return this.transactionService.getAllTransactions();
  }

  @Post()
  async recordTransaction(@Body() data: CreateTransactionDto) {
    return this.transactionService.recordTransaction({
      ...data,
      currency: data.currency ?? 'VND',
      paidAt: null,
    });
  }

  @Put(':id')
  async updateTransaction(
    @Param('id') id: string,
    @Body() data: UpdateTransactionDto,
  ) {
    return this.transactionService.updateTransaction(id, data);
  }

  @Put(':id/status/:status')
  async updateStatus(@Param('id') id: string, @Param('status') status: string) {
    return this.transactionService.updateTransactionStatus(id, status);
  }

  @Delete(':id')
  async deleteTransaction(@Param('id') id: string) {
    await this.transactionService.deleteTransaction(id);
    return { message: 'Transaction deleted successfully' };
  }
}
