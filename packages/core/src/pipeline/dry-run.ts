import { statSync, readFileSync } from 'fs';
import type { CompileOptions } from '../types.js';
import { estimateDeepSeekCost, estimateASRCost } from '../utils/cost.js';

export interface DryRunResult {
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostCNY: number;
  breakdown: { stage: string; promptTokens: number; completionTokens: number; cost: number }[];
  warnings: string[];
}

export async function dryRun(options: CompileOptions): Promise<DryRunResult> {
  const warnings: string[] = [];
  let totalChars = 0;

  for (const fp of options.inputs) {
    try {
      const stats = statSync(fp);
      if (fp.match(/\.(m4a|mp3|wav|aac|flac|ogg|webm)$/i)) {
        totalChars += estimateAudioTranscriptChars(stats.size);
      } else {
        totalChars += estimateTextChars(fp);
      }
    } catch {
      warnings.push(`Cannot access file: ${fp}`);
    }
  }

  const totalTokens = Math.ceil(totalChars / 4);
  const segmentsEstimate = Math.ceil(totalTokens / 4000);

  const extractionPrompt = segmentsEstimate * 4000;
  const extractionCompletion = segmentsEstimate * 1000;
  const extractionCost = estimateDeepSeekCost('deepseek-v4-pro', extractionPrompt, extractionCompletion);

  const gapPrompt = extractionCompletion;
  const gapCompletion = 500;
  const gapCost = estimateDeepSeekCost('deepseek-v4-pro', gapPrompt, gapCompletion);

  const aggPrompt = extractionCompletion;
  const aggCompletion = 2000;
  const aggCost = estimateDeepSeekCost('deepseek-v4-flash', aggPrompt, aggCompletion);

  let asrCost = 0;
  const hasAudio = options.inputs.some(f => f.match(/\.(m4a|mp3|wav|aac|flac|ogg|webm)$/i));
  if (hasAudio) {
    asrCost = estimateASRCost(3600);
    warnings.push('Audio ASR cost is estimated for 60 min; actual cost depends on file duration');
  }

  try {
    const { execSync } = require('child_process') as typeof import('child_process');
    execSync('ffmpeg -version', { stdio: 'ignore' });
  } catch {
    warnings.push('ffmpeg not found — audio inputs will be skipped');
  }

  try {
    const { loadApiKeys } = await import('../config.js');
    loadApiKeys(options.projectRoot);
  } catch (err) {
    warnings.push(`API keys not configured: ${err instanceof Error ? err.message : String(err)}`);
  }

  return {
    estimatedInputTokens: totalTokens,
    estimatedOutputTokens: extractionCompletion + gapCompletion + aggCompletion,
    estimatedCostCNY: Math.round((extractionCost + gapCost + aggCost + asrCost) * 100) / 100,
    breakdown: [
      { stage: 'ASR', promptTokens: 0, completionTokens: 0, cost: asrCost },
      { stage: 'Extraction', promptTokens: extractionPrompt, completionTokens: extractionCompletion, cost: extractionCost },
      { stage: 'Gap Detection', promptTokens: gapPrompt, completionTokens: gapCompletion, cost: gapCost },
      { stage: 'Aggregation', promptTokens: aggPrompt, completionTokens: aggCompletion, cost: aggCost },
    ],
    warnings,
  };
}

function estimateAudioTranscriptChars(_fileSize: number): number {
  return 15000;
}

function estimateTextChars(fp: string): number {
  try {
    return readFileSync(fp, 'utf-8').length;
  } catch {
    return 5000;
  }
}
