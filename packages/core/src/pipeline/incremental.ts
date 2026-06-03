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

  // CRITICAL: Strip `incremental` flag before calling fullCompile to break recursion.
  // The compile() entry point checks `options.incremental` and re-dispatches back here.
  const { incremental: _drop, ...rest } = options;
  const resolvedOptions: CompileOptions = {
    ...rest,
    inputs: newInputs,
  };

  const result = await fullCompile(resolvedOptions);

  for (const fp of newInputs) {
    markInputProcessed(options.projectRoot, fp);
  }

  return result;
}
