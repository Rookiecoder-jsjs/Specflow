import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import type { CompileOptions, CompileResult, AggregatedBundle, GeneratedFile, OpenQuestion, CompileStats, CostBreakdown } from '../types.js';
import { generateOverview } from './markdown.js';

export async function compilePCB(
  bundle: AggregatedBundle,
  options: CompileOptions,
  stats: CompileStats,
  cost: CostBreakdown,
): Promise<CompileResult> {
  const outputDir = options.outputDir ?? join(options.projectRoot, 'docs', 'spec-flow');
  mkdirSync(outputDir, { recursive: true });

  const version = options.version ?? autoVersion(options.projectRoot);

  const files: GeneratedFile[] = [];
  const generators: [string, (b: AggregatedBundle) => string][] = [
    ['00_overview.md', (b) => generateOverview(b)],
    ['01_product_spec.md', (b) => generateProductSpec(b)],
    ['02_user_flows.md', (b) => generateUserFlows(b)],
    ['03_technical_constraints.md', (b) => generateTechConstraints(b)],
    ['04_data_model.md', (b) => generateDataModel(b)],
    ['05_task_breakdown.md', (b) => generateTaskBreakdown(b)],
    ['06_agent_instructions.md', (b) => generateAgentInstructions(b)],
    ['07_open_questions.md', (b) => generateOpenQuestions(b)],
    ['08_decision_log.md', (b) => generateDecisionLog(b)],
    ['09_codebase_analysis.md', (b) => generateCodebaseAnalysis(b)],
    ['10_tech_stack.md', (b) => generateTechStack(b)],
    ['11_architecture.md', (b) => generateArchitecture(b)],
  ];

  for (const [filename, gen] of generators) {
    const content = gen(bundle);
    const path = join(outputDir, filename);
    const changed = existsSync(path) ? readFileSync(path, 'utf-8') !== content : true;
    if (options.incremental && !changed) continue;
    if (!options.dryRun) writeFileSync(path, content, 'utf-8');
    files.push({ path, content, changed });
  }

  return {
    version,
    files,
    openQuestions: bundle.openQuestions ?? [],
    stats,
    cost,
  };
}

function autoVersion(projectRoot: string): string {
  const versionsDir = join(projectRoot, '.specflow', 'versions');
  if (!existsSync(versionsDir)) return 'v1.0.0';
  const { readdirSync } = require('fs') as typeof import('fs');
  const versions = readdirSync(versionsDir).filter((d: string) => d.startsWith('v'));
  if (versions.length === 0) return 'v1.0.0';
  const latest = versions.sort().pop()!;
  const num = parseInt(latest.slice(1).split('.').pop()!, 10);
  return `v1.0.${num + 1}`;
}

function generateProductSpec(b: AggregatedBundle): string {
  const ps = b.productSpec;
  let md = '# Product Specification\n\n';
  md += `## Value Proposition\n${ps.valueProposition}\n\n`;
  md += '## Target Users\n';
  for (const u of ps.targetUsers) md += `- ${u}\n`;
  md += '\n## Features\n';
  for (const f of ps.features) md += `- **[${f.priority}]** ${f.name}: ${f.description}\n`;
  md += '\n## Scope\n### Included\n';
  for (const s of ps.scope.included) md += `- ${s}\n`;
  md += '\n### Excluded\n';
  for (const s of ps.scope.excluded) md += `- ${s}\n`;
  return md;
}

function generateUserFlows(b: AggregatedBundle): string {
  let md = '# User Flows\n\n';
  for (const flow of b.userFlows) {
    md += `## ${flow.name}\n\n`;
    md += '| Actor | Action | Expected Outcome |\n';
    md += '|-------|--------|------------------|\n';
    for (const step of flow.steps) {
      md += `| ${step.actor} | ${step.action} | ${step.expectedOutcome} |\n`;
    }
    if (flow.edgeCases.length > 0) {
      md += '\n### Edge Cases\n';
      for (const ec of flow.edgeCases) md += `- ${ec}\n`;
    }
    md += '\n';
  }
  return md;
}

function generateTechConstraints(b: AggregatedBundle): string {
  let md = '# Technical Constraints\n\n';
  for (const tc of b.technicalConstraints) {
    md += `## ${tc.category}\n`;
    md += `**Description:** ${tc.description}\n\n`;
    md += `**Rationale:** ${tc.rationale}\n\n`;
    if (tc.alternatives?.length) {
      md += '**Alternatives Considered:**\n';
      for (const a of tc.alternatives) md += `- ${a}\n`;
    }
    md += '\n';
  }
  return md;
}

