import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiAssistantService } from './ai-assistant.service';
import { AiAssistantController } from './ai-assistant.controller';

@Module({
  imports: [ConfigModule],
  controllers: [AiAssistantController],
  providers: [AiAssistantService],
  exports: [AiAssistantService],
})
export class AiAssistantModule {}
