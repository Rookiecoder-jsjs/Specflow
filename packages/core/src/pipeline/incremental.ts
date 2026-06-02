import type { CompileOptions, CompileResult } from '../types.js';
import { detectNewInputs, markInputProcessed } from '../state/input-tracker.js';

export async function incrementalCompile(
  fullCompile: (options: CompileOptions) => Promise<CompileResult>,
  options: CompileOptions,
): Promise<CompileResult> {
  const newInputs = detectNewInputs(options.projectRoot, options.inputs);

  if (newInputs.length === 0) {
    return {
      version: 'unchanged',
      files: [],
      openQuestions: [],
      stats: {
        inputCount: 0,
        totalTranscriptLength: 0,
        segmentCount: 0,
        extractedFactCount: 0,
        compilationDurationMs: 0,
      },
      cost: { modelCalls: [], totalTokens: 0, estimatedCostCNY: 0 },
    };
  }

  const incrementalOptions: CompileOptions = {
    ...options,
    inputs: newInputs,
    incremental: true,
  };

  const result = await fullCompile(incrementalOptions);

  for (const fp of newInputs) {
    markInputProcessed(options.projectRoot, fp);
  }

  return result;
}
