import type { ExtractionResult, AggregatedBundle } from '../types.js';
import { AggregatedBundleSchema } from '../types.js';
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
    { role: 'user' as const, content: `请将以下抽取结果聚合为统一的项目上下文：\n\n${input}` },
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

      let raw: unknown;
      try {
        raw = JSON.parse(response.content);
      } catch (parseErr) {
        throw new Error(
          `Aggregator returned invalid JSON: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
        );
      }
      const validated = AggregatedBundleSchema.safeParse(raw);
      if (!validated.success) {
        throw new Error(
          `Aggregator LLM output failed schema validation: ${validated.error.issues
            .slice(0, 3)
            .map(i => `${i.path.join('.')}: ${i.message}`)
            .join('; ')}`,
        );
      }
      return validated.data;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        const backoffMs = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 250);
        await new Promise(r => setTimeout(r, backoffMs));
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
