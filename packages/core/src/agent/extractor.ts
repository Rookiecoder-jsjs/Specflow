import type { ExtractionResult, ParsedInput } from '../types.js';
import { ExtractionResultSchema } from '../types.js';
import { DeepSeekClient } from '../llm/deepseek.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPT = readFileSync(join(__dirname, 'prompts', 'extract.txt'), 'utf-8');

export async function extract(input: ParsedInput, segmentIndex: number): Promise<ExtractionResult> {
  const client = DeepSeekClient.fromEnv('deepseek-v4-pro');
  const messages = [
    { role: 'system' as const, content: PROMPT },
    { role: 'user' as const, content: input.transcript },
  ];

  let retries = 2;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await client.chat(messages, {
        temperature: 0.1,
        maxTokens: 8192,
        responseFormat: 'json_object',
      });

      const parsed = JSON.parse(response.content) as Record<string, unknown>;
      const result = ExtractionResultSchema.parse({
        segmentIndex,
        facts: (parsed['facts'] as unknown[]) ?? [],
        confidence: calculateAvgConfidence((parsed['facts'] as Array<{ confidence?: number }>) ?? []),
        sourceRefs: extractSourceRefs(input, segmentIndex, parsed),
      });

      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError ?? new Error('Extraction failed after retries');
}

export async function extractBatch(inputs: ParsedInput[]): Promise<ExtractionResult[]> {
  const results: ExtractionResult[] = [];
  for (let i = 0; i < inputs.length; i++) {
    const result = await extract(inputs[i]!, i);
    results.push(result);
  }
  return results;
}

function calculateAvgConfidence(facts: Array<{ confidence?: number }>): number {
  if (facts.length === 0) return 0;
  const sum = facts.reduce((s, f) => s + (f.confidence ?? 0.5), 0);
  return sum / facts.length;
}

function extractSourceRefs(
  input: ParsedInput,
  segmentIndex: number,
  _parsed: Record<string, unknown>,
) {
  return [{
    sourcePath: input.source.path,
    segmentIndex,
    excerpt: input.transcript.slice(0, 200),
  }];
}
