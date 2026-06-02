import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join, relative, basename, extname } from 'path';
import type { InputFile, ParsedInput } from '../types.js';

// ── Constants ──────────────────────────────────────────────────────────────

const SKIP_DIRS = new Set([
  'node_modules', '.venv', 'venv', '.git', 'dist', 'build',
  'coverage', '__pycache__', '.next', '.turbo', '.cache', 'target',
]);

const MANIFEST_LABELS: Record<string, string> = {
  'package.json': 'Node.js / TypeScript',
  'tsconfig.json': 'TypeScript',
  'pyproject.toml': 'Python',
  'requirements.txt': 'Python',
  'setup.py': 'Python',
  'go.mod': 'Go',
  'Cargo.toml': 'Rust',
  'pom.xml': 'Java (Maven)',
  'build.gradle': 'Java/Kotlin (Gradle)',
  'build.gradle.kts': 'Kotlin (Gradle)',
};

const SRC_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.kt']);

const MAX_FILES = 100;
const MAX_DEPTH = 4;

// ── Export Extraction ──────────────────────────────────────────────────────

const EXPORT_RE: Record<string, RegExp> = {
  '.ts': /^\s*export\s+(default\s+)?(function|class|interface|type|const|let|var|enum|abstract\s+class)\s+(\w+)/,
  '.tsx': /^\s*export\s+(default\s+)?(function|class|interface|type|const|let|var|enum|abstract\s+class)\s+(\w+)/,
  '.js': /^\s*export\s+(default\s+)?(function|class|interface|type|const|let|var|enum|abstract\s+class)\s+(\w+)/,
  '.jsx': /^\s*export\s+(default\s+)?(function|class|interface|type|const|let|var|enum|abstract\s+class)\s+(\w+)/,
  '.py': /^\s*(def|class)\s+(\w+)/,
  '.go': /^\s*(func|type)\s+(\w+)/,
  '.rs': /^\s*(pub\s+)?(fn|struct|enum|trait|impl|type|mod)\s+(\w+)/,
  '.java': /^\s*(public|private|protected)\s+(class|interface|enum)\s+(\w+)/,
  '.kt': /^\s*(fun|class|interface|object|data\s+class|sealed\s+class)\s+(\w+)/,
};

function extractExports(filePath: string, lines: string[]): string[] {
  const re = EXPORT_RE[extname(filePath)];
  if (!re) return [];
  const result: string[] = [];
  for (const line of lines) {
    const m = line.match(re);
    if (m) {
      result.push(m[0].trim());
      if (result.length >= 15) break;
    }
  }
  return result;
}

// ── Path Classification ────────────────────────────────────────────────────

function matchPath(rel: string, pattern: string): boolean {
  const lower = rel.replace(/\\/g, '/').toLowerCase();
  return lower.startsWith(`${pattern}/`) || lower.includes(`/${pattern}/`);
}

function isDataModelPath(rel: string): boolean {
  return matchPath(rel, 'models') || matchPath(rel, 'entities') ||
    matchPath(rel, 'schema') || matchPath(rel, 'migrations') ||
    matchPath(rel, 'prisma') || rel.toLowerCase().endsWith('.prisma');
}

function isApiRoutePath(rel: string): boolean {
  return matchPath(rel, 'routes') || matchPath(rel, 'controllers') ||
    matchPath(rel, 'endpoints') || matchPath(rel, 'api') || matchPath(rel, 'routers');
}

function isConfigFile(rel: string): boolean {
  const name = basename(rel);
  return name.startsWith('.env') || name.startsWith('config.') ||
    name === 'application.yml' || name === 'application.properties' ||
    name === 'Dockerfile' || name.includes('docker-compose') ||
    name === 'Makefile' || name === 'settings.py';
}

// ── Tree Gathering ─────────────────────────────────────────────────────────

function gatherTree(root: string, depth: number): string[] {
  if (depth > 3) return [];
  const lines: string[] = [];
  let entries: string[] = [];
  try { entries = readdirSync(root); } catch { return lines; }
  for (const name of entries.sort()) {
    if (SKIP_DIRS.has(name)) continue;
    if (name.startsWith('.')) continue;
    const full = join(root, name);
    let isDir = false;
    try { isDir = statSync(full).isDirectory(); } catch { continue; }
    const indent = '  '.repeat(depth);
    lines.push(isDir ? `${indent}${name}/` : `${indent}${name}`);
    if (isDir) lines.push(...gatherTree(full, depth + 1));
  }
  return lines;
}

