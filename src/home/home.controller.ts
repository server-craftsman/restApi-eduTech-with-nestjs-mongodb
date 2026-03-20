import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProFeatureGuard } from '../payments/guards/pro-feature.guard';
import { HomeService } from './home.service';

@ApiTags('Home')
@Controller()
export class HomeController {
  constructor(private service: HomeService) {}

  @Get()
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
