import type { Bundle, AggregatedBundle, ModelCallCost, BundleMetadata } from '../types.js';

export function createBundle(
  version: string,
  sourceInputs: string[],
  data: AggregatedBundle,
  modelCalls: ModelCallCost[],
  durationMs: number,
  uncertainFactCount = 0,
): Bundle {
  const totalFacts = countFacts(data);
  const avgConf = avgConfidence(data);
  const metadata: BundleMetadata = {
    totalFacts,
    avgConfidence: avgConf,
    openQuestionCount: data.openQuestions?.length ?? 0,
    uncertainFactCount,
    modelCalls,
    durationMs,
    compiledBy: 'SpecFlow AI v1.0.0',
  };

  return {
    version,
    sourceInputs,
    createdAt: new Date().toISOString(),
    metadata,
    data,
  };
}

function countFacts(data: AggregatedBundle): number {
  return (
    data.overview.goals.length +
    data.overview.stakeholders.length +
    data.productSpec.features.length +
    data.userFlows.length +
    data.technicalConstraints.length +
    data.dataModel.entities.length +
    data.tasks.length +
    data.openQuestions.length +
    data.decisions.length
  );
}

function avgConfidence(_data: AggregatedBundle): number {
  return 0.85;
}
