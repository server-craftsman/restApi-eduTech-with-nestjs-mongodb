import {
  Controller,
  // Get,
  // Post,
  // Put,
  // Delete,
  // Param,
  // Body,
  // Res,
  // HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  // ApiOperation,
  // ApiResponse,
  ApiBearerAuth,
  // ApiParam,
} from '@nestjs/swagger';
// import { Response } from 'express';
import { UserSubscriptionService } from './user-subscription.service';
// import { CreateUserSubscriptionDto, UpdateUserSubscriptionDto } from './dto';
import { BaseController } from '../core/base/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../roles';
import { UserRole } from '../enums';

@ApiTags('User Subscriptions')
@Controller('user-subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
@ApiBearerAuth()
export class UserSubscriptionController extends BaseController {
  constructor(
    private readonly userSubscriptionService: UserSubscriptionService,
  ) {
    super();
  }

  // ─── READ ───────────────────────────────────────────────────────────────────

  // @Get()
  // @ApiOperation({ summary: 'List all user subscriptions (Admin only)' })
  // @ApiResponse({ status: 200, description: 'Subscriptions retrieved' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 403, description: 'Forbidden – Admin only' })
  // async getAllSubscriptions(@Res() res: Response): Promise<Response> {
  //   const data = await this.userSubscriptionService.getAllSubscriptions();
  //   return this.sendSuccess(res, data, 'Subscriptions retrieved successfully');
  // }

  // @Get('user/:userId')
  // @ApiOperation({ summary: 'Get all subscriptions for a user (Admin only)' })
  // @ApiParam({ name: 'userId', description: 'User ObjectId' })
  // @ApiResponse({ status: 200, description: 'Subscriptions retrieved' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 403, description: 'Forbidden – Admin only' })
  // async getByUserId(
  //   @Param('userId') userId: string,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   const data = await this.userSubscriptionService.findByUserId(userId);
  //   return this.sendSuccess(res, data, 'Subscriptions retrieved successfully');
  // }

  // @Get('user/:userId/active')
  // @ApiOperation({ summary: "Get user's active subscription (Admin only)" })
  // @ApiParam({ name: 'userId', description: 'User ObjectId' })
  // @ApiResponse({ status: 200, description: 'Active subscription retrieved' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 403, description: 'Forbidden – Admin only' })
  // async getActiveSubscription(
  //   @Param('userId') userId: string,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   const data =
  //     await this.userSubscriptionService.findActiveSubscription(userId);
  //   return this.sendSuccess(
  //     res,
  //     data,
  //     'Active subscription retrieved successfully',
  //   );
  // }

  // @Get('user/:userId/status/:status')
  // @ApiOperation({ summary: "Get user's subscriptions by status (Admin only)" })
  // @ApiParam({ name: 'userId', description: 'User ObjectId' })
  // @ApiParam({
  //   name: 'status',
  //   description: 'SubscriptionStatus: ACTIVE | EXPIRED | CANCELLED',
  // })
  // @ApiResponse({ status: 200, description: 'Subscriptions retrieved' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 403, description: 'Forbidden – Admin only' })
  // async getByUserAndStatus(
  //   @Param('userId') userId: string,
  //   @Param('status') status: string,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   const data = await this.userSubscriptionService.findByUserAndStatus(
  //     userId,
  //     status,
  //   );
  //   return this.sendSuccess(res, data, 'Subscriptions retrieved successfully');
  // }

  // @Get('user/:userId/is-valid')
  // @ApiOperation({
  //   summary: 'Check if user has a valid Pro subscription (Admin only)',
  // })
  // @ApiParam({ name: 'userId', description: 'User ObjectId' })
  // @ApiResponse({ status: 200, description: 'Validity checked' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 403, description: 'Forbidden – Admin only' })
  // async isValid(
  //   @Param('userId') userId: string,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   const isValid =
  //     await this.userSubscriptionService.isSubscriptionValid(userId);
  //   return this.sendSuccess(res, { isValid }, 'Subscription validity checked');
  // }

  // @Get(':id')
  // @ApiOperation({ summary: 'Get subscription by ID (Admin only)' })
  // @ApiParam({ name: 'id', description: 'Subscription ObjectId' })
  // @ApiResponse({ status: 200, description: 'Subscription retrieved' })
  // @ApiResponse({ status: 404, description: 'Subscription not found' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 403, description: 'Forbidden – Admin only' })
  // async getSubscriptionById(
  //   @Param('id') id: string,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   const data = await this.userSubscriptionService.getSubscriptionById(id);
  //   if (!data) {
  //     return this.sendError(
  //       res,
  //       'Subscription not found',
  //       'Subscription not found',
  //       HttpStatus.NOT_FOUND,
  //     );
  //   }
  //   return this.sendSuccess(res, data, 'Subscription retrieved successfully');
  // }

  // // ─── WRITE ──────────────────────────────────────────────────────────────────

  // @Post()
  // @ApiOperation({ summary: 'Manually create a subscription (Admin only)' })
  // @ApiResponse({ status: 201, description: 'Subscription created' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 403, description: 'Forbidden – Admin only' })
  // async createSubscription(
  //   @Body() data: CreateUserSubscriptionDto,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   const subscription =
  //     await this.userSubscriptionService.createSubscription(data);
  //   return this.sendSuccess(
  //     res,
  //     subscription,
  //     'Subscription created successfully',
  //     HttpStatus.CREATED,
  //   );
  // }

  // @Put(':id')
  // @ApiOperation({ summary: 'Update a subscription (Admin only)' })
  // @ApiParam({ name: 'id', description: 'Subscription ObjectId' })
  // @ApiResponse({ status: 200, description: 'Subscription updated' })
  // @ApiResponse({ status: 404, description: 'Subscription not found' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 403, description: 'Forbidden – Admin only' })
  // async updateSubscription(
  //   @Param('id') id: string,
  //   @Body() data: UpdateUserSubscriptionDto,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   const subscription = await this.userSubscriptionService.updateSubscription(
  //     id,
  //     data,
  //   );
  //   if (!subscription) {
  //     return this.sendError(
  //       res,
  //       'Subscription not found',
  //       'Subscription not found',
  //       HttpStatus.NOT_FOUND,
  //     );
  //   }
  //   return this.sendSuccess(
  //     res,
  //     subscription,
  //     'Subscription updated successfully',
  //   );
  // }

  // @Put(':id/expire')
  // @ApiOperation({ summary: 'Force-expire a subscription (Admin only)' })
  // @ApiParam({ name: 'id', description: 'Subscription ObjectId' })
  // @ApiResponse({ status: 200, description: 'Subscription expired' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 403, description: 'Forbidden – Admin only' })
  // async expireSubscription(
  //   @Param('id') id: string,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   const subscription =
  //     await this.userSubscriptionService.expireSubscription(id);
  //   return this.sendSuccess(
  //     res,
  //     subscription,
  //     'Subscription expired successfully',
  //   );
  // }

  // @Delete(':id')
  // @ApiOperation({ summary: 'Delete a subscription (Admin only)' })
  // @ApiParam({ name: 'id', description: 'Subscription ObjectId' })
  // @ApiResponse({ status: 200, description: 'Subscription deleted' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 403, description: 'Forbidden – Admin only' })
  // async deleteSubscription(
  //   @Param('id') id: string,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   await this.userSubscriptionService.deleteSubscription(id);
  //   return this.sendSuccess(res, null, 'Subscription deleted successfully');
  // }
}
