import {
  Controller,
  Get,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  NotFoundException,
  HttpCode,
  ParseIntPipe,
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
import { StudentProfileService } from './student-profile.service';
import { UpdateStudentProfileDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { UserRole } from '../enums';
import { User } from '../users/domain/user';
import { BaseController } from '../core/base/base.controller';

@ApiTags('Student Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('student-profiles')
export class StudentProfileController extends BaseController {
  constructor(private readonly studentProfileService: StudentProfileService) {
    super();
  }

  // ─── Current student ──────────────────────────────────────────────────────

  @Get('me')
  @Roles(UserRole.Student)
  @ApiOperation({
    summary: 'Get my student profile',
    description: 'Returns the profile of the currently authenticated student.',
  })
  @ApiResponse({ status: 200, description: 'Student profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getMyProfile(
    @Req() req: Request & { user: User },
    @Res() res: Response,
  ) {
    const profile = await this.studentProfileService.getProfileByUserId(
      req.user.id,
    );
    if (!profile) throw new NotFoundException('Student profile not found');
    return this.sendSuccess(res, profile, 'Profile fetched', HttpStatus.OK);
  }

  @Put('me')
  @Roles(UserRole.Student)
  @ApiOperation({ summary: 'Update my student profile' })
  @ApiBody({ type: UpdateStudentProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async updateMyProfile(
    @Req() req: Request & { user: User },
    @Body() dto: UpdateStudentProfileDto,
    @Res() res: Response,
  ) {
    const existing = await this.studentProfileService.getProfileByUserId(
      req.user.id,
    );
    if (!existing) throw new NotFoundException('Student profile not found');
    const updated = await this.studentProfileService.updateProfile(
      existing.id,
      dto,
    );
    return this.sendSuccess(res, updated, 'Profile updated', HttpStatus.OK);
  }

  @Patch('me/xp')
  @Roles(UserRole.Student)
  @ApiOperation({ summary: 'Add XP to my student profile' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { amount: { type: 'integer', example: 50 } },
      required: ['amount'],
    },
  })
  @ApiResponse({ status: 200, description: 'XP added' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async addMyXp(
    @Req() req: Request & { user: User },
    @Body('amount', ParseIntPipe) amount: number,
    @Res() res: Response,
  ) {
    const existing = await this.studentProfileService.getProfileByUserId(
      req.user.id,
    );
    if (!existing) throw new NotFoundException('Student profile not found');
    const updated = await this.studentProfileService.addXp(existing.id, amount);
    return this.sendSuccess(res, updated, 'XP added', HttpStatus.OK);
  }

  @Patch('me/diamonds')
  @Roles(UserRole.Student)
  @ApiOperation({ summary: 'Add diamonds to my student profile' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { amount: { type: 'integer', example: 10 } },
      required: ['amount'],
    },
  })
  @ApiResponse({ status: 200, description: 'Diamonds added' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async addMyDiamonds(
    @Req() req: Request & { user: User },
    @Body('amount', ParseIntPipe) amount: number,
    @Res() res: Response,
  ) {
    const existing = await this.studentProfileService.getProfileByUserId(
      req.user.id,
    );
    if (!existing) throw new NotFoundException('Student profile not found');
    const updated = await this.studentProfileService.addDiamonds(
      existing.id,
      amount,
    );
    return this.sendSuccess(res, updated, 'Diamonds added', HttpStatus.OK);
  }

  // ─── Admin endpoints ──────────────────────────────────────────────────────

  @Get()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: '[Admin] List all student profiles' })
  @ApiResponse({ status: 200, description: 'Array of student profiles' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllProfiles(@Res() res: Response) {
    const profiles = await this.studentProfileService.getAllProfiles();
    return this.sendSuccess(res, profiles, 'Profiles fetched', HttpStatus.OK);
  }

  @Get(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: '[Admin] Get student profile by profile ID' })
  @ApiParam({ name: 'id', description: 'Profile ObjectId' })
  @ApiResponse({ status: 200, description: 'Student profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getProfileById(@Param('id') id: string, @Res() res: Response) {
    const profile = await this.studentProfileService.getProfileById(id);
    if (!profile) throw new NotFoundException('Student profile not found');
    return this.sendSuccess(res, profile, 'Profile fetched', HttpStatus.OK);
  }

  @Put(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: '[Admin] Update a student profile by ID' })
  @ApiParam({ name: 'id', description: 'Profile ObjectId' })
  @ApiBody({ type: UpdateStudentProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async updateProfile(
    @Param('id') id: string,
    @Body() data: UpdateStudentProfileDto,
    @Res() res: Response,
  ) {
    const profile = await this.studentProfileService.updateProfile(id, data);
    if (!profile) throw new NotFoundException('Student profile not found');
    return this.sendSuccess(res, profile, 'Profile updated', HttpStatus.OK);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: '[Admin] Delete a student profile by ID' })
  @ApiParam({ name: 'id', description: 'Profile ObjectId' })
  @ApiResponse({ status: 200, description: 'Profile deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteProfile(@Param('id') id: string, @Res() res: Response) {
    await this.studentProfileService.deleteProfile(id);
    return this.sendSuccess(res, {}, 'Profile deleted', HttpStatus.OK);
  }
}
