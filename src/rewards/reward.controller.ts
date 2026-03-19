import {
  Controller,
  Get,
  Res,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExtraModels,
} from '@nestjs/swagger';
import { Response } from 'express';
import { RewardService } from './reward.service';
import { BadgeCatalogItemDto, MyRewardsDto } from './dto';
import { BaseController } from '../core/base/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../roles';
import { UserRole } from '../enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/domain/user';

@ApiTags('Rewards (Simple Reward System)')
@Controller('rewards')
@ApiExtraModels(BadgeCatalogItemDto, MyRewardsDto)
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 403, description: 'Forbidden' })
export class RewardController extends BaseController {
  constructor(private readonly rewardService: RewardService) {
    super();
  }

  // ══════════════════════════════════════════════════════════
  // Public — no auth required
  // ══════════════════════════════════════════════════════════

  /**
   * GET /rewards/badges/catalog
   * Returns all available badges with their point requirements.
   * Public — no authentication needed.
   */
  @Get('badges/catalog')
  @ApiOperation({
    summary: 'Get badge catalog (all possible badges with requirements)',
    description:
      'Returns every badge students can earn, ordered by ascending point threshold.',
  })
  @ApiResponse({ status: 200, type: [BadgeCatalogItemDto] })
  getCatalog(@Res() res: Response): Response {
    const catalog = this.rewardService.getBadgeCatalog();
    return this.sendSuccess(
      res,
      catalog,
      'Badge catalog retrieved successfully',
    );
  }

  // ══════════════════════════════════════════════════════════
  // Authenticated — own profile
  // ══════════════════════════════════════════════════════════

  /**
   * GET /rewards/my-rewards
   * Returns the authenticated student's points, earned badges, and next goal.
   */
  @Get('my-rewards')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.Student, UserRole.Teacher, UserRole.Admin)
  @ApiOperation({
    summary: 'Get my reward profile (points + badges + next goal)',
    description:
      'Returns total accumulated points, all unlocked badges, and information ' +
      'about the next badge the student can earn.',
  })
  @ApiResponse({ status: 200, type: MyRewardsDto })
  @ApiResponse({ status: 404, description: 'Student profile not found' })
  async getMyRewards(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const rewards = await this.rewardService.getMyRewards(user.id);
    if (!rewards) {
      throw new NotFoundException('Student profile not found');
    }
    return this.sendSuccess(
      res,
      rewards,
      'Reward profile retrieved successfully',
    );
  }

  // ══════════════════════════════════════════════════════════
  // Admin
  // ══════════════════════════════════════════════════════════

  /**
   * GET /rewards/admin/user/:userId
   * Admin can view any student's reward profile.
   */
  // @Get('admin/user/:userId')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @ApiBearerAuth()
  // @Roles(UserRole.Admin)
  // @ApiOperation({
  //   summary: "View any student's reward profile (Admin only)",
  // })
  // @ApiParam({ name: 'userId', example: '507f1f77bcf86cd799439011' })
  // @ApiResponse({ status: 200, type: MyRewardsDto })
  // @ApiResponse({ status: 404, description: 'Student profile not found' })
  // async getUserRewards(
  //   @Param('userId') userId: string,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   const rewards = await this.rewardService.getMyRewards(userId);
  //   if (!rewards) {
  //     throw new NotFoundException(
  //       `Student profile not found for user ${userId}`,
  //     );
  //   }
  //   return this.sendSuccess(
  //     res,
  //     rewards,
  //     'Reward profile retrieved successfully',
  //   );
  // }
}
