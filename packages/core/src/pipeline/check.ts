import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { fileSha256 } from '../utils/hash.js';

export interface DriftReport {
  stale: boolean;
  lastCompiledAt: string | null;
  changedInputs: string[];
  missingInputs: string[];
  pcbFiles: { name: string; ageDays: number | null }[];
  summary: string;
}

export function checkDrift(projectRoot: string): DriftReport {
  const inputsDir = join(projectRoot, '.specflow', 'inputs');
  const pcbDir = join(projectRoot, 'docs', 'spec-flow');
  const projectJson = join(projectRoot, '.specflow', 'project.json');

  let lastCompiledAt: string | null = null;
  if (existsSync(projectJson)) {
    try {
      const meta = JSON.parse(readFileSync(projectJson, 'utf-8'));
      lastCompiledAt = meta.updatedAt ?? null;
    } catch { /* ignore */ }
  }

  const changedInputs: string[] = [];
  const missingInputs: string[] = [];

  if (existsSync(inputsDir)) {
    const records = readdirSync(inputsDir).filter(f => f.endsWith('.json'));
    for (const record of records) {
      try {
        const data = JSON.parse(readFileSync(join(inputsDir, record), 'utf-8'));
        const filePath = data.path as string;
        const storedHash = data.hash as string;

        if (!existsSync(filePath)) {
          missingInputs.push(filePath);
        } else {
          const currentHash = fileSha256(filePath);
          if (currentHash !== storedHash) {
            changedInputs.push(filePath);
          }
        }
      } catch { /* skip corrupt records */ }
    }
  }

  const pcbFiles: { name: string; ageDays: number | null }[] = [
    '00_overview.md', '01_product_spec.md', '02_user_flows.md',
    '03_technical_constraints.md', '04_data_model.md',
    '05_task_breakdown.md', '06_agent_instructions.md',
    '07_open_questions.md', '08_decision_log.md',
    '09_codebase_analysis.md', '10_tech_stack.md', '11_architecture.md',
  ].map(name => {
    const path = join(pcbDir, name);
    if (!existsSync(path)) return { name, ageDays: null };
    const ageMs = Date.now() - statSync(path).mtimeMs;
    return { name, ageDays: Math.round(ageMs / (1000 * 60 * 60 * 24)) };
  });

  const stale = changedInputs.length > 0 || missingInputs.length > 0;

  let summary: string;
  if (!lastCompiledAt) {
    summary = 'No compilation found. Run `specflow compile` first.';
  } else if (stale) {
    summary = `PCB is stale. ${changedInputs.length + missingInputs.length} input(s) changed or missing since last compile.`;
  } else {
    summary = 'PCB is up to date.';
  }

  return { stale, lastCompiledAt, changedInputs, missingInputs, pcbFiles, summary };
}
