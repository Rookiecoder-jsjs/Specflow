import type { ChatMessage, ChatOptions, ChatResponse, ChatChunk, LLMClient } from '../types.js';

export type { ChatMessage, ChatOptions, ChatResponse, ChatChunk, LLMClient };

export function createClient(adapter: LLMClient): LLMClient {
  return adapter;
}
