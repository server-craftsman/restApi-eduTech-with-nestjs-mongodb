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

@ApiTags('AI Assistant')
@Controller('ai-assistant')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiAssistantController extends BaseController {
  constructor(private readonly aiAssistantService: AiAssistantService) {
    super();
  }

  /**
   * POST /ai-assistant/ask
   * Student copies a problem → pastes into body → receives step-by-step solution from AI
   */
  @Post('ask')
  @ApiOperation({
    summary: 'Ask the AI tutor to solve a homework problem',
    description: `
## AI Tutor Flow

Student struggles with a problem → Copies the problem text → Pastes into \`question\` → AI returns a step-by-step solution.

### Supported providers (configure via \`AI_PROVIDER\` in .env):
| Provider | Cost | Rate limit | Config key |
|----------|------|------------|------------|
| **gemini** *(default)* | **Free** | 15 req/min, 1M tokens/day | \`GEMINI_API_KEY\` |
| openai | Paid | Depends on plan | \`OPENAI_API_KEY\` |

> Get a free Gemini API key at: https://aistudio.google.com/apikey

### Steps:
1. **Copy** the problem statement or question text
2. **Paste** it into the \`question\` field
3. *(Optional)* Set \`subject\` so the AI understands the context better
4. *(Optional)* Choose \`explanationLevel\`:
   - \`detailed\` *(default)*: full step-by-step explanation with examples
   - \`brief\`: short answer focusing on the key result
5. **Receive** the AI-generated solution in Markdown format
    `,
  })
  @ApiBody({ type: AskQuestionDto })
  @ApiResponse({
    status: HttpStatus.OK,
    type: AiResponseDto,
    description: 'AI-generated solution in Markdown format',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid question, too short/long, or API key not configured',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized — JWT token missing or invalid',
  })
  async askQuestion(
    @Body() dto: AskQuestionDto,
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.aiAssistantService.askQuestion(dto);
    return this.sendSuccess(
      res,
      result,
      `AI answered in ${result.processingTimeMs}ms`,
    );
  }
}
