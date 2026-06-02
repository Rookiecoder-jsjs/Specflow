import { readFileSync } from 'fs';
import { extname } from 'path';
import type { InputFile, ParsedInput } from '../types.js';
import { DashScopeClient } from '../llm/dashscope.js';
import { sliceBySemanticBreaks } from '../utils/segment.js';

const SUPPORTED = ['.m4a', '.mp3', '.wav', '.aac', '.flac', '.ogg', '.webm'];
const MAX_SIZE = 10 * 1024 * 1024;

export async function parseAudio(inputFile: InputFile): Promise<ParsedInput[]> {
  const ext = extname(inputFile.path).toLowerCase();
  if (!SUPPORTED.includes(ext)) {
    throw new Error(`Unsupported audio format: ${ext}`);
  }

  const buffer = readFileSync(inputFile.path);
  if (buffer.length > MAX_SIZE) {
    const sizeMB = (buffer.length / 1024 / 1024).toFixed(1);
    throw new Error(
      `Audio file exceeds 10MB limit (${sizeMB}MB). ` +
      `Compress the audio, upload to OSS and provide URL, or use a smaller file.`
    );
  }

  const kind = ext.slice(1);
  const dataUrl = `data:audio/${kind};base64,${buffer.toString('base64')}`;

  let ffmpegOk = false;
  try {
    const { execSync } = require('child_process') as typeof import('child_process');
    execSync('ffmpeg -version', { stdio: 'ignore' });
    ffmpegOk = true;
  } catch { /* ffmpeg not found */ }

  const client = DashScopeClient.fromEnv();
  const result = await client.transcribe(dataUrl);

  if (!result.text.trim()) {
    return [{
      source: inputFile,
      transcript: '',
      metadata: { warning: 'ASR returned empty transcription' },
    }];
  }

  const segments = sliceBySemanticBreaks(result.text, 4000, 200);

  return segments.map((transcript, i) => ({
    source: inputFile,
    transcript,
    metadata: {
      segmentIndex: i,
      totalSegments: segments.length,
      duration: result.duration,
      ffmpegAvailable: ffmpegOk,
    },
  }));
}
