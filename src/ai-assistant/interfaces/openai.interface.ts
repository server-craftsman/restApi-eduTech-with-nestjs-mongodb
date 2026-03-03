export interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAiChatRequest {
  model: string;
  messages: OpenAiMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface OpenAiChoice {
  index: number;
  message: OpenAiMessage;
  finish_reason: string;
}

export interface OpenAiUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenAiChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAiChoice[];
  usage: OpenAiUsage;
}

export interface OpenAiErrorResponse {
  error: {
    message: string;
    type: string;
    code: string;
  };
}
