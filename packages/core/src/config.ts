import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const CONFIG_FILENAME = 'specflow.config.json';

interface ApiKeysConfig {
  deepseekApiKey: string;
  dashscopeApiKey: string;
  deepseekBaseUrl: string;
  monthlyBudgetCNY: number;
}

let cachedKeys: ApiKeysConfig | null = null;

function findConfigFile(startDir: string): string | null {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, CONFIG_FILENAME);
    if (existsSync(candidate)) return candidate;
    const parent = join(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export function loadApiKeys(projectRoot: string): ApiKeysConfig {
  if (cachedKeys) return cachedKeys;

  const configPath = findConfigFile(projectRoot);

  if (!configPath) {
    throw new Error(
      `Config file "${CONFIG_FILENAME}" not found.\n` +
      `Create it in your project root:\n\n` +
      `{\n` +
      `  "deepseekApiKey": "sk-...",\n` +
      `  "dashscopeApiKey": "sk-...",\n` +
      `  "deepseekBaseUrl": "https://api.deepseek.com/v1",\n` +
      `  "monthlyBudgetCNY": 100\n` +
      `}\n\n` +
      `Then add "${CONFIG_FILENAME}" to .gitignore.`
    );
  }

  const raw = JSON.parse(readFileSync(configPath, 'utf-8')) as Record<string, unknown>;

  const keys: ApiKeysConfig = {
    deepseekApiKey: String(raw['deepseekApiKey'] ?? ''),
    dashscopeApiKey: String(raw['dashscopeApiKey'] ?? ''),
    deepseekBaseUrl: String(raw['deepseekBaseUrl'] ?? 'https://api.deepseek.com/v1'),
    monthlyBudgetCNY: Number(raw['monthlyBudgetCNY'] ?? 100),
  };

  if (!keys.deepseekApiKey) {
    throw new Error(`"deepseekApiKey" is missing in ${configPath}`);
  }
  if (!keys.dashscopeApiKey) {
    throw new Error(`"dashscopeApiKey" is missing in ${configPath}`);
  }

  cachedKeys = keys;
  return keys;
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
