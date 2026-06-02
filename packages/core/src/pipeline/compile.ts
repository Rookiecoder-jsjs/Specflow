import type { CompileOptions, CompileResult, ModelCallCost, CompileStats, CostBreakdown } from '../types.js';
import { routeInput } from '../input/router.js';
import { extractBatch } from '../agent/extractor.js';
import { detectGaps } from '../agent/gap-detector.js';
import { aggregate } from '../agent/aggregator.js';
import { compilePCB } from '../output/pcb-compiler.js';
import { createBundle } from '../state/bundle.js';
import { writeBundle, ensureSpecFlowDir, writeProjectMeta, readProjectMeta } from '../state/store.js';
import { markInputProcessed } from '../state/input-tracker.js';
import { loadApiKeys } from '../config.js';
import { formatDuration, formatCost } from '../utils/format.js';
import { dryRun } from './dry-run.js';
import { incrementalCompile } from './incremental.js';

export async function compile(options: CompileOptions): Promise<CompileResult> {
  const startTime = Date.now();

  // Pre-flight — validates specflow.config.json exists with valid API keys
  loadApiKeys(options.projectRoot);

  if (options.dryRun) {
    const estimate = await dryRun(options);
    return {
      version: 'dry-run',
      files: [],
      openQuestions: [],
      stats: {
        inputCount: options.inputs.length,
        totalTranscriptLength: estimate.estimatedInputTokens * 4,
        segmentCount: Math.ceil(estimate.estimatedInputTokens / 4000),
        extractedFactCount: 0,
        compilationDurationMs: Date.now() - startTime,
      },
      cost: {
        modelCalls: [],
        totalTokens: estimate.estimatedInputTokens + estimate.estimatedOutputTokens,
        estimatedCostCNY: estimate.estimatedCostCNY,
      },
    };
  }

  if (options.incremental) {
    return incrementalCompile(compile, options);
  }

  // Phase 1: Input Pipeline
  const parsedInputs = await routeInput(options.inputs);

  // Phase 2: Context Agent
  const extractions = await extractBatch(parsedInputs);
  const aggregatedBundle = await aggregate(extractions);
  const gapResult = await detectGaps(aggregatedBundle);
  aggregatedBundle.openQuestions.push(...gapResult.questions);

  // Phase 3: Output Engine
  const modelCalls: ModelCallCost[] = [];
  const stats: CompileStats = {
    inputCount: options.inputs.length,
    totalTranscriptLength: parsedInputs.reduce((s, p) => s + p.transcript.length, 0),
    segmentCount: parsedInputs.length,
    extractedFactCount: extractions.reduce((s, e) => s + e.facts.length, 0),
    compilationDurationMs: Date.now() - startTime,
  };

  const costBreakdown: CostBreakdown = {
    modelCalls,
    totalTokens: 0,
    estimatedCostCNY: 0,
  };

  const result = await compilePCB(aggregatedBundle, options, stats, costBreakdown);

  // Phase 4: Persist state
  const projectRoot = options.projectRoot;
  ensureSpecFlowDir(projectRoot);

  const bundle = createBundle(
    result.version,
    options.inputs,
    aggregatedBundle,
    modelCalls,
    stats.compilationDurationMs,
  );
  writeBundle(projectRoot, result.version, bundle);

  for (const fp of options.inputs) {
    markInputProcessed(projectRoot, fp);
  }

  const existingMeta = readProjectMeta(projectRoot);
  writeProjectMeta(projectRoot, {
    id: existingMeta?.id ?? crypto.randomUUID(),
    name: existingMeta?.name ?? 'untitled',
    stage: existingMeta?.stage ?? 'development',
    activePlugins: existingMeta?.activePlugins ?? ['claude-code'],
    createdAt: existingMeta?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currentVersion: result.version,
  });

  return result;
}

