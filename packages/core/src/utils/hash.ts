import { createHash } from 'crypto';
import { readFileSync, statSync } from 'fs';

export function sha256(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

export function fileSha256(filePath: string): string {
  if (statSync(filePath).isDirectory()) {
    return sha256(filePath);
  }
  return sha256(readFileSync(filePath));
}

export function contentSha256(content: string): string {
  return sha256(content);
}
