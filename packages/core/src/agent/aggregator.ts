import type { ExtractionResult, AggregatedBundle } from '../types.js';
import { DeepSeekClient } from '../llm/deepseek.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPT = readFileSync(join(__dirname, 'prompts', 'aggregate.txt'), 'utf-8');

export async function aggregate(extractions: ExtractionResult[]): Promise<AggregatedBundle> {
  const client = DeepSeekClient.fromEnv('deepseek-v4-flash');
  const facts = extractions.flatMap(e => e.facts);

  if (facts.length === 0) {
    return emptyBundle();
  }

  const input = JSON.stringify(facts, null, 2);
  const messages = [
    { role: 'system' as const, content: PROMPT },
    { role: 'user' as const, content: `将以下抽取结果聚合为统一的项目上下文：\n\n${input}` },
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
      return parsed as unknown as AggregatedBundle;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError ?? new Error('Aggregation failed after retries');
}

function emptyBundle(): AggregatedBundle {
  return {
    overview: { name: '', description: '', stage: 'discovery', goals: [], stakeholders: [] },
    productSpec: { targetUsers: [], valueProposition: '', features: [], scope: { included: [], excluded: [] } },
    userFlows: [],
    technicalConstraints: [],
    dataModel: { entities: [] },
    tasks: [],
    agentInstructions: [],
    openQuestions: [],
    decisions: [],
    techStack: [],
    architecture: null,
  };
}
