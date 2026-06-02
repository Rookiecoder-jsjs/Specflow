import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import type { ProjectMeta, Bundle } from '../types.js';
import { ProjectMetaSchema, BundleSchema } from '../types.js';

export function ensureSpecFlowDir(projectRoot: string): string {
  const dir = join(projectRoot, '.specflow');
  mkdirSync(dir, { recursive: true });
  mkdirSync(join(dir, 'inputs'), { recursive: true });
  mkdirSync(join(dir, 'versions'), { recursive: true });
  return dir;
}

export function readProjectMeta(projectRoot: string): ProjectMeta | null {
  const path = join(projectRoot, '.specflow', 'project.json');
  if (!existsSync(path)) return null;
  const raw = JSON.parse(readFileSync(path, 'utf-8'));
  return ProjectMetaSchema.parse(raw);
}

export function writeProjectMeta(projectRoot: string, meta: ProjectMeta): void {
  const path = join(projectRoot, '.specflow', 'project.json');
  writeFileSync(path, JSON.stringify(meta, null, 2), 'utf-8');
}

export function readBundle(projectRoot: string, version: string): Bundle | null {
  const path = join(projectRoot, '.specflow', 'versions', version, 'bundle.json');
  if (!existsSync(path)) return null;
  const raw = JSON.parse(readFileSync(path, 'utf-8'));
  return BundleSchema.parse(raw) as unknown as Bundle;
}

export function writeBundle(projectRoot: string, version: string, bundle: Bundle): void {
  const dir = join(projectRoot, '.specflow', 'versions', version);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'bundle.json'), JSON.stringify(bundle, null, 2), 'utf-8');
}

export function listVersions(projectRoot: string): string[] {
  const dir = join(projectRoot, '.specflow', 'versions');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(d => d.startsWith('v')).sort();
}

export function getLatestVersion(projectRoot: string): string | null {
  const versions = listVersions(projectRoot);
  return versions.length > 0 ? versions[versions.length - 1]! : null;
}
