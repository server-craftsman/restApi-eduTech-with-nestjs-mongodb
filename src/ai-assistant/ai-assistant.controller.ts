import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { BaseController } from '../core/base/base.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../roles';
import { UserRole } from '../enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/domain/user';
import { AiAssistantService } from './ai-assistant.service';
import { AskQuestionDto } from './dto/ask-question.dto';
import { AiResponseDto } from './dto/ai-response.dto';
import { ChatMessageDto } from './dto/chat-message.dto';
import { ChatResponseDto, AiMessageDto } from './dto/chat-response.dto';
import { CreateTrainingDataDto } from './dto/create-training-data.dto';
import { ReviewTrainingDataDto } from './dto/review-training-data.dto';
import { QueryTrainingDataDto } from './dto/query-training-data.dto';
import { TrainingDataDto } from './dto/training-data.dto';
import { AiTrainingStatus } from '../enums';

@ApiTags('AI Assistant')
@Controller('ai-assistant')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiExtraModels(AiMessageDto, TrainingDataDto)
export class AiAssistantController extends BaseController {
  constructor(private readonly aiAssistantService: AiAssistantService) {
    super();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SINGLE-SHOT Q&A (legacy — kept for backward compatibility)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * POST /ai-assistant/ask
   * Student copies a problem → pastes into body → receives step-by-step solution from AI
   */
  @Post('ask')
  @ApiOperation({
    summary: 'Ask the AI tutor to solve a homework problem (single-shot)',
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
    status: HttpStatus.TOO_MANY_REQUESTS,
    description:
      'AI provider rate-limited (Gemini free tier: 15 req/min). Retry after a short wait.',
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

  // ══════════════════════════════════════════════════════════════════════════
  // MULTI-TURN CHAT (with conversation history + few-shot training injection)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * POST /ai-assistant/chat
   * Multi-turn conversation — creates or continues a conversation.
   */
  @Post('chat')
  @ApiOperation({
    summary: 'Send a chat message (multi-turn conversation with history)',
    description:
      'Creates a new conversation or continues an existing one. ' +
      'The AI receives the full conversation context for better answers. ' +
      'Approved training data is injected as few-shot examples.',
  })
  @ApiBody({ type: ChatMessageDto })
  @ApiResponse({ status: HttpStatus.OK, type: ChatResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async chat(
    @Body() dto: ChatMessageDto,
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.aiAssistantService.chat(dto, user.id);
    return this.sendSuccess(
      res,
      result,
      `AI replied in ${result.processingTimeMs}ms`,
    );
  }

  /**
   * GET /ai-assistant/conversations
   * List the authenticated user's conversations (paginated).
   */
  @Get('conversations')
  @ApiOperation({ summary: 'List my conversations (paginated, newest first)' })
  @ApiResponse({ status: HttpStatus.OK })
  async getConversations(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Res() res?: Response,
  ): Promise<Response> {
    const data = await this.aiAssistantService.getConversations(
      user.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
    return this.sendSuccess(res!, data, 'Conversations retrieved');
  }

  /**
   * GET /ai-assistant/conversations/:id
   * Get a single conversation with full message history.
   */
  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a conversation with full message history' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  async getConversation(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const conv = await this.aiAssistantService.getConversation(id, user.id);
    return this.sendSuccess(res, conv, 'Conversation retrieved');
  }

  /**
   * DELETE /ai-assistant/conversations/:id
   * Soft-delete a conversation (owner only).
   */
  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Delete a conversation (soft-delete)' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  async deleteConversation(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    await this.aiAssistantService.deleteConversation(id, user.id);
    return this.sendSuccess(res, null, 'Conversation deleted');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TRAINING DATA MANAGEMENT (Admin / Teacher)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * POST /ai-assistant/training
   * Create a Q&A training entry. Starts as Pending — Admin must approve.
   */
  @Post('training')
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiOperation({
    summary: 'Create a training data entry (Teacher / Admin)',
    description:
      'Creates a Q&A pair for fine-tuning the AI model. ' +
      'New entries start with status=Pending. Admin must approve before export.',
  })
  @ApiBody({ type: CreateTrainingDataDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: TrainingDataDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden — requires Teacher or Admin role',
  })
  async createTrainingData(
    @Body() dto: CreateTrainingDataDto,
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.aiAssistantService.createTrainingData(
      dto,
      user.id,
    );
    return this.sendSuccess(
      res,
      result,
      'Training data created',
      HttpStatus.CREATED,
    );
  }

  /**
   * GET /ai-assistant/training
   * List training data with optional status/subject filters.
   */
  @Get('training')
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiOperation({
    summary: 'List training data (filterable by status, subject)',
  })
  @ApiResponse({ status: HttpStatus.OK })
  async getTrainingDataList(
    @Query() query: QueryTrainingDataDto,
    @Res() res: Response,
  ): Promise<Response> {
    const data = await this.aiAssistantService.getTrainingDataList(query);
    return this.sendSuccess(res, data, 'Training data retrieved');
  }

  /**
   * GET /ai-assistant/training/stats
   * Aggregate statistics for training data.
   */
  @Get('training/stats')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Get training data statistics (Admin only)' })
  @ApiResponse({ status: HttpStatus.OK })
  async getTrainingDataStats(@Res() res: Response): Promise<Response> {
    const stats = await this.aiAssistantService.getTrainingDataStats();
    return this.sendSuccess(res, stats, 'Training data statistics retrieved');
  }

  /**
   * GET /ai-assistant/training/export
   * Export all approved training data as JSONL for OpenAI fine-tuning.
   */
  @Get('training/export')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Export approved training data as JSONL for OpenAI fine-tuning',
    description: `
## Self-Training / Fine-Tuning Workflow

### Step 1 — Create Training Data
\`POST /ai-assistant/training\` — Teachers/Admins create Q&A pairs.

### Step 2 — Review & Approve
\`PATCH /ai-assistant/training/:id/review\` — Admin approves entries.

### Step 3 — Export JSONL
\`GET /ai-assistant/training/export\` — Downloads JSONL file.

### Step 4 — Upload to OpenAI
\`\`\`bash
openai api files.create -f training-data.jsonl -p fine-tune
\`\`\`

### Step 5 — Create Fine-Tune Job
\`\`\`bash
openai api fine_tuning.jobs.create -t file-abc123 -m gpt-4o-mini-2024-07-18
\`\`\`

### Step 6 — Use Fine-Tuned Model
Update \`.env\`: \`OPENAI_MODEL=ft:gpt-4o-mini:org:custom:id\`

The AI chatbot will now use your custom-trained model!
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'JSONL text content for fine-tuning',
  })
  async exportTrainingData(@Res() res: Response): Promise<Response> {
    const jsonl = await this.aiAssistantService.exportTrainingDataJsonl();
    res.setHeader('Content-Type', 'application/jsonl');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="training-data.jsonl"',
    );
    return res.send(jsonl);
  }

  /**
   * PATCH /ai-assistant/training/:id/review
   * Approve or reject a training data entry (Admin only).
   */
  @Patch('training/:id/review')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Approve or reject a training data entry (Admin only)',
    description:
      'Review a training entry. Only approved entries are used for fine-tuning and few-shot injection.',
  })
  @ApiBody({ type: ReviewTrainingDataDto })
  @ApiResponse({ status: HttpStatus.OK, type: TrainingDataDto })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Training data not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden — requires Admin role',
  })
  async reviewTrainingData(
    @Param('id') id: string,
    @Body() dto: ReviewTrainingDataDto,
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.aiAssistantService.reviewTrainingData(
      id,
      dto,
      user.id,
    );
    return this.sendSuccess(
      res,
      result,
      `Training data ${dto.status === AiTrainingStatus.Approved ? 'approved' : 'rejected'}`,
    );
  }

  /**
   * DELETE /ai-assistant/training/:id
   * Soft-delete a training data entry (Admin only).
   */
  @Delete('training/:id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Delete training data (soft-delete, Admin only)' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden — requires Admin role',
  })
  async deleteTrainingData(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    await this.aiAssistantService.deleteTrainingData(id);
    return this.sendSuccess(res, null, 'Training data deleted');
  }
}