// ── File Info ──────────────────────────────────────────────────────────────

interface FileInfo {
  path: string;
  exports: string[];
  lines: number;
}

// ── Main Scanner ───────────────────────────────────────────────────────────

interface ScanResult {
  tech: string[];
  tree: string[];
  files: FileInfo[];
  models: string[];
  routes: string[];
  configs: string[];
  scripts: Record<string, string>;
}

function scan(root: string): ScanResult {
  const res: ScanResult = {
    tech: [], tree: [], files: [], models: [], routes: [], configs: [], scripts: {},
  };

  // Detect tech stack
  for (const [file, label] of Object.entries(MANIFEST_LABELS)) {
    if (existsSync(join(root, file)) && !res.tech.includes(label)) {
      res.tech.push(label);
    }
  }

  // Extract package.json scripts
  const pkgPath = join(root, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      if (pkg.scripts) Object.assign(res.scripts, pkg.scripts);
    } catch { /* corrupt json */ }
  }

  // Directory tree
  res.tree = gatherTree(root, 0);

  // Recursive walk
  const walk = (dir: string, depth: number) => {
    if (depth > MAX_DEPTH || res.files.length >= MAX_FILES) return;
    let entries: string[] = [];
    try { entries = readdirSync(dir); } catch { return; }
    for (const name of entries) {
      if (SKIP_DIRS.has(name) || res.files.length >= MAX_FILES) continue;
      const full = join(dir, name);
      const rel = relative(root, full);
      let isDir = false;
      try { isDir = statSync(full).isDirectory(); } catch { continue; }
      if (isDir) {
        walk(full, depth + 1);
      } else {
        if (isDataModelPath(rel)) res.models.push(rel);
        if (isApiRoutePath(rel)) res.routes.push(rel);
        if (isConfigFile(rel)) res.configs.push(rel);
        const ext = extname(name).toLowerCase();
        if (SRC_EXTS.has(ext) && res.files.length < MAX_FILES) {
          try {
            const content = readFileSync(full, 'utf-8');
            const lines = content.split('\n');
            res.files.push({
              path: rel, lines: lines.length,
              exports: extractExports(full, lines),
            });
          } catch { /* binary or permission error */ }
        }
      }
    }
  };
  walk(root, 0);
  return res;
}

// ── Transcript Builder ─────────────────────────────────────────────────────

function buildTranscript(r: ScanResult): string {
  const out: string[] = [];

  out.push('# Project Scan\n');

  out.push('## Tech Stack\n');
  out.push(r.tech.length ? r.tech.map(t => `- ${t}`).join('\n') : '- (none detected)');
  out.push('');

  out.push('## Directory Structure\n');
  out.push('```');
  out.push(...r.tree);
  out.push('```\n');

  out.push('## Source Files\n');
  out.push(r.files.length
    ? `Analyzed ${r.files.length} source files:\n`
    : 'No source files found.\n');
  for (const f of r.files) {
    out.push(`### \`${f.path}\` (${f.lines} lines)\n`);
    if (f.exports.length) {
      out.push('Exports:');
      for (const e of f.exports) out.push(`- \`${e}\``);
      out.push('');
    }
  }

  if (r.models.length) {
    out.push('## Data Models\n');
    for (const m of r.models) out.push(`- \`${m}\``);
    out.push('');
  }

  if (r.routes.length) {
    out.push('## API Routes / Endpoints\n');
    for (const rt of r.routes) out.push(`- \`${rt}\``);
    out.push('');
  }

  if (r.configs.length) {
    out.push('## Configuration Files\n');
    for (const c of r.configs) out.push(`- \`${c}\``);
    out.push('');
  }

  if (Object.keys(r.scripts).length) {
    out.push('## Build / Test / Dev Commands\n');
    out.push('(from package.json scripts)\n');
    for (const [name, cmd] of Object.entries(r.scripts)) {
      out.push(`- \`${name}\`: \`${cmd}\``);
    }
    out.push('');
  }

  return out.join('\n');
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function parseProject(inputFile: InputFile): Promise<ParsedInput[]> {
  const root = inputFile.path;
  const r = scan(root);
  const transcript = buildTranscript(r);

  return [{
    source: inputFile,
    transcript,
    metadata: {
      projectRoot: root,
      techStack: r.tech,
      fileCount: r.files.length,
      modelCount: r.models.length,
      routeCount: r.routes.length,
      configCount: r.configs.length,
      scripts: r.scripts,
    },
  }];
}
