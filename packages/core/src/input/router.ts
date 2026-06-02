import { statSync, readFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import type { InputFile, InputType, ParsedInput } from '../types.js';

const MIME_MAP: Record<string, InputType> = {
  '.m4a': 'audio', '.mp3': 'audio', '.wav': 'audio',
  '.aac': 'audio', '.flac': 'audio', '.ogg': 'audio', '.webm': 'audio',
  '.md': 'text', '.txt': 'text', '.pdf': 'text', '.docx': 'text',
  '.json': 'chat',
};

function fileHash(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function mimeFromExt(ext: string): string {
  const map: Record<string, string> = {
    '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
    '.aac': 'audio/aac', '.flac': 'audio/flac', '.ogg': 'audio/ogg',
    '.webm': 'audio/webm', '.md': 'text/markdown', '.txt': 'text/plain',
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.json': 'application/json',
  };
  return map[ext] ?? 'application/octet-stream';
}

export function detectType(filePath: string): InputType {
  // Directories are treated as project input
  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    return 'project' as InputType;
  }
  const ext = filePath.toLowerCase().slice(filePath.lastIndexOf('.'));
  const type = MIME_MAP[ext];
  if (!type) throw new Error(`Unsupported file format: ${ext}`);
  return type;
}

export function getInputFile(filePath: string): InputFile {
  const stats = statSync(filePath);
  const type = detectType(filePath);
  const ext = filePath.toLowerCase().slice(filePath.lastIndexOf('.'));
  const isDir = stats.isDirectory();
  return {
    path: filePath,
    type,
    mime: isDir ? 'inode/directory' : mimeFromExt(ext),
    hash: isDir ? createHash('sha256').update(filePath).digest('hex') : fileHash(filePath),
    size: stats.size,
  };
}

export async function routeInput(files: string[]): Promise<ParsedInput[]> {
  const results: ParsedInput[] = [];
  for (const fp of files) {
    const inputFile = getInputFile(fp);
    let parsed: ParsedInput[];
    switch (inputFile.type) {
      case 'audio': {
        const { parseAudio } = await import('./audio.js');
        parsed = await parseAudio(inputFile);
        break;
      }
      case 'text': {
        const { parseText } = await import('./text.js');
        parsed = await parseText(inputFile);
        break;
      }
      case 'chat': {
        const { parseChat } = await import('./chat.js');
        parsed = await parseChat(inputFile);
        break;
      }
      case 'project': {
        const { parseProject } = await import('./project.js');
        parsed = await parseProject(inputFile);
        break;
      }
    }
    results.push(...parsed);
  }
  return results;
}
