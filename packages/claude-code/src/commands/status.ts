import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export async function handleStatus(projectRoot: string): Promise<void> {
  const projectPath = join(projectRoot, '.specflow', 'project.json');

  if (!existsSync(projectPath)) {
    console.log(chalk.dim('No SpecFlow project found. Run /specflow:init first.'));
    return;
  }

  const meta = JSON.parse(readFileSync(projectPath, 'utf-8'));
  const bundlesDir = join(projectRoot, '.specflow', 'versions');
  const versions = existsSync(bundlesDir)
    ? require('fs').readdirSync(bundlesDir).filter((d: string) => d.startsWith('v')).sort()
    : [];

  const latestVersion = versions.length > 0 ? versions[versions.length - 1] : null;
  let openQuestionCount = 0;

  if (latestVersion) {
    const bundlePath = join(bundlesDir, latestVersion, 'bundle.json');
    if (existsSync(bundlePath)) {
      const bundle = JSON.parse(readFileSync(bundlePath, 'utf-8'));
      openQuestionCount = bundle.metadata?.openQuestionCount ?? 0;
    }
  }

  const pcbFiles = [
    '00_overview.md', '01_product_spec.md', '02_user_flows.md',
    '03_technical_constraints.md', '04_data_model.md',
    '05_task_breakdown.md', '06_agent_instructions.md',
    '07_open_questions.md', '08_decision_log.md',
  ];

  const pcbDir = join(projectRoot, 'docs', 'spec-flow');

  console.log('');
  console.log(chalk.white(`  Project: ${meta.name} [${meta.stage}]`));
  console.log(chalk.white(`  Version: ${meta.currentVersion} (${versions.length} total)`));
  console.log(chalk.dim(`  Updated: ${meta.updatedAt}`));
  console.log('');

  console.log(chalk.white('  PCB Files:'));
  for (const f of pcbFiles) {
    const present = existsSync(join(pcbDir, f));
    const icon = present ? chalk.green('  ●') : chalk.dim('  ○');
    const suffix = f === '07_open_questions.md' && openQuestionCount > 0
      ? chalk.red(` (${openQuestionCount} open)`)
      : '';
    console.log(`${icon} ${f}${suffix}`);
  }

  console.log('');

  if (openQuestionCount > 0) {
    console.log(chalk.red(`  ${openQuestionCount} open question(s) — check 07_open_questions.md`));
    console.log('');
  }

  const newInputs = detectNewInputs(projectRoot);
  if (newInputs.length > 0) {
    console.log(chalk.yellow(`  New inputs detected: ${newInputs.length} file(s)`));
    console.log(chalk.yellow('  Run /specflow:compile to update.'));
    console.log('');
  }
}

function detectNewInputs(projectRoot: string): string[] {
  // Stub — actual detection done by core engine
  return [];
}
