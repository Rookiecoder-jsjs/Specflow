import chalk from 'chalk';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

export function checkSessionStart(projectRoot: string): string | null {
  const specFlowDir = join(projectRoot, '.specflow');
  if (!existsSync(specFlowDir)) return null;

  // Check for unresolved open questions
  const versionsDir = join(specFlowDir, 'versions');
  if (existsSync(versionsDir)) {
    const versions = readdirSync(versionsDir).filter(d => d.startsWith('v')).sort();
    const latest = versions[versions.length - 1];
    if (latest) {
      const bundlePath = join(versionsDir, latest, 'bundle.json');
      if (existsSync(bundlePath)) {
        const bundle = JSON.parse(require('fs').readFileSync(bundlePath, 'utf-8'));
        const oq = bundle.metadata?.openQuestionCount ?? 0;
        if (oq > 0) {
          return chalk.yellow(
            `SpecFlow: ${oq} open question(s) remain. Check 07_open_questions.md.`
          );
        }
      }
    }
  }

  return null;
}
