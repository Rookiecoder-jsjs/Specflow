import chalk from 'chalk';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const STALE_DAYS = 7;

export function checkSessionStart(projectRoot: string): string | null {
  const specFlowDir = join(projectRoot, '.specflow');
  if (!existsSync(specFlowDir)) return null;

  const warnings: string[] = [];

  // Check for unresolved open questions
  const versionsDir = join(specFlowDir, 'versions');
  if (existsSync(versionsDir)) {
    const versions = readdirSync(versionsDir).filter(d => d.startsWith('v')).sort();
    const latest = versions[versions.length - 1];
    if (latest) {
      const bundlePath = join(versionsDir, latest, 'bundle.json');
      if (existsSync(bundlePath)) {
        try {
          const bundle = JSON.parse(readFileSync(bundlePath, 'utf-8'));
          const oq = bundle.metadata?.openQuestionCount ?? 0;
          if (oq > 0) {
            warnings.push(`${oq} open question(s) remain. Check 07_open_questions.md.`);
          }
        } catch { /* ignore */ }
      }
    }
  }

  // Check for stale context (Fresh Context principle from Harness Engineering)
  const projectJson = join(specFlowDir, 'project.json');
  if (existsSync(projectJson)) {
    try {
      const meta = JSON.parse(readFileSync(projectJson, 'utf-8'));
      if (meta.updatedAt) {
        const compiledAt = new Date(meta.updatedAt).getTime();
        const daysSince = Math.round((Date.now() - compiledAt) / (1000 * 60 * 60 * 24));
        if (daysSince > STALE_DAYS) {
          warnings.push(
            `Context is ${daysSince} days old (stale threshold: ${STALE_DAYS}d). Run \`specflow compile\` to refresh.`
          );
        }
      }
    } catch { /* ignore */ }
  }

  // Check if CLAUDE.md exists at project root
  const claudeMd = join(projectRoot, 'CLAUDE.md');
  if (!existsSync(claudeMd)) {
    warnings.push('No CLAUDE.md found. Run `specflow compile` to generate context map.');
  }

  if (warnings.length === 0) return null;

  return chalk.yellow(`SpecFlow: ${warnings.join(' ')}`);
}
