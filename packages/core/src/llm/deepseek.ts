import type { ChatMessage, ChatOptions, ChatResponse, ChatChunk, LLMClient } from '../types.js';
import { getDeepSeekApiKey, getDeepSeekBaseUrl } from '../config.js';

interface DeepSeekConfig {
  apiKey: string;
  model: 'deepseek-v4-pro' | 'deepseek-v4-flash';
  baseUrl?: string;
  thinking?: boolean;
}

export class DeepSeekClient implements LLMClient {
  readonly modelId: string;
  readonly maxTokens: number;
  private apiKey: string;
  private baseUrl: string;
  private thinking: boolean;

  constructor(config: DeepSeekConfig) {
    this.apiKey = config.apiKey;
    this.modelId = config.model;
    this.baseUrl = config.baseUrl ?? 'https://api.deepseek.com/v1';
    this.thinking = config.thinking ?? false;
    this.maxTokens = 8192;
  }

  static fromEnv(model?: 'deepseek-v4-pro' | 'deepseek-v4-flash'): DeepSeekClient {
    return new DeepSeekClient({
      apiKey: getDeepSeekApiKey(),
      model: model ?? 'deepseek-v4-pro',
      baseUrl: getDeepSeekBaseUrl(),
    });
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const body = this.buildRequestBody(messages, options);
    const response = await this.makeRequest('/chat/completions', body);
    const data = await response.json() as Record<string, unknown>;

    if (!response.ok) {
      throw new Error(`DeepSeek API error (${response.status}): ${JSON.stringify(data)}`);
    }

    const choice = (data['choices'] as Array<Record<string, unknown>>)?.[0];
    const usage = data['usage'] as Record<string, number> | undefined;
    const msg = choice?.['message'] as Record<string, string> | undefined;

    return {
      content: msg?.['content'] ?? '',
      usage: {
        promptTokens: usage?.['prompt_tokens'] ?? 0,
        completionTokens: usage?.['completion_tokens'] ?? 0,
        totalTokens: usage?.['total_tokens'] ?? 0,
      },
      model: data['model'] as string ?? this.modelId,
    };
  }

  async *chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<ChatChunk> {
    const body = { ...this.buildRequestBody(messages, options), stream: true };
    const response = await this.makeRequest('/chat/completions', body);

    if (!response.ok) {
      const data = await response.json();
      throw new Error(`DeepSeek API error: ${JSON.stringify(data)}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const json = trimmed.slice(6);
        if (json === '[DONE]') return;
        try {
          const parsed = JSON.parse(json) as Record<string, unknown>;
          const choice = (parsed['choices'] as Array<Record<string, unknown>>)?.[0];
          const delta = (choice?.['delta'] as Record<string, string>)?.['content'];
          if (delta) {
            yield {
              delta,
              finishReason: (choice?.['finish_reason'] as ChatChunk['finishReason']) ?? undefined,
            };
          }
        } catch { /* skip unparseable SSE */ }
      }
    }
  }

  async countTokens(messages: ChatMessage[]): Promise<number> {
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    return Math.ceil(totalChars / 4);
  }

  private buildRequestBody(messages: ChatMessage[], options?: ChatOptions): Record<string, unknown> {
    return {
      model: this.modelId,
      messages,
      temperature: options?.temperature ?? 0.1,
      max_tokens: options?.maxTokens ?? this.maxTokens,
      ...(options?.responseFormat === 'json_object' ? { response_format: { type: 'json_object' } } : {}),
      thinking: this.thinking ? { type: 'enabled' } : { type: 'disabled' },
    };
  }

  private async makeRequest(
    path: string, body: Record<string, unknown>, retries = 2,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
        }
      }
    }
    clearTimeout(timeoutId);
    throw lastError ?? new Error('DeepSeek API request failed');
  }
}
