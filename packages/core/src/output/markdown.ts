import type { AggregatedBundle } from '../types.js';

export function generateOverview(b: AggregatedBundle): string {
  let md = '# Project Overview\n\n';
  md += `**Name:** ${b.overview.name}\n\n`;
  md += `**Stage:** ${b.overview.stage}\n\n`;
  md += `## Description\n${b.overview.description}\n\n`;
  md += '## Goals\n';
  for (const g of b.overview.goals) md += `- ${g}\n`;
  md += '\n## Stakeholders\n';
  for (const s of b.overview.stakeholders) md += `- ${s}\n`;
  return md;
}
