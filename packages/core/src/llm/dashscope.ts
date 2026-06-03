import type { ChatMessage, ChatResponse, TranscriptionResult, TranscriptionSegment } from '../types.js';
import { getDashScopeApiKey } from '../config.js';

export class DashScopeClient {
  private apiKey: string;

  constructor(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
  }

  static fromEnv(): DashScopeClient {
    return new DashScopeClient({ apiKey: getDashScopeApiKey() });
  }

  async transcribe(audioUrl: string): Promise<TranscriptionResult> {
    const body = {
      model: 'qwen3-asr-flash',
      input: {
        messages: [{ role: 'user', content: [{ audio: audioUrl }] }],
      },
      parameters: { enable_lid: true, enable_itn: false },
    };

    const response = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`DashScope ASR error: ${JSON.stringify(errData)}`);
    }

    const data = await response.json() as Record<string, unknown>;
    const output = data['output'] as Record<string, unknown> | undefined;
    const text = (output?.['text'] as string) ?? '';

    return { text, segments: this.parseSegments(output), duration: 0 };
  }

  async embedding(texts: string[]): Promise<number[][]> {
    const body = { model: 'text-embedding-v3', input: { texts } };

    const response = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`DashScope Embedding error: ${JSON.stringify(errData)}`);
    }

    const data = (await response.json()) as { output?: { embeddings?: Array<{ embedding: number[] }> } };
    const embeddings = data.output?.embeddings ?? [];
    return embeddings.map(e => e.embedding);
  }

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    const body = { model: 'qwen-plus', input: { messages } };

    const response = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`DashScope Chat error: ${JSON.stringify(errData)}`);
    }

    const data = await response.json() as Record<string, unknown>;
    const output = data['output'] as Record<string, unknown> | undefined;
    return {
      content: (output?.['text'] as string) ?? '',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      model: 'qwen-plus',
    };
  }

  private parseSegments(output: Record<string, unknown> | undefined): TranscriptionSegment[] {
    const raw = output?.['segments'] as Array<Record<string, unknown>> | undefined;
    if (!raw) return [];
    return raw.map(s => ({
      start: (s['begin_time'] as number) ?? 0,
      end: (s['end_time'] as number) ?? 0,
      text: (s['text'] as string) ?? '',
      speaker: s['speaker'] as string | undefined,
    }));
  }
}