function generateDataModel(b: AggregatedBundle): string {
  let md = '# Data Model\n\n';
  for (const entity of b.dataModel.entities) {
    md += `## ${entity.name}\n\n`;
    md += '| Field | Type | Description | Nullable |\n';
    md += '|-------|------|-------------|----------|\n';
    for (const f of entity.fields) {
      md += `| ${f.name} | ${f.type} | ${f.description} | ${f.nullable ? 'Yes' : 'No'} |\n`;
    }
    if (entity.relationships.length > 0) {
      md += '\n### Relationships\n';
      for (const r of entity.relationships) {
        md += `- **${r.type}** → ${r.target}: ${r.description}\n`;
      }
    }
    md += '\n';
  }
  return md;
}

function generateTaskBreakdown(b: AggregatedBundle): string {
  let md = '# Task Breakdown\n\n';
  for (const t of b.tasks) {
    md += `## ${t.id}: ${t.title}\n`;
    md += `**Priority:** ${t.priority} | **Estimate:** ${t.estimatedHours}h\n\n`;
    md += `${t.description}\n\n`;
    md += '**Acceptance Criteria:**\n';
    for (const ac of t.acceptanceCriteria) md += `- [ ] ${ac}\n`;
    if (t.dependencies.length > 0) {
      md += `\n**Dependencies:** ${t.dependencies.join(', ')}\n`;
    }
    md += '\n';
  }
  return md;
}

function generateAgentInstructions(b: AggregatedBundle): string {
  let md = '# Agent Instructions\n\n';
  const critical = b.agentInstructions.filter(a => a.priority === 'critical');
  const important = b.agentInstructions.filter(a => a.priority === 'important');
  const advisory = b.agentInstructions.filter(a => a.priority === 'advisory');

  if (critical.length) {
    md += '## Critical\n';
    for (const a of critical) md += `- [${a.category}] ${a.content}\n`;
    md += '\n';
  }
  if (important.length) {
    md += '## Important\n';
    for (const a of important) md += `- [${a.category}] ${a.content}\n`;
    md += '\n';
  }
  if (advisory.length) {
    md += '## Advisory\n';
    for (const a of advisory) md += `- [${a.category}] ${a.content}\n`;
    md += '\n';
  }
  return md;
}

function generateOpenQuestions(b: AggregatedBundle): string {
  let md = '# Open Questions\n\n';
  const open = b.openQuestions.filter(q => q.status === 'open');
  const resolved = b.openQuestions.filter(q => q.status === 'resolved');

  if (open.length > 0) {
    md += `## Open (${open.length})\n\n`;
    for (const q of open) {
      md += `### ${q.id}: ${q.question}\n`;
      md += `**Category:** ${q.category}\n\n`;
      md += `**Context:** ${q.context}\n\n`;
      if (q.suggestedAnswers?.length) {
        md += '**Suggested Answers:**\n';
        for (const a of q.suggestedAnswers) md += `- ${a}\n`;
      }
      md += '\n';
    }
  }

  if (resolved.length > 0) {
    md += `## Resolved (${resolved.length})\n\n`;
    for (const q of resolved) {
      md += `- ~~${q.question}~~ → ${q.resolution ?? 'Resolved'}\n`;
    }
  }

  if (open.length === 0 && resolved.length === 0) {
    md += 'No open questions recorded.\n';
  }
  return md;
}

function generateDecisionLog(b: AggregatedBundle): string {
  let md = '# Decision Log\n\n';
  for (const d of b.decisions) {
    md += `## ${d.id}: ${d.topic}\n`;
    md += `**Status:** ${d.status} | **Date:** ${d.date}\n\n`;
    md += `**Decision:** ${d.decision}\n\n`;
    md += `**Rationale:** ${d.rationale}\n\n`;
    md += '**Alternatives:**\n';
    for (const a of d.alternatives) md += `- ${a}\n`;
    md += '\n';
  }
  return md;
}

