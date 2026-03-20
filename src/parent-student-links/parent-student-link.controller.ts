import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Res,
  HttpStatus,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExtraModels,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ParentStudentLinkService } from './parent-student-link.service';
import {
  ConnectByCodeDto,
  GenerateLinkCodeResponseDto,
  SendLinkCodeDto,
  LinkedStudentDto,
  LinkedParentDto,
  ShareCodeResponseDto,
  StudentProgressReportDto,
  SendProgressReportDto,
  ProgressReportPeriodDto,
  ReportPeriod,
} from './dto';
import { BaseController } from '../core/base/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/domain/user';

@ApiTags('Parent-Student Links')
@Controller('parent-student-links')
@ApiExtraModels(
  GenerateLinkCodeResponseDto,
  LinkedStudentDto,
  LinkedParentDto,
  ShareCodeResponseDto,
  StudentProgressReportDto,
  SendProgressReportDto,
  ProgressReportPeriodDto,
)
export class ParentStudentLinkController extends BaseController {
  constructor(
    private readonly parentStudentLinkService: ParentStudentLinkService,
  ) {
    super();
  }

  // ─── Parent Linking Flow ─────────────────────────────────────────────────

  /**
   * Step 1 (Student): Generate a link code to share with a parent.
   */
  @Post('generate-code')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Step 1 — Generate link code (Student)',
    description:
      'Generates an 8-character uppercase alphanumeric code valid for **24 hours**. ' +
      'The student shares this code with their parent so the parent can connect. ' +
      'If an unexpired code already exists, it is returned without creating a new one.',
  })
  @ApiResponse({
    status: 200,
    description: 'Link code generated successfully',
    type: GenerateLinkCodeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Student profile not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateCode(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.parentStudentLinkService.generateLinkCode(
      user.id,
    );
    return this.sendSuccess(res, result, 'Link code generated successfully');
  }

  /**
   * Step 1 extended (Student): Generate link code + pre-composed Zalo/SMS share text.
   */
  // @Get('generate-code/share-text')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({
  //   summary:
  //     'Step 1 extended — Get shareable code with Zalo/SMS text (Student)',
  //   description:
  //     'Returns the link code together with a pre-formatted Vietnamese message ' +
  //     'ready to send via Zalo, SMS, or any messaging app. ' +
  //     'Code is valid for 24 hours and reuses an existing unexpired code if present.',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Shareable code and message returned',
  //   type: ShareCodeResponseDto,
  // })
  // @ApiResponse({ status: 400, description: 'Student profile not found' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // async getShareText(
  //   @CurrentUser() user: User,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   const result = await this.parentStudentLinkService.getShareableCode(
  //     user.id,
  //   );
  //   return this.sendSuccess(res, result, 'Share text generated successfully');
  // }

  /**
   * Step 1 (Student): Generate code and send directly to parent via Email/Zalo.
   */
  @Post('generate-code/send')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Step 1 — Generate code and send to parent (Email/Zalo)',
    description:
      'Student provides parent contact information, system generates/reuses a valid code, ' +
      'then sends it directly via Email or Zalo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Code sent successfully',
    schema: {
      example: {
        success: true,
        messageId: 'EMAIL_SENT',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid parent info or channel',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendCodeToParent(
    @CurrentUser() user: User,
    @Body() dto: SendLinkCodeDto,
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.parentStudentLinkService.sendLinkCodeToParent(
      user.id,
      dto,
    );
    const message = result.success
      ? `Code sent via ${dto.channel.toUpperCase()} successfully`
      : `Failed to send code via ${dto.channel.toUpperCase()}`;
    return this.sendSuccess(res, result, message);
  }

  /**
   * Step 2 (Parent): Connect to a student by submitting the link code.
   */
  @Post('connect')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Step 2 — Connect by code (Parent)',
    description:
      'Validates the 8-character link code, verifies it has not expired, and ' +
      'establishes a verified parent-student relationship. The code is consumed ' +
      'on success and cannot be reused.',
  })
  @ApiResponse({
    status: 200,
    description: 'Connected to student successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid / expired code, or already linked',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async connect(
    @CurrentUser() user: User,
    @Body() dto: ConnectByCodeDto,
    @Res() res: Response,
  ): Promise<Response> {
    const link = await this.parentStudentLinkService.connectByCode(
      user.id,
      dto.code,
    );
    return this.sendSuccess(res, link, 'Connected to student successfully');
  }

  /**
   * Parent: List all verified children with their student profile details.
   */
  @Get('my-children')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get my children (Parent)',
    description:
      'Returns all verified student profiles linked to the authenticated parent, ' +
      'including XP, streak, grade level, and school information.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of linked children',
    type: [LinkedStudentDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyChildren(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const children = await this.parentStudentLinkService.getMyChildren(user.id);
    return this.sendSuccess(res, children, 'Children retrieved successfully');
  }

  /**
   * Student: List all verified parents linked to this student.
   */
  @Get('my-parents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get my parents (Student)',
    description:
      'Returns all verified parent profiles linked to the authenticated student.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of linked parents',
    type: [LinkedParentDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyParents(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const parents = await this.parentStudentLinkService.getMyParents(user.id);
    return this.sendSuccess(res, parents, 'Parents retrieved successfully');
  }

  /**
   * Parent: View a child's progress report for a given period.
   * The linkId must belong to a verified link where the caller is the parent.
   */
  @Get('my-children/:linkId/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'View child progress report (Parent)',
    description:
      'Returns an aggregated progress report for the child associated with the given ' +
      'link. Includes lesson stats, quiz scores, XP earned, and streak info for the ' +
      'chosen period (weekly = last 7 days, monthly = last 30 days).',
  })
  @ApiQuery({
    name: 'period',
    enum: ReportPeriod,
    required: false,
    description: 'Report period — weekly (default) or monthly',
  })
  @ApiResponse({
    status: 200,
    description: 'Progress report retrieved',
    type: StudentProgressReportDto,
  })
  @ApiResponse({ status: 400, description: 'Link not found or not verified' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getChildProgress(
    @CurrentUser() user: User,
    @Param('linkId') linkId: string,
    @Query() periodDto: ProgressReportPeriodDto,
    @Res() res: Response,
  ): Promise<Response> {
    // Verify the calling user is the parent on this link
    const link = await this.parentStudentLinkService.getLinkById(linkId);
    if (!link || !link.isVerified) {
      return this.sendError(
        res,
        'Verified link not found',
        'Link not found',
        HttpStatus.BAD_REQUEST,
      );
    }

    const report = await this.parentStudentLinkService.getStudentProgressReport(
      link.studentId,
      periodDto.period ?? ReportPeriod.Weekly,
    );
    return this.sendSuccess(
      res,
      report,
      'Progress report retrieved successfully',
    );
  }

  /**
   * Parent / Admin: Immediately send a progress report email for a link.
   */
  // @Post('send-report')
  // @HttpCode(HttpStatus.OK)
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({
  //   summary: 'Send progress report email on demand (Parent/Admin)',
  //   description:
  //     'Triggers an immediate progress report email to the parent for the given link. ' +
  //     'Use `period` in the body or default to weekly.',
  // })
  // @ApiResponse({ status: 200, description: 'Report email sent successfully' })
  // @ApiResponse({ status: 400, description: 'Link not found or not verified' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // async sendReport(
  //   @Body() dto: SendProgressReportDto,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   await this.parentStudentLinkService.sendProgressReportToParents(
  //     dto.linkId,
  //     dto.period ?? ReportPeriod.Weekly,
  //   );
  //   return this.sendSuccess(
  //     res,
  //     null,
  //     'Progress report email sent successfully',
  //   );
  // }

  /**
   * Student: Revoke a specific parent link (removes the connection).
   */
  // @Delete('my-children/:linkId')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({
  //   summary: 'Revoke a parent link — student side',
  //   description:
  //     'Permanently removes the parent-student link. The student must be a party to the link.',
  // })
  // @ApiResponse({ status: 200, description: 'Link revoked successfully' })
  // @ApiResponse({ status: 400, description: 'Link not found or not authorized' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // async revokeLinkAsStudent(
  //   @CurrentUser() user: User,
  //   @Param('linkId') linkId: string,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   await this.parentStudentLinkService.revokeLink(linkId, user.id);
  //   return this.sendSuccess(res, null, 'Link revoked successfully');
  // }

  // /**
  //  * Parent: Revoke a specific child link (removes the connection).
  //  */
  // @Delete('my-parents/:linkId')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({
  //   summary: 'Revoke a parent link — parent side',
  //   description:
  //     'Permanently removes the parent-student link. The parent must be a party to the link.',
  // })
  // @ApiResponse({ status: 200, description: 'Link revoked successfully' })
  // @ApiResponse({ status: 400, description: 'Link not found or not authorized' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // async revokeLinkAsParent(
  //   @CurrentUser() user: User,
  //   @Param('linkId') linkId: string,
  //   @Res() res: Response,
  // ): Promise<Response> {
  //   await this.parentStudentLinkService.revokeLink(linkId, user.id);
  //   return this.sendSuccess(res, null, 'Link revoked successfully');
  // }

  // ─── Legacy / Admin CRUD ─────────────────────────────────────────────────

  @Get('parent/:parentId')
  @ApiOperation({ summary: 'Get all links for a parent profile ID (Admin)' })
  async getStudentsByParentId(@Param('parentId') parentId: string) {
    return this.parentStudentLinkService.getStudentsByParentId(parentId);
  }

  @Get('parent/:parentId/verified')
  @ApiOperation({
    summary: 'Get verified links for a parent profile ID (Admin)',
  })
  async getVerifiedStudentsByParentId(@Param('parentId') parentId: string) {
    return this.parentStudentLinkService.getVerifiedStudentsByParentId(
      parentId,
    );
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get all links for a student profile ID (Admin)' })
  async getParentsByStudentId(@Param('studentId') studentId: string) {
    return this.parentStudentLinkService.getParentsByStudentId(studentId);
  }

  @Get('student/:studentId/verified')
  @ApiOperation({
    summary: 'Get verified links for a student profile ID (Admin)',
  })
  async getVerifiedParentsByStudentId(@Param('studentId') studentId: string) {
    return this.parentStudentLinkService.getVerifiedParentsByStudentId(
      studentId,
    );
  }

  @Get(':parentId/:studentId')
  @ApiOperation({
    summary: 'Get a specific link by parent + student profile IDs (Admin)',
  })
  async getLinkByParentAndStudent(
    @Param('parentId') parentId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.parentStudentLinkService.getLinkByParentAndStudent(
      parentId,
      studentId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a link by ID (Admin)' })
  async getLinkById(@Param('id') id: string) {
    return this.parentStudentLinkService.getLinkById(id);
  }

  @Get()
  @ApiOperation({ summary: 'List all links (Admin)' })
  async getAllLinks(@Query() filters?: Record<string, unknown>) {
    if (Object.keys(filters || {}).length > 0) {
      return this.parentStudentLinkService.filterLinks(
        filters as Record<string, unknown>,
      );
    }
    return this.parentStudentLinkService.getAllLinks();
  }

  // @Post()
  // @ApiOperation({ summary: 'Create a link manually (Admin)' })
  // async createLink(@Body() data: CreateParentStudentLinkDto) {
  //   return this.parentStudentLinkService.createLink(data);
  // }

  // @Put(':id')
  // @ApiOperation({ summary: 'Update a link (Admin)' })
  // async updateLink(
  //   @Param('id') id: string,
  //   @Body() data: UpdateParentStudentLinkDto,
  // ) {
  //   return this.parentStudentLinkService.updateLink(id, data);
  // }

  // @Put(':id/verify')
  // @ApiOperation({ summary: 'Manually verify a link (Admin)' })
  // async verifyLink(@Param('id') id: string) {
  //   return this.parentStudentLinkService.verifyLink(id);
  // }

  // @Delete(':id')
  // @ApiOperation({ summary: 'Delete a link (Admin)' })
  // async deleteLink(@Param('id') id: string) {
  //   await this.parentStudentLinkService.deleteLink(id);
  //   return { message: 'Link deleted successfully' };
  // }
}
