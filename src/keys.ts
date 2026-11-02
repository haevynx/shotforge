// API keys are stored on the user's machine only and sent to nothing but the matching provider.
// Lookup order: environment variable → ~/.config/shotforge/credentials.json (mode 600).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const PROVIDERS = {
  claude: {label: 'Anthropic Claude', env: ['ANTHROPIC_API_KEY']},
  openai: {label: 'OpenAI', env: ['OPENAI_API_KEY']},
  gemini: {label: 'Google Gemini', env: ['GEMINI_API_KEY', 'GOOGLE_API_KEY']},
  grok: {label: 'xAI Grok', env: ['XAI_API_KEY']},
} as const;

export type ProviderId = keyof typeof PROVIDERS;

export function isProvider(p: string): p is ProviderId {
  return p in PROVIDERS;
}

const dir = () => path.join(process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), '.config'), 'shotforge');
const file = () => path.join(dir(), 'credentials.json');

function readStore(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(file(), 'utf8'));
  } catch {
    return {};
  }
}

function writeStore(s: Record<string, string>) {
  fs.mkdirSync(dir(), {recursive: true, mode: 0o700});
  fs.writeFileSync(file(), JSON.stringify(s, null, 2), {mode: 0o600});
  fs.chmodSync(file(), 0o600);
}

export function getKey(p: ProviderId): string | undefined {
  for (const e of PROVIDERS[p].env) if (process.env[e]) return process.env[e];
  return readStore()[p];
}

export function keySource(p: ProviderId): string | undefined {
  for (const e of PROVIDERS[p].env) if (process.env[e]) return `env ${e}`;
  return readStore()[p] ? file() : undefined;
}

export function setKey(p: ProviderId, key: string) {
  writeStore({...readStore(), [p]: key.trim()});
}

export function removeKey(p: ProviderId) {
  const s = readStore();
  delete s[p];
  writeStore(s);
}

export const mask = (k: string) => (k.length <= 10 ? '••••' : `${k.slice(0, 6)}…${k.slice(-4)}`);

export function credentialsPath() {
  return file();
}
