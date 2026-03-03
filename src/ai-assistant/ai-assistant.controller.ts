import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { BaseController } from '../core/base/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiAssistantService } from './ai-assistant.service';
import { AskQuestionDto } from './dto/ask-question.dto';
import { AiResponseDto } from './dto/ai-response.dto';

@ApiTags('🤖 AI Assistant')
@Controller('ai-assistant')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiAssistantController extends BaseController {
  constructor(private readonly aiAssistantService: AiAssistantService) {
    super();
  }

  /**
   * POST /ai-assistant/ask
   * Học sinh copy đề bài → paste vào body → nhận lời giải từ AI
   */
  @Post('ask')
  @ApiOperation({
    summary: '🤖 Hỏi AI gia sư về bài tập',
    description: `
## Luồng sử dụng AI Gia Sư

Học sinh gặp khó khăn với bài tập → Copy đề bài → Paste vào field \`question\` → AI trả về lời giải từng bước.

### Các bước:
1. **Copy** nội dung đề bài hoặc câu hỏi
2. **Paste** vào trường \`question\`
3. *(Tuỳ chọn)* Thêm tên môn học vào \`subject\` để AI hiểu ngữ cảnh tốt hơn
4. *(Tuỳ chọn)* Chọn \`explanationLevel\`:
   - \`detailed\` (mặc định): Giải từng bước, đầy đủ, có ví dụ
   - \`brief\`: Câu trả lời ngắn gọn, chỉ nêu đáp án chính
5. **Nhận lời giải** định dạng Markdown từ AI

### Lưu ý:
- Mỗi yêu cầu sẽ tiêu thụ **token** từ tài khoản OpenAI
- Câu hỏi từ **10 đến 5000 ký tự**
- AI trả lời bằng **tiếng Việt**
    `,
  })
  @ApiBody({ type: AskQuestionDto })
  @ApiResponse({
    status: HttpStatus.OK,
    type: AiResponseDto,
    description: 'Lời giải từ AI gia sư (Markdown)',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Câu hỏi không hợp lệ, quá ngắn/dài, hoặc API key chưa cấu hình',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa đăng nhập',
  })
  async askQuestion(
    @Body() dto: AskQuestionDto,
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.aiAssistantService.askQuestion(dto);
    return this.sendSuccess(
      res,
      result,
      `AI đã trả lời câu hỏi trong ${result.processingTimeMs}ms`,
    );
  }
}