function generateCodebaseAnalysis(b: AggregatedBundle): string {
  let md = '# Codebase Analysis\n\n';

  // Tech stack from technicalConstraints
  const techStack = (b.technicalConstraints || []).filter(
    t => ['frontend', 'backend', 'database', 'language', 'framework', 'infrastructure', 'deployment'].some(
      k => t.category.toLowerCase().includes(k)
    )
  );
  if (techStack.length > 0) {
    md += '## Tech Stack\n\n';
    for (const t of techStack) {
      md += `- **${t.category}:** ${t.description}${t.rationale ? ' — ' + t.rationale : ''}\n`;
    }
    md += '\n';
  }

  // Features extracted from code
  const features = (b.productSpec?.features || []).filter(f =>
    f.priority === 'P0' || f.priority === 'P1'
  );
  if (features.length > 0) {
    md += '## Discovered Features\n\n';
    for (const f of features) {
      md += `- **[${f.priority}]** ${f.name}: ${f.description || ''}\n`;
    }
    md += '\n';
  }

  // Data model summary
  const entities = b.dataModel?.entities || [];
  if (entities.length > 0) {
    md += '## Data Model Summary\n\n';
    md += `Total entities: ${entities.length}\n\n`;
    for (const e of entities.slice(0, 15)) {
      md += `### ${e.name}\n`;
      md += `Fields: ${(e.fields || []).map(f => f.name).join(', ') || 'none'}\n`;
      if (e.relationships?.length) {
        md += `Relations: ${e.relationships.map(r => `${r.type} → ${r.target}`).join(', ')}\n`;
      }
      md += '\n';
    }
  }

  // Architecture decisions
  const archDecisions = (b.decisions || []).filter(d =>
    d.topic.toLowerCase().includes('arch') ||
    d.topic.toLowerCase().includes('tech') ||
    d.topic.toLowerCase().includes('stack')
  );
  if (archDecisions.length > 0) {
    md += '## Architecture Decisions\n\n';
    for (const d of archDecisions) {
      md += `- **${d.topic}:** ${d.decision} (${d.status})\n`;
    }
    md += '\n';
  }

  if (techStack.length === 0 && features.length === 0 && entities.length === 0) {
    md += 'No codebase analysis available. Run with --project to analyze source code.\n';
  }

  return md;
}

function generateTechStack(b: AggregatedBundle): string {
  let md = '# Technology Stack\n\n';

  const stack = b.techStack ?? [];
  if (stack.length === 0) {
    md += 'No technology stack information available.\n';
    return md;
  }

  const byCategory = new Map<string, typeof stack>();
  for (const item of stack) {
    const cat = item.category || 'Other';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(item);
  }

  for (const [category, items] of byCategory) {
    md += `## ${category}\n\n`;
    md += '| Technology | Version | Purpose | Alternatives |\n';
    md += '|------------|---------|---------|-------------|\n';
    for (const item of items) {
      const version = item.version ?? '-';
      const alt = item.alternatives?.join(', ') ?? '-';
      md += `| ${item.name} | ${version} | ${item.purpose} | ${alt} |\n`;
    }
    md += '\n';
  }

  md += '## Summary\n\n';
  md += `Total technologies: ${stack.length}\n`;
  md += `Categories: ${[...byCategory.keys()].join(', ')}\n`;

  return md;
}

function generateArchitecture(b: AggregatedBundle): string {
  let md = '# Product Architecture\n\n';

  const arch = b.architecture;
  if (!arch) {
    md += 'No architecture information available.\n';
    return md;
  }

  md += `**Style:** ${arch.style}\n\n`;
  md += `## Overview\n\n${arch.description}\n\n`;

  if (arch.components.length > 0) {
    md += '## Components\n\n';
    md += '| Component | Type | Description | Technologies | Depends On |\n';
    md += '|-----------|------|-------------|-------------|------------|\n';
    for (const c of arch.components) {
      md += `| ${c.name} | ${c.type} | ${c.description} | ${c.technologies.join(', ')} | ${c.dependsOn.join(', ') || '-'} |\n`;
    }
    md += '\n';
  }

  if (arch.dataFlow.length > 0) {
    md += '## Data Flow\n\n';
    md += '| From | To | What |\n';
    md += '|------|----|------|\n';
    for (const df of arch.dataFlow) {
      md += `| ${df.from} | ${df.to} | ${df.what} |\n`;
    }
    md += '\n';
  }

  if (arch.deployment) {
    md += '## Deployment\n\n';
    md += `**Platform:** ${arch.deployment.platform}\n\n`;
    md += `**Strategy:** ${arch.deployment.strategy}\n\n`;
    md += `${arch.deployment.details}\n\n`;
  }

  if (arch.keyDecisions.length > 0) {
    md += '## Key Architecture Decisions\n\n';
    for (const kd of arch.keyDecisions) {
      md += `### ${kd.topic}\n`;
      md += `**Decision:** ${kd.decision}\n\n`;
      md += `**Rationale:** ${kd.rationale}\n\n`;
    }
  }

  return md;
}
