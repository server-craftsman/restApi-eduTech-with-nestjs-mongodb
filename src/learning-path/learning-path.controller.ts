import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  LearningPathService,
  LessonUnlockResult,
} from './learning-path.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/domain/user';

@ApiTags('Learning Path')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('Learning Path')
export class LearningPathController {
  constructor(private readonly learningPathService: LearningPathService) {}

  // @Get()
  // @ApiOperation({
  //   summary: 'Get personalized learning path based on user grade level',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Learning path retrieved successfully',
  // })
  // async getLearningPath(
  //   @CurrentUser() user: User,
  // ): Promise<LearningPathNode[]> {
  //   // Lấy grade level từ student profile
  //   const gradeLevel = user.studentProfile?.gradeLevel;
  //   if (!gradeLevel) {
  //     throw new Error('User does not have a grade level set');
  //   }

  //   return this.learningPathService.getLearningPath(user.id, gradeLevel);
  // }

  @Post('unlock-lesson/:lessonId')
  @ApiOperation({
    summary: 'Check if lesson can be unlocked based on prerequisites',
  })
  @ApiResponse({
    status: 200,
    description: 'Unlock status checked successfully',
  })
  async checkLessonUnlock(
    @CurrentUser() user: User,
    @Param('lessonId') lessonId: string,
  ): Promise<LessonUnlockResult> {
    return this.learningPathService.checkLessonUnlock(user.id, lessonId);
  }
}
