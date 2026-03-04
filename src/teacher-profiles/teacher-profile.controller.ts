import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  NotFoundException,
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
import { TeacherProfileService } from './teacher-profile.service';
import { CreateTeacherProfileDto, UpdateTeacherProfileDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { UserRole } from '../enums';
import { User } from '../users/domain/user';
import { BaseController } from '../core/base/base.controller';

@ApiTags('Teacher Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teacher-profiles')
export class TeacherProfileController extends BaseController {
  constructor(private readonly teacherProfileService: TeacherProfileService) {
    super();
  }

  // ─── Current teacher ──────────────────────────────────────────────────────

  @Get('me')
  @Roles(UserRole.Teacher)
  @ApiOperation({
    summary: 'Get my teacher profile',
    description: 'Returns the profile of the currently authenticated teacher.',
  })
  @ApiResponse({ status: 200, description: 'Teacher profile' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getMyProfile(
    @Req() req: Request & { user: User },
    @Res() res: Response,
  ) {
    const profile = await this.teacherProfileService.getProfileByUserId(
      req.user.id,
    );
    if (!profile) throw new NotFoundException('Teacher profile not found');
    return this.sendSuccess(res, profile, 'Profile fetched', HttpStatus.OK);
  }

  @Put('me')
  @Roles(UserRole.Teacher)
  @ApiOperation({ summary: 'Update my teacher profile (fullName, bio)' })
  @ApiBody({ type: UpdateTeacherProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateMyProfile(
    @Req() req: Request & { user: User },
    @Body() dto: UpdateTeacherProfileDto,
    @Res() res: Response,
  ) {
    const existing = await this.teacherProfileService.getProfileByUserId(
      req.user.id,
    );
    if (!existing) throw new NotFoundException('Teacher profile not found');
    const updated = await this.teacherProfileService.updateProfile(
      existing.id,
      dto,
    );
    return this.sendSuccess(res, updated, 'Profile updated', HttpStatus.OK);
  }

  @Put('me/bio')
  @Roles(UserRole.Teacher)
  @ApiOperation({ summary: 'Update my teacher bio' })
  @ApiBody({
    schema: {
      properties: {
        bio: { type: 'string', example: 'Passionate math teacher.' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Bio updated' })
  async updateMyBio(
    @Req() req: Request & { user: User },
    @Body('bio') bio: string,
    @Res() res: Response,
  ) {
    const existing = await this.teacherProfileService.getProfileByUserId(
      req.user.id,
    );
    if (!existing) throw new NotFoundException('Teacher profile not found');
    const updated = await this.teacherProfileService.updateBio(
      existing.id,
      bio,
    );
    return this.sendSuccess(res, updated, 'Bio updated', HttpStatus.OK);
  }

  // ─── Admin / shared endpoints ─────────────────────────────────────────────

  @Get()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: '[Admin] List all teacher profiles' })
  @ApiResponse({ status: 200, description: 'Array of teacher profiles' })
  async getAllProfiles(@Res() res: Response) {
    const profiles = await this.teacherProfileService.getAllProfiles();
    return this.sendSuccess(res, profiles, 'Profiles fetched', HttpStatus.OK);
  }

  @Get('user/:userId')
  @Roles(UserRole.Admin, UserRole.Student, UserRole.Parent)
  @ApiOperation({ summary: 'Get teacher profile by userId' })
  @ApiParam({ name: 'userId', description: 'User ObjectId' })
  @ApiResponse({ status: 200, description: 'Teacher profile' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getProfileByUserId(
    @Param('userId') userId: string,
    @Res() res: Response,
  ) {
    const profile = await this.teacherProfileService.getProfileByUserId(userId);
    if (!profile) throw new NotFoundException('Teacher profile not found');
    return this.sendSuccess(res, profile, 'Profile fetched', HttpStatus.OK);
  }

  @Get(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: '[Admin] Get teacher profile by profile ID' })
  @ApiParam({ name: 'id', description: 'Profile ObjectId' })
  @ApiResponse({ status: 200, description: 'Teacher profile' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getProfileById(@Param('id') id: string, @Res() res: Response) {
    const profile = await this.teacherProfileService.getProfileById(id);
    if (!profile) throw new NotFoundException('Teacher profile not found');
    return this.sendSuccess(res, profile, 'Profile fetched', HttpStatus.OK);
  }

  @Post()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: '[Admin] Manually create a teacher profile' })
  @ApiBody({ type: CreateTeacherProfileDto })
  @ApiResponse({ status: 201, description: 'Profile created' })
  async createProfile(
    @Body() data: CreateTeacherProfileDto,
    @Res() res: Response,
  ) {
    const profile = await this.teacherProfileService.createProfile(data);
    return this.sendSuccess(
      res,
      profile,
      'Profile created',
      HttpStatus.CREATED,
    );
  }

  @Put(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: '[Admin] Update a teacher profile by ID' })
  @ApiParam({ name: 'id', description: 'Profile ObjectId' })
  @ApiBody({ type: UpdateTeacherProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(
    @Param('id') id: string,
    @Body() data: UpdateTeacherProfileDto,
    @Res() res: Response,
  ) {
    const profile = await this.teacherProfileService.updateProfile(id, data);
    if (!profile) throw new NotFoundException('Teacher profile not found');
    return this.sendSuccess(res, profile, 'Profile updated', HttpStatus.OK);
  }

  @Put(':id/bio')
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiOperation({ summary: 'Update teacher bio by profile ID' })
  @ApiParam({ name: 'id', description: 'Profile ObjectId' })
  @ApiBody({
    schema: {
      properties: { bio: { type: 'string', example: 'Experienced educator.' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Bio updated' })
  async updateBio(
    @Param('id') id: string,
    @Body('bio') bio: string,
    @Res() res: Response,
  ) {
    const profile = await this.teacherProfileService.updateBio(id, bio);
    if (!profile) throw new NotFoundException('Teacher profile not found');
    return this.sendSuccess(res, profile, 'Bio updated', HttpStatus.OK);
  }

  // @Delete(':id')
  // @HttpCode(HttpStatus.OK)
  // @Roles(UserRole.Admin)
  // @ApiOperation({ summary: '[Admin] Delete a teacher profile by ID' })
  // @ApiParam({ name: 'id', description: 'Profile ObjectId' })
  // @ApiResponse({ status: 200, description: 'Profile deleted' })
  // async deleteProfile(@Param('id') id: string, @Res() res: Response) {
  //   await this.teacherProfileService.deleteProfile(id);
  //   return this.sendSuccess(res, {}, 'Profile deleted', HttpStatus.OK);
  // }
}
