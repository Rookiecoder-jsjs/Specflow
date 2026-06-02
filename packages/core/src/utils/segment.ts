export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export function splitByLength(text: string, maxLen: number): string[] {
  const result: string[] = [];
  let current = '';
  const sentences = text.split(/(?<=[。.!?！？\n])/);
  for (const s of sentences) {
    if (current.length + s.length > maxLen && current.length > 0) {
      result.push(current.trim());
      current = '';
    }
    current += s;
  }
  if (current.trim()) result.push(current.trim());
  return result.length > 0 ? result : [text];
}

export function splitByHeadings(text: string, maxLen: number): string[] {
  const blocks = text.split(/(?=^#{1,6}\s)/m);
  const result: string[] = [];
  let current = '';
  for (const block of blocks) {
    if (current.length + block.length > maxLen && current.length > 0) {
      result.push(current.trim());
      current = '';
    }
    current += block;
  }
  if (current.trim()) result.push(current.trim());
  return result.length > 0 ? result : [text];
}

export function sliceBySemanticBreaks(text: string, maxLen: number, _overlap: number): string[] {
  const paragraphs = text.split(/\n{2,}/);
  const result: string[] = [];
  let current = '';
  for (const p of paragraphs) {
    if (current.length + p.length > maxLen && current.length > 0) {
      result.push(current.trim());
      current = p;
    } else {
      current += (current ? '\n\n' : '') + p;
    }
  }
  if (current.trim()) result.push(current.trim());
  return result.length > 0 ? result : [text];
}
