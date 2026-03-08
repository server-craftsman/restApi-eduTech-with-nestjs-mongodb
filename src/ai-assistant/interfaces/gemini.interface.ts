// ── Gemini Request ───────────────────────────────────────────────────────────

export interface GeminiPart {
  text: string;
}

export interface GeminiContent {
  role?: 'user' | 'model';
  parts: GeminiPart[];
}

export interface GeminiGenerationConfig {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
}

export interface GeminiRequest {
  system_instruction?: { parts: GeminiPart[] };
  contents: GeminiContent[];
  generationConfig?: GeminiGenerationConfig;
}

// ── Gemini Response ──────────────────────────────────────────────────────────

export interface GeminiCandidate {
  content: GeminiContent;
  finishReason: string;
  index: number;
}

export interface GeminiUsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

export interface GeminiResponse {
  candidates: GeminiCandidate[];
  usageMetadata: GeminiUsageMetadata;
  modelVersion?: string;
}

export interface GeminiErrorResponse {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

// ── Gemini Embedding ─────────────────────────────────────────────────────────

export interface GeminiEmbeddingResponse {
  embedding: {
    values: number[];
  };
}
