import { Controller, Get, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProFeatureGuard } from '../payments/guards/pro-feature.guard';
import { HomeService } from './home.service';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Home')
@Controller()
export class HomeController {
  constructor(private service: HomeService) {}

  @Get()
  @ApiOperation({ summary: 'Trang chủ EduTech' })
  @ApiResponse({ status: 200, description: 'Trang chủ HTML' })
  home(@Res() res: Response) {
    const filePath = path.join(process.cwd(), 'public', 'index.html');
    try {
      const html = fs.readFileSync(filePath, 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } catch (error) {
      return res.json(this.service.appInfo());
    }
  }

  @Get('api-info')
  appInfo() {
    return this.service.appInfo();
  }

  @Get('pro-test')
  @UseGuards(JwtAuthGuard, ProFeatureGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Test Pro-only access (returns 402 for Free accounts)',
  })
  @ApiResponse({ status: 200, description: 'User has Pro access' })
  @ApiResponse({ status: 402, description: 'Free account must upgrade' })
  proTest() {
    return {
      success: true,
      message: 'Bạn đang dùng gói Pro, truy cập tính năng Pro thành công.',
    };
  }
}
