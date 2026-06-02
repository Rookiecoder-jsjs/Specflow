import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileSha256 } from '../utils/hash.js';

interface InputRecord {
  hash: string;
  path: string;
  processedAt: string;
}

export function getInputHash(filePath: string): string {
  return fileSha256(filePath);
}

export function isInputProcessed(projectRoot: string, filePath: string): boolean {
  const hash = getInputHash(filePath);
  const recordPath = join(projectRoot, '.specflow', 'inputs', `${hash}.json`);
  return existsSync(recordPath);
}

export function markInputProcessed(projectRoot: string, filePath: string): void {
  const hash = getInputHash(filePath);
  const inputsDir = join(projectRoot, '.specflow', 'inputs');
  mkdirSync(inputsDir, { recursive: true });
  const record: InputRecord = {
    hash,
    path: filePath,
    processedAt: new Date().toISOString(),
  };
  writeFileSync(join(inputsDir, `${hash}.json`), JSON.stringify(record, null, 2), 'utf-8');
}

export function detectNewInputs(projectRoot: string, filePaths: string[]): string[] {
  return filePaths.filter(fp => !isInputProcessed(projectRoot, fp));
}
