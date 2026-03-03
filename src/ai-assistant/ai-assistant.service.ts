import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AskQuestionDto } from './dto/ask-question.dto';
import { AiResponseDto } from './dto/ai-response.dto';
import {
  OpenAiChatResponse,
  OpenAiErrorResponse,
} from './interfaces/openai.interface';

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private readonly OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

  constructor(private readonly configService: ConfigService) {}

  /**
   * Gửi câu hỏi của học sinh tới OpenAI ChatGPT và trả về lời giải.
   * Học sinh copy đề bài → paste vào dto.question → nhận lời giải từng bước.
   *
   * @param dto - AskQuestionDto chứa question, subject, explanationLevel
   * @returns AiResponseDto với solution, tokensUsed, model, processingTimeMs
   */
  async askQuestion(dto: AskQuestionDto): Promise<AiResponseDto> {
    const apiKey = this.configService.get<string>('ai.openaiApiKey');

    if (!apiKey) {
      throw new BadRequestException(
        'OpenAI API key chưa được cấu hình. ' +
          'Vui lòng thêm OPENAI_API_KEY vào file .env và khởi động lại server.',
      );
    }

    const model =
      this.configService.get<string>('ai.openaiModel') ?? 'gpt-4o-mini';
    const maxTokens =
      this.configService.get<number>('ai.openaiMaxTokens') ?? 2000;

    const isDetailed =
      !dto.explanationLevel || dto.explanationLevel === 'detailed';

    const systemPrompt = [
      'Bạn là gia sư AI thông minh hỗ trợ học sinh Việt Nam học các môn học phổ thông.',
      dto.subject ? `Môn học hiện tại: ${dto.subject}.` : '',
      isDetailed
        ? 'Hãy giải thích từng bước một cách rõ ràng, đầy đủ. Sử dụng công thức, ví dụ cụ thể và minh họa.'
        : 'Hãy trả lời ngắn gọn, súc tích, tập trung vào đáp án và công thức chính.',
      'Trình bày bằng tiếng Việt, sử dụng định dạng Markdown (in đậm tiêu đề bước, xuống dòng rõ ràng, ký hiệu toán học nếu cần).',
      'Nếu không hiểu câu hỏi hoặc nội dung không liên quan đến học tập, hãy nói rõ và yêu cầu học sinh cung cấp thêm thông tin.',
    ]
      .filter(Boolean)
      .join(' ');

    const startTime = Date.now();

    let response: globalThis.Response;
    try {
      response = await fetch(this.OPENAI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: dto.question },
          ],
          temperature: 0.3,
          max_tokens: isDetailed ? maxTokens : Math.min(maxTokens, 600),
        }),
      });
    } catch (networkError) {
      this.logger.error('Không thể kết nối tới OpenAI API', networkError);
      throw new BadRequestException(
        'Không thể kết nối tới dịch vụ AI. Vui lòng thử lại sau.',
      );
    }

    if (!response.ok) {
      const errBody = (await response.json()) as OpenAiErrorResponse;
      this.logger.error(`OpenAI API error ${response.status}:`, errBody);
      throw new BadRequestException(
        `Lỗi từ dịch vụ AI: ${errBody?.error?.message ?? 'Không xác định'}`,
      );
    }

    const data = (await response.json()) as OpenAiChatResponse;
    const solution =
      data.choices?.[0]?.message?.content?.trim() ??
      'AI không thể tạo lời giải. Vui lòng thử lại.';

    this.logger.log(
      `AI answered question: ${dto.question.substring(0, 50)}... | tokens=${data.usage?.total_tokens} | ${Date.now() - startTime}ms`,
    );

    return {
      question: dto.question,
      solution,
      subject: dto.subject,
      tokensUsed: data.usage?.total_tokens ?? 0,
      model: data.model ?? model,
      processingTimeMs: Date.now() - startTime,
    };
  }
}
