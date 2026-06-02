import { readFileSync } from 'fs';
import { extname } from 'path';
import type { InputFile, ParsedInput } from '../types.js';

type ChatMessage = { speaker: string; time: string; content: string };

function detectChatFormat(raw: string): 'feishu' | 'slack' | 'wechat' | 'generic' {
  if (raw.includes('"messages"') || raw.includes('"user"')) return 'slack';
  if (/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/.test(raw)) return 'feishu';
  if (/\d{1,2}:\d{2}\s*[（(]/.test(raw)) return 'wechat';
  if (/\[.+\]\s*\[.+\]/.test(raw)) return 'generic';
  return 'generic';
}

function parseFeishu(raw: string): ChatMessage[] {
  const re = /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(.+?)[:：]\s*(.+)$/;
  return raw.split('\n').map(line => {
    const m = line.match(re);
    return m ? { time: m[1]!, speaker: m[2]!, content: m[3]! } : null;
  }).filter((m): m is ChatMessage => m !== null);
}

function parseSlack(raw: string): ChatMessage[] {
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    return ((data['messages'] as Array<Record<string, unknown>>) ?? []).map(m => ({
      time: (m['ts'] as string) ?? '',
      speaker: (m['user'] as string) ?? 'unknown',
      content: (m['text'] as string) ?? '',
    }));
  } catch { return []; }
}

function parseWechat(raw: string): ChatMessage[] {
  const re = /^(\d{1,2}:\d{2})\s*[（(](.+?)[）)]\s*(.+)$/;
  return raw.split('\n').map(line => {
    const m = line.match(re);
    return m ? { time: m[1]!, speaker: m[2]!, content: m[3]! } : null;
  }).filter((m): m is ChatMessage => m !== null);
}

function parseGeneric(raw: string): ChatMessage[] {
  const re = /^\[(.+?)\]\s*\[(.+?)\][:：]\s*(.+)$/;
  return raw.split('\n').map(line => {
    const m = line.match(re);
    return m ? { time: m[1]!, speaker: m[2]!, content: m[3]! } : null;
  }).filter((m): m is ChatMessage => m !== null);
}

function toUniformFormat(msgs: ChatMessage[]): string {
  return msgs.map(m => `[${m.time}] [${m.speaker}]: ${m.content}`).join('\n');
}

function splitByWindow(text: string, windowMin: number, overlapMin: number): string[] {
  const lines = text.split('\n');
  if (lines.length <= 50) return [text];
  const chunkSize = Math.max(20, Math.ceil(lines.length / Math.ceil(lines.length / 50)));
  const step = Math.max(1, chunkSize - Math.ceil(chunkSize * overlapMin / windowMin));
  const segments: string[] = [];
  for (let i = 0; i < lines.length; i += step) {
    segments.push(lines.slice(i, i + chunkSize).join('\n'));
  }
  return segments.filter(s => s.trim());
}

const TIME_WINDOW = 30;
const OVERLAP = 5;

export async function parseChat(inputFile: InputFile): Promise<ParsedInput[]> {
  const ext = extname(inputFile.path).toLowerCase();
  if (ext !== '.json' && ext !== '.txt') {
    throw new Error(`Unsupported chat format: ${ext}`);
  }

  const raw = readFileSync(inputFile.path, 'utf-8');
  const format = detectChatFormat(raw);

  let messages: ChatMessage[];
  switch (format) {
    case 'feishu': messages = parseFeishu(raw); break;
    case 'slack': messages = parseSlack(raw); break;
    case 'wechat': messages = parseWechat(raw); break;
    default: messages = parseGeneric(raw);
  }

  if (messages.length === 0) {
    return [{
      source: inputFile, transcript: raw,
      metadata: { format, messageCount: 0, warning: 'Could not parse messages' },
    }];
  }

  const uniform = toUniformFormat(messages);
  const segments = splitByWindow(uniform, TIME_WINDOW, OVERLAP);

  return segments.map((transcript, i) => ({
    source: inputFile, transcript,
    metadata: { format, segmentIndex: i, totalSegments: segments.length, messageCount: messages.length },
  }));
}
