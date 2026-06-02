import type { GapDetectionResult, AggregatedBundle } from '../types.js';
import { GapDetectionResultSchema } from '../types.js';
import { DeepSeekClient } from '../llm/deepseek.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPT = readFileSync(join(__dirname, 'prompts', 'gap-detect.txt'), 'utf-8');

export async function detectGaps(bundle: AggregatedBundle): Promise<GapDetectionResult> {
  const client = DeepSeekClient.fromEnv('deepseek-v4-pro');
  const context = JSON.stringify(bundle, null, 2);

  const messages = [
    { role: 'system' as const, content: PROMPT },
    { role: 'user' as const, content: `分析以下项目上下文的完整性：\n\n${context}` },
  ];

  let retries = 2;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await client.chat(messages, {
        temperature: 0.3,
        maxTokens: 4096,
        responseFormat: 'json_object',
      });

      const parsed = JSON.parse(response.content) as Record<string, unknown>;
      return GapDetectionResultSchema.parse(parsed);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError ?? new Error('Gap detection failed after retries');
}
