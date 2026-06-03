#!/usr/bin/env node
// Copy prompt templates from src/agent/prompts/ to dist/prompts/.
// tsup doesn't copy non-TS assets automatically; the agents (aggregator, extractor,
// gap-detector, project scanner) read these via __dirname-relative paths at runtime.
import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(here, '..', 'src', 'agent', 'prompts');
const distDir = resolve(here, '..', 'dist', 'prompts');

if (!existsSync(srcDir)) {
  console.error(`copy-prompts: source not found: ${srcDir}`);
  process.exit(1);
}

mkdirSync(distDir, { recursive: true });
cpSync(srcDir, distDir, { recursive: true, force: true });
console.log(`copy-prompts: ${srcDir} -> ${distDir}`);
