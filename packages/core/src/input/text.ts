import { readFileSync } from 'fs';
import { extname } from 'path';
import type { InputFile, ParsedInput } from '../types.js';
import { splitByHeadings, splitByLength } from '../utils/segment.js';

export async function parseText(inputFile: InputFile): Promise<ParsedInput[]> {
  const ext = extname(inputFile.path).toLowerCase();
  let rawText: string;

  switch (ext) {
    case '.md':
    case '.txt':
      rawText = readFileSync(inputFile.path, 'utf-8');
      break;
    case '.pdf': {
      const pdfParse = await import('pdf-parse').catch(() => null);
      if (!pdfParse) throw new Error('pdf-parse is not installed. Run: npm install pdf-parse');
      const buf = readFileSync(inputFile.path);
      const data = await pdfParse.default(buf);
      rawText = data.text;
      break;
    }
    case '.docx': {
      const mammoth = await import('mammoth').catch(() => null);
      if (!mammoth) throw new Error('mammoth is not installed. Run: npm install mammoth');
      const buf = readFileSync(inputFile.path);
      const result = await mammoth.extractRawText({ buffer: buf });
      rawText = result.value;
      break;
    }
    default:
      throw new Error(`Unsupported text format: ${ext}`);
  }

  if (!rawText.trim()) {
    return [{ source: inputFile, transcript: '', metadata: { warning: 'Empty document' } }];
  }

  const segments = (ext === '.md' || ext === '.txt')
    ? splitByHeadings(rawText, 4000)
    : splitByLength(rawText, 4000);

  return segments.map((transcript, i) => ({
    source: inputFile,
    transcript,
    metadata: { segmentIndex: i, totalSegments: segments.length, format: ext },
  }));
}
