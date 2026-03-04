import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  NotFoundException,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ParentProfileService } from './parent-profile.service';
import { UpdateParentProfileDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { UserRole } from '../enums';
import { User } from '../users/domain/user';
import { BaseController } from '../core/base/base.controller';

@ApiTags('Parent Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parent-profiles')
export class ParentProfileController extends BaseController {
  constructor(private readonly parentProfileService: ParentProfileService) {
    super();
  }

  // ─── Current parent ───────────────────────────────────────────────────────

  @Get('me')
  @Roles(UserRole.Parent)
  @ApiOperation({
    summary: 'Get my parent profile',
    description: 'Returns the profile of the currently authenticated parent.',
  })
  @ApiResponse({ status: 200, description: 'Parent profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getMyProfile(
    @Req() req: Request & { user: User },
    @Res() res: Response,
  ) {
    const profile = await this.parentProfileService.getProfileByUserId(
      req.user.id,
    );
    if (!profile) throw new NotFoundException('Parent profile not found');
    return this.sendSuccess(res, profile, 'Profile fetched', HttpStatus.OK);
  }

  @Put('me')
  @Roles(UserRole.Parent)
  @ApiOperation({ summary: 'Update my parent profile' })
  @ApiBody({ type: UpdateParentProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async updateMyProfile(
    @Req() req: Request & { user: User },
    @Body() dto: UpdateParentProfileDto,
    @Res() res: Response,
  ) {
    const existing = await this.parentProfileService.getProfileByUserId(
      req.user.id,
    );
    if (!existing) throw new NotFoundException('Parent profile not found');
    const updated = await this.parentProfileService.updateProfile(
      existing.id,
      dto,
    );
    return this.sendSuccess(res, updated, 'Profile updated', HttpStatus.OK);
  }

  // ─── Admin endpoints ──────────────────────────────────────────────────────

  @Get()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: '[Admin] List all parent profiles' })
  @ApiResponse({ status: 200, description: 'Array of parent profiles' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllProfiles(@Res() res: Response) {
    const profiles = await this.parentProfileService.getAllProfiles();
    return this.sendSuccess(res, profiles, 'Profiles fetched', HttpStatus.OK);
  }

  @Get(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: '[Admin] Get parent profile by profile ID' })
  @ApiParam({ name: 'id', description: 'Profile ObjectId' })
  @ApiResponse({ status: 200, description: 'Parent profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getProfileById(@Param('id') id: string, @Res() res: Response) {
    const profile = await this.parentProfileService.getProfileById(id);
    if (!profile) throw new NotFoundException('Parent profile not found');
    return this.sendSuccess(res, profile, 'Profile fetched', HttpStatus.OK);
  }

  @Put(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: '[Admin] Update a parent profile by ID' })
  @ApiParam({ name: 'id', description: 'Profile ObjectId' })
  @ApiBody({ type: UpdateParentProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async updateProfile(
    @Param('id') id: string,
    @Body() data: UpdateParentProfileDto,
    @Res() res: Response,
  ) {
    const profile = await this.parentProfileService.updateProfile(id, data);
    if (!profile) throw new NotFoundException('Parent profile not found');
    return this.sendSuccess(res, profile, 'Profile updated', HttpStatus.OK);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: '[Admin] Delete a parent profile by ID' })
  @ApiParam({ name: 'id', description: 'Profile ObjectId' })
  @ApiResponse({ status: 200, description: 'Profile deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteProfile(@Param('id') id: string, @Res() res: Response) {
    await this.parentProfileService.deleteProfile(id);
    return this.sendSuccess(res, {}, 'Profile deleted', HttpStatus.OK);
  }
}
