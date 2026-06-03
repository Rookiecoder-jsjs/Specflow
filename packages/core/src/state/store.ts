import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, renameSync, unlinkSync } from 'fs';
import { join } from 'path';
import type { ProjectMeta, Bundle } from '../types.js';
import { ProjectMetaSchema, BundleSchema } from '../types.js';

function atomicWriteJson(targetPath: string, payload: unknown): void {
  const tmpPath = `${targetPath}.${process.pid}.${Date.now()}.tmp`;
  try {
    writeFileSync(tmpPath, JSON.stringify(payload, null, 2), 'utf-8');
    renameSync(tmpPath, targetPath);
  } catch (err) {
    try { unlinkSync(tmpPath); } catch { /* ignore */ }
    throw err;
  }
}

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
  atomicWriteJson(path, meta);
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
  atomicWriteJson(join(dir, 'bundle.json'), bundle);
}

export function listVersions(projectRoot: string): string[] {
  const dir = join(projectRoot, '.specflow', 'versions');
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir, { withFileTypes: false }) as string[];
  return entries.filter((d: string) => d.startsWith('v')).sort();
}

export function getLatestVersion(projectRoot: string): string | null {
  const versions = listVersions(projectRoot);
  return versions.length > 0 ? versions[versions.length - 1]! : null;
}
