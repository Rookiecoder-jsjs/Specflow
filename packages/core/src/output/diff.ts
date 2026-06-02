import type { Bundle, DiffResult, DiffItem } from '../types.js';

export function semanticDiff(oldBundle: Bundle, newBundle: Bundle): DiffResult {
  const added: DiffItem[] = [];
  const modified: DiffItem[] = [];
  const removed: DiffItem[] = [];
  let unchanged = 0;

  const oldFiles = flattenBundle(oldBundle);
  const newFiles = flattenBundle(newBundle);

  for (const [key, newVal] of Object.entries(newFiles)) {
    const oldVal = oldFiles[key];
    if (oldVal === undefined) {
      added.push({ file: key.split('.')[0]!, section: key, changeType: 'added', newValue: newVal, confidence: 1.0 });
    } else {
      const sim = textSimilarity(oldVal, newVal);
      if (sim > 0.95) {
        unchanged++;
      } else if (sim > 0.5) {
        modified.push({ file: key.split('.')[0]!, section: key, changeType: 'modified', oldValue: oldVal, newValue: newVal, confidence: sim });
      } else {
        modified.push({ file: key.split('.')[0]!, section: key, changeType: 'modified', oldValue: oldVal, newValue: newVal, confidence: sim });
      }
    }
  }

  for (const [key, oldVal] of Object.entries(oldFiles)) {
    if (newFiles[key] === undefined) {
      removed.push({ file: key.split('.')[0]!, section: key, changeType: 'removed', oldValue: oldVal, confidence: 1.0 });
    }
  }

  const total = added.length + modified.length + removed.length + unchanged;
  const summary = `${added.length} added, ${modified.length} modified, ${removed.length} removed, ${unchanged} unchanged`;
  return {
    version: { from: oldBundle.version, to: newBundle.version },
    added, modified, removed, unchanged,
    summary,
  };
}

function flattenBundle(bundle: Bundle): Record<string, string> {
  const result: Record<string, string> = {};
  const data = bundle.data;
  result['overview'] = JSON.stringify(data.overview ?? {});
  result['productSpec'] = JSON.stringify(data.productSpec ?? {});
  result['userFlows'] = JSON.stringify(data.userFlows ?? []);
  result['technicalConstraints'] = JSON.stringify(data.technicalConstraints ?? []);
  result['dataModel'] = JSON.stringify(data.dataModel ?? {});
  result['tasks'] = JSON.stringify(data.tasks ?? []);
  result['agentInstructions'] = JSON.stringify(data.agentInstructions ?? []);
  result['openQuestions'] = JSON.stringify(data.openQuestions ?? []);
  result['decisions'] = JSON.stringify(data.decisions ?? []);
  return result;
}

function textSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const aWords = new Set(a.split(/\s+/));
  const bWords = new Set(b.split(/\s+/));
  const intersection = new Set([...aWords].filter(w => bWords.has(w)));
  const union = new Set([...aWords, ...bWords]);
  return union.size === 0 ? 1 : intersection.size / union.size;
}
