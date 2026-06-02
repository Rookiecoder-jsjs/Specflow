import type { TokenUsage } from '../types.js';

const DEEPSEEK_V4_PRO = { inputCached: 0.025, inputUncached: 3.00, output: 6.00 };
const DEEPSEEK_V4_FLASH = { inputCached: 0.02, inputUncached: 1.00, output: 2.00 };
const ASR_PER_SECOND = 0.00022;

export function estimateDeepSeekCost(
  model: 'deepseek-v4-pro' | 'deepseek-v4-flash',
  promptTokens: number,
  completionTokens: number,
  cacheHitRate = 0.3,
): number {
  const rates = model === 'deepseek-v4-pro' ? DEEPSEEK_V4_PRO : DEEPSEEK_V4_FLASH;
  const cachedInputCost = (promptTokens * cacheHitRate * rates.inputCached) / 1_000_000;
  const uncachedInputCost = (promptTokens * (1 - cacheHitRate) * rates.inputUncached) / 1_000_000;
  const outputCost = (completionTokens * rates.output) / 1_000_000;
  return cachedInputCost + uncachedInputCost + outputCost;
}

export function estimateASRCost(durationSeconds: number): number {
  return durationSeconds * ASR_PER_SECOND;
}

export function estimateTotalCost(
  modelCalls: { model: string; promptTokens: number; completionTokens: number }[],
  asrDurationSeconds = 0,
): number {
  let total = 0;
  for (const call of modelCalls) {
    if (call.model === 'deepseek-v4-pro' || call.model === 'deepseek-v4-flash') {
      total += estimateDeepSeekCost(call.model, call.promptTokens, call.completionTokens);
    }
  }
  total += estimateASRCost(asrDurationSeconds);
  return Math.round(total * 100) / 100;
}
