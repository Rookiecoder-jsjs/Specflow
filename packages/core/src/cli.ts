#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { compile } from './pipeline/compile.js';
import { checkDrift } from './pipeline/check.js';
import { readProjectMeta, writeProjectMeta, readBundle, listVersions, ensureSpecFlowDir } from './state/store.js';
import { semanticDiff } from './output/diff.js';
import { formatDuration, formatCost } from './utils/format.js';

const program = new Command();

const pkg = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', 'package.json'), 'utf-8')
);

program
  .name('specflow')
  .description('SpecFlow AI — AI-powered project context compiler')
  .version(pkg.version);

// ── init ──
program
  .command('init')
  .description('Initialize SpecFlow in the current project')
  .option('--name <name>', 'Project name')
  .action(async (opts) => {
    const projectRoot = process.cwd();
    const dir = ensureSpecFlowDir(projectRoot);

    const name = opts.name ?? projectRoot.split(/[/\\]/).pop() ?? 'untitled';
    const meta = {
      id: crypto.randomUUID(),
      name,
      stage: 'discovery' as const,
      activePlugins: ['claude-code'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentVersion: 'v0.1.0',
    };
    writeProjectMeta(projectRoot, meta);

    console.log('');
    console.log(`  SpecFlow AI initialized!`);
    console.log(`  Project: ${name}`);
    console.log(`  State dir: ${join(projectRoot, '.specflow')}`);
    console.log(`  Output dir: ${join(projectRoot, 'docs', 'spec-flow')}`);
    console.log('');
    console.log('  Next steps:');
    console.log('    specflow compile --audio meeting.m4a');
    console.log('    specflow compile --text notes.md');
    console.log('');
  });

// ── compile ──
program
  .command('compile')
  .description('Compile inputs into Project Context Bundle (PCB)')
  .option('--audio <path>', 'Audio file path')
  .option('--text <path>', 'Text/document file path')
  .option('--chat <path>', 'Chat export file path')
  .option('--project <path>', 'Project source directory to analyze')
  .option('--version <v>', 'Bundle version')
  .option('--dry-run', 'Estimate cost without execution')
  .option('--force', 'Ignore cache and force recompile')
  .option('--config <path>', 'Path to specflow.config.json (overrides auto-discovery)')
  .action(async (opts) => {
    if (opts.config) setExplicitConfigPath(opts.config);
    const inputs: string[] = [];
    if (opts.audio) inputs.push(opts.audio);
    if (opts.text) inputs.push(opts.text);
    if (opts.chat) inputs.push(opts.chat);
    if (opts.project) inputs.push(opts.project);

    if (inputs.length === 0) {
      console.error('Error: At least one input is required (--audio, --text, --chat, or --project)');
      process.exit(1);
    }

    const projectRoot = process.cwd();

    try {
      const result = await compile({
        projectRoot,
        inputs,
        version: opts.version,
        dryRun: opts.dryRun,
        incremental: !opts.force,
      });

      if (opts.dryRun) {
        console.log('');
        console.log('  Dry run — estimated cost:');
        console.log(`  Input tokens:  ${result.stats.totalTranscriptLength}`);
        console.log(`  Segments:      ${result.stats.segmentCount}`);
        console.log(`  Cost:          ${formatCost(result.cost.estimatedCostCNY)}`);
        if (result.cost.estimatedCostCNY === 0) {
          console.log('  (No API calls needed)');
        }
        console.log('');
        return;
      }

      console.log('');
      console.log(`  Compilation complete! Version: ${result.version}`);
      console.log(`  Files generated:  ${result.files.length}`);
      console.log(`  Facts extracted:  ${result.stats.extractedFactCount}`);
      console.log(`  Open questions:   ${result.openQuestions.length}`);
      console.log(`  Duration:         ${formatDuration(result.stats.compilationDurationMs)}`);
      console.log('');
      console.log(`  CLAUDE.md written to project root.`);
      console.log('');
    } catch (err) {
      console.error(`Compilation failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

// ── status ──
program
  .command('status')
  .description('Show project status and open questions')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    const projectRoot = process.cwd();
    const meta = readProjectMeta(projectRoot);

    if (!meta) {
      console.log('No SpecFlow project found. Run `specflow init` first.');
      process.exit(0);
    }

    const currentVersion = meta.currentVersion;
    const bundle = readBundle(projectRoot, currentVersion);
    const versions = listVersions(projectRoot);

    if (opts.json) {
      console.log(JSON.stringify({
        project: meta,
        versions,
        currentBundle: bundle ? {
          version: bundle.version,
          totalFacts: bundle.metadata.totalFacts,
          openQuestions: bundle.metadata.openQuestionCount,
          avgConfidence: bundle.metadata.avgConfidence,
        } : null,
      }, null, 2));
      return;
    }

    console.log('');
    console.log(`  Project: ${meta.name} [${meta.stage}]`);
    console.log(`  Version: ${meta.currentVersion}`);
    console.log(`  Updated: ${meta.updatedAt}`);
    console.log(`  Versions: ${versions.join(', ')}`);
    console.log('');

    if (bundle) {
      console.log(`  PCB Status:`);
      const files = [
        '00_overview.md', '01_product_spec.md', '02_user_flows.md',
        '03_technical_constraints.md', '04_data_model.md',
        '05_task_breakdown.md', '06_agent_instructions.md',
        '07_open_questions.md', '08_decision_log.md',
        '09_codebase_analysis.md', '10_tech_stack.md', '11_architecture.md',
      ];
      for (const f of files) {
        const exists = existsSync(join(projectRoot, 'docs', 'spec-flow', f));
        console.log(`    ${exists ? '●' : '○'} ${f}`);
      }
      console.log('');
      const oq = bundle.metadata.openQuestionCount;
      if (oq > 0) {
        console.log(`  Open Questions: ${oq} (see docs/spec-flow/07_open_questions.md)`);
      } else {
        console.log(`  No open questions.`);
      }
      console.log('');
    }
  });

// ── diff ──
program
  .command('diff')
  .description('Show semantic diff between two versions')
  .option('--from <v>', 'Source version (default: previous)')
  .option('--to <v>', 'Target version (default: current)')
  .action(async (opts) => {
    const projectRoot = process.cwd();
    const versions = listVersions(projectRoot);

    if (versions.length < 2) {
      console.log('Need at least 2 versions to diff. Run `specflow compile` first.');
      process.exit(0);
    }

    const toVersion = opts.to ?? versions[versions.length - 1]!;
    const fromVersion = opts.from ?? versions[versions.length - 2]!;

    const oldBundle = readBundle(projectRoot, fromVersion);
    const newBundle = readBundle(projectRoot, toVersion);

    if (!oldBundle || !newBundle) {
      console.error('Error: Could not load bundle versions');
      process.exit(1);
    }

    const diff = semanticDiff(oldBundle, newBundle);

    console.log('');
    console.log(`  Diff: ${diff.version.from} → ${diff.version.to}`);
    console.log(`  ${diff.summary}`);
    console.log('');

    if (diff.added.length > 0) {
      console.log('  Added:');
      for (const a of diff.added) console.log(`    + ${a.section}`);
    }
    if (diff.modified.length > 0) {
      console.log('  Modified:');
      for (const m of diff.modified) console.log(`    ~ ${m.section} (similarity: ${m.confidence.toFixed(2)})`);
    }
    if (diff.removed.length > 0) {
      console.log('  Removed:');
      for (const r of diff.removed) console.log(`    - ${r.section}`);
    }
    console.log('');
  });

// ── check ──
program
  .command('check')
  .description('Check for PCB drift — detect stale context after source changes')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    const projectRoot = process.cwd();
    const report = checkDrift(projectRoot);

    if (opts.json) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    console.log('');
    if (report.stale) {
      console.log('  ⚠ PCB is STALE — re-run `specflow compile` to refresh context.');
      console.log('');
      if (report.changedInputs.length > 0) {
        console.log('  Changed inputs:');
        for (const fp of report.changedInputs) console.log(`    ~ ${fp}`);
      }
      if (report.missingInputs.length > 0) {
        console.log('  Missing inputs:');
        for (const fp of report.missingInputs) console.log(`    ✗ ${fp}`);
      }
    } else if (!report.lastCompiledAt) {
      console.log('  No compilation yet. Run `specflow compile` to create PCB.');
    } else {
      console.log('  ✓ PCB is up to date.');
      console.log(`  Last compiled: ${report.lastCompiledAt.split('T')[0]}`);
    }

    if (report.pcbFiles.length > 0) {
      console.log('');
      console.log('  PCB file ages:');
      for (const f of report.pcbFiles) {
        const age = f.ageDays !== null ? `${f.ageDays}d` : 'missing';
        console.log(`    ${f.ageDays !== null ? '●' : '○'} ${f.name} (${age})`);
      }
    }
    console.log('');
  });

program.parse();
