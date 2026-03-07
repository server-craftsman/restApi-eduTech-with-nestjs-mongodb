import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiMessageRole } from '../../enums';

export class AiMessageDto {
  @ApiProperty({ enum: AiMessageRole, enumName: 'AiMessageRole' })
  role!: AiMessageRole;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  timestamp!: Date;
}

export class ChatResponseDto {
  @ApiProperty({ description: 'Conversation ID (new or existing)' })
  conversationId!: string;

  @ApiProperty({ description: 'AI reply text in Markdown' })
  reply!: string;

  @ApiPropertyOptional({ description: 'Conversation title' })
  title?: string;

  @ApiProperty({ description: 'Tokens used in this turn' })
  tokensUsed!: number;

  @ApiProperty({ description: 'AI model used' })
  model!: string;

  @ApiProperty({ description: 'Processing time in ms' })
  processingTimeMs!: number;
}
