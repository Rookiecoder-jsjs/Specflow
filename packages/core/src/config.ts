import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const CONFIG_FILENAMES = ['specflow.config.json', 'config.json'] as const;

interface ApiKeysConfig {
  deepseekApiKey: string;
  dashscopeApiKey: string;
  deepseekBaseUrl: string;
  monthlyBudgetCNY: number;
  source: 'env' | 'file' | 'cli-neighbor';
}

let cachedKeys: ApiKeysConfig | null = null;
let explicitConfigPath: string | null = null;

function findConfigFile(startDir: string): string | null {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    for (const name of CONFIG_FILENAMES) {
      const candidate = join(dir, name);
      if (existsSync(candidate)) return candidate;
    }
    const parent = join(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function findConfigNearCli(): string | null {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    let dir = here;
    for (let i = 0; i < 6; i++) {
      for (const name of CONFIG_FILENAMES) {
        const candidate = join(dir, name);
        if (existsSync(candidate)) return candidate;
      }
      const parent = join(dir, '..');
      if (parent === dir) break;
      dir = parent;
    }
  } catch { /* import.meta.url not available */ }
  return null;
}

function loadFromFile(configPath: string, source: 'file' | 'cli-neighbor'): ApiKeysConfig {
  const raw = JSON.parse(readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
  const keys: ApiKeysConfig = {
    deepseekApiKey: String(raw['deepseekApiKey'] ?? ''),
    dashscopeApiKey: String(raw['dashscopeApiKey'] ?? ''),
    deepseekBaseUrl: String(raw['deepseekBaseUrl'] ?? 'https://api.deepseek.com/v1'),
    monthlyBudgetCNY: Number(raw['monthlyBudgetCNY'] ?? 100),
    source,
  };
  if (!keys.deepseekApiKey) {
    throw new Error(`"deepseekApiKey" is missing in ${configPath}`);
  }
  if (!keys.dashscopeApiKey) {
    throw new Error(`"dashscopeApiKey" is missing in ${configPath}`);
  }
  return keys;
}

/** Allow callers (e.g. CLI --config flag) to pin an exact config path. */
export function setExplicitConfigPath(path: string | null): void {
  explicitConfigPath = path;
  cachedKeys = null;
}

export function loadApiKeys(projectRoot: string): ApiKeysConfig {
  if (cachedKeys) return cachedKeys;

  // Priority 0: explicit --config flag (set via setExplicitConfigPath)
  if (explicitConfigPath && existsSync(explicitConfigPath)) {
    cachedKeys = loadFromFile(explicitConfigPath, 'file');
    return cachedKeys;
  }

  // Priority 1: environment variables.
  const envDeepseek = process.env['DEEPSEEK_API_KEY']?.trim() ?? '';
  const envDashscope = process.env['DASHSCOPE_API_KEY']?.trim() ?? '';
  if (envDeepseek && envDashscope) {
    cachedKeys = {
      deepseekApiKey: envDeepseek,
      dashscopeApiKey: envDashscope,
      deepseekBaseUrl: process.env['DEEPSEEK_BASE_URL']?.trim() || 'https://api.deepseek.com/v1',
      monthlyBudgetCNY: Number(process.env['SPECFLOW_MONTHLY_BUDGET_CNY'] ?? 100),
      source: 'env',
    };
    return cachedKeys;
  }

  // Priority 2: config file in project root (walk up to 10 levels).
  const configPath = findConfigFile(projectRoot);
  if (configPath) {
    cachedKeys = loadFromFile(configPath, 'file');
    return cachedKeys;
  }

  // Priority 3: config file near the running CLI script (workspace root).
  // This makes `node /path/to/specflow/dist/cli.js` work without env vars
  // even when cwd is a completely different project.
  const cliNeighbor = findConfigNearCli();
  if (cliNeighbor) {
    cachedKeys = loadFromFile(cliNeighbor, 'cli-neighbor');
    return cachedKeys;
  }

  throw new Error(
    `API keys not configured.\n` +
    `Create specflow.config.json next to this CLI (or anywhere up to 10 levels above the project root):\n` +
    `{\n` +
    `  "deepseekApiKey": "sk-...",\n` +
    `  "dashscopeApiKey": "sk-...",\n` +
    `  "deepseekBaseUrl": "https://api.deepseek.com/v1",\n` +
    `  "monthlyBudgetCNY": 100\n` +
    `}\n` +
    `Or pass --config <path>, or set DEEPSEEK_API_KEY + DASHSCOPE_API_KEY env vars.\n` +
    `Add "specflow.config.json" to .gitignore.`
  );
}

function resolveProjectRoot(): string {
  return process.env['SPECFLOW_PROJECT_ROOT'] ?? process.cwd();
}

export function getDeepSeekApiKey(): string {
  return loadApiKeys(resolveProjectRoot()).deepseekApiKey;
}

export function getDashScopeApiKey(): string {
  return loadApiKeys(resolveProjectRoot()).dashscopeApiKey;
}

export function getDeepSeekBaseUrl(): string {
  return loadApiKeys(resolveProjectRoot()).deepseekBaseUrl;
}

export function getMonthlyBudget(): number {
  return loadApiKeys(resolveProjectRoot()).monthlyBudgetCNY;
}

/** Test helper: clear the cached config so the next loadApiKeys() re-reads from env/disk. */
export function resetApiKeysCache(): void {
  cachedKeys = null;
}
