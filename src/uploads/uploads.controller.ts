import {
  Controller,
  Post,
  Delete,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  HttpStatus,
  Res,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiExtraModels,
} from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { UploadResponseDto } from './dto';
import { BaseController } from '../core/base/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators';
import { UserRole } from '../enums';

@ApiTags('Uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiExtraModels(UploadResponseDto)
export class UploadsController extends BaseController {
  constructor(private readonly uploadsService: UploadsService) {
    super();
  }

  /**
   * Upload a file to Cloudinary.
   * Returns publicId and url — use these as the iconUrl object in subject creation.
   *
   * Workflow:
   *   1. POST /uploads?subfolder=subjects  → { publicId, url, ... }
   *   2. POST /subjects  body: { name: "...", iconUrl: { publicId, url } }
   */
  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiOperation({
    summary: 'Upload a file to Cloudinary',
    description:
      'Uploads a file (image, SVG, PDF, video, etc.) to Cloudinary. ' +
      'Returns **publicId** and **url** — copy both into `iconUrl` when creating a subject.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload',
        },
      },
    },
  })
  @ApiQuery({
    name: 'subfolder',
    required: false,
    type: String,
    description:
      'Optional subfolder within the Cloudinary base folder (e.g. subjects, avatars)',
    example: 'subjects',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'File uploaded successfully',
    type: UploadResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No file provided or Cloudinary upload failed',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('subfolder') subfolder: string | undefined,
    @Res() res: Response,
  ): Promise<Response> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const result = await this.uploadsService.uploadFile(file, subfolder);
    return this.sendSuccess(
      res,
      result,
      'File uploaded successfully',
      HttpStatus.CREATED,
    );
  }

  /**
   * Delete a file from Cloudinary.
   * Admin only — permanently removes the file.
   */
  @Delete()
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Delete a file from Cloudinary (Admin only)',
    description:
      'Permanently removes a file from Cloudinary using its public_id. ' +
      'Pass the publicId returned from POST /uploads as the `publicId` query param.',
  })
  @ApiQuery({
    name: 'publicId',
    required: true,
    type: String,
    description: 'Cloudinary public_id from upload response',
    example: 'edutech/subjects/xk8v3t2abcdef',
  })
  @ApiQuery({
    name: 'resourceType',
    required: false,
    enum: ['image', 'video', 'raw'],
    description: 'Cloudinary resource type (default: image)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File deleted from Cloudinary successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden — Admin only',
  })
  async deleteFile(
    @Query('publicId') publicId: string,
    @Query('resourceType') resourceType: 'image' | 'video' | 'raw' | undefined,
    @Res() res: Response,
  ): Promise<Response> {
    if (!publicId) {
      throw new BadRequestException('publicId query parameter is required');
    }
    await this.uploadsService.deleteFile(publicId, resourceType);
    return this.sendSuccess(
      res,
      { publicId, deleted: true },
      'File deleted from Cloudinary successfully',
    );
  }
}
