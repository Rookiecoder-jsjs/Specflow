import chalk from 'chalk';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

export async function handleInit(projectRoot: string, name?: string): Promise<void> {
  const specFlowDir = join(projectRoot, '.specflow');

  if (existsSync(join(specFlowDir, 'project.json'))) {
    console.log(chalk.yellow('SpecFlow is already initialized in this project.'));
    return;
  }

  mkdirSync(specFlowDir, { recursive: true });
  mkdirSync(join(specFlowDir, 'inputs'), { recursive: true });
  mkdirSync(join(specFlowDir, 'versions'), { recursive: true });
  mkdirSync(join(projectRoot, 'docs', 'spec-flow'), { recursive: true });

  const projectName = name ?? projectRoot.split(/[/\\]/).pop() ?? 'untitled';

  const meta = {
    id: crypto.randomUUID(),
    name: projectName,
    stage: 'discovery',
    activePlugins: ['claude-code'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currentVersion: 'v0.1.0',
  };

  writeFileSync(
    join(specFlowDir, 'project.json'),
    JSON.stringify(meta, null, 2),
    'utf-8',
  );

  console.log('');
  console.log(chalk.green('  SpecFlow AI initialized!'));
  console.log(chalk.white(`  Project: ${projectName}`));
  console.log(chalk.dim(`  State:   ${specFlowDir}`));
  console.log(chalk.dim(`  Output:  ${join(projectRoot, 'docs', 'spec-flow')}`));
  console.log('');
  console.log(chalk.white('  Next: /specflow:compile --audio meeting.m4a'));
  console.log('');
}
