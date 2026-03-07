import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ChatMessageDto {
  @ApiProperty({
    description:
      'Send a message to the AI chatbot within a conversation. ' +
      'If conversationId is provided, the message is appended to that conversation. ' +
      'If omitted, a new conversation is created.',
    example: 'How do I solve quadratic equations?',
    minLength: 1,
    maxLength: 5000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  message!: string;

  @ApiPropertyOptional({
    description: 'Existing conversation ID to continue a multi-turn chat',
    example: '6650a1b2c3d4e5f6a7b8c9d0',
  })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiPropertyOptional({
    description: 'Subject context for the AI',
    example: 'Mathematics',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  subject?: string;

  @ApiPropertyOptional({
    description: 'Explanation level: brief or detailed',
    enum: ['brief', 'detailed'],
    default: 'detailed',
  })
  @IsOptional()
  @IsEnum(['brief', 'detailed'])
  explanationLevel?: 'brief' | 'detailed';
}
