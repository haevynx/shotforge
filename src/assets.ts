// Resolves image and asset references from the config into URLs the renderer can load:
//   "shots/home.png"         → project file, inlined as a data URI
//   "fluent:Hourglass done"  → Microsoft Fluent Emoji 3D icon (MIT) via CDN
//   "peep:Minh"              → Notionists illustration (CC0) via DiceBear
//   "https://..."            → used as-is
import fs from 'node:fs';
import path from 'node:path';

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
};

const FLUENT_BASE = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets';

export function fluentUrl(name: string): string {
  const file = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return `${FLUENT_BASE}/${encodeURIComponent(name)}/3D/${file}_3d.png`;
}

export function peepUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}`;
}

const cache = new Map<string, string>();

export function resolveRef(ref: string, baseDir: string): string {
  if (ref.startsWith('fluent:')) return fluentUrl(ref.slice(7).trim());
  if (ref.startsWith('peep:')) return peepUrl(ref.slice(5).trim());
  if (/^(https?:|data:)/.test(ref)) return ref;
  const abs = path.resolve(baseDir, ref);
  const hit = cache.get(abs);
  if (hit) return hit;
  if (!fs.existsSync(abs)) throw new Error(`Image not found: ${ref} (${abs})`);
  const mime = MIME[path.extname(abs).toLowerCase()];
  if (!mime) throw new Error(`Unsupported image format: ${ref}`);
  const uri = `data:${mime};base64,${fs.readFileSync(abs).toString('base64')}`;
  cache.set(abs, uri);
  return uri;
}

let fluentIndex: string[] | null = null;

async function githubTree(sha: string): Promise<{path: string; type: string; sha: string}[]> {
  const res = await fetch(`https://api.github.com/repos/microsoft/fluentui-emoji/git/trees/${sha}`, {headers: {accept: 'application/vnd.github+json'}});
  if (!res.ok) throw new Error(`Could not load the Fluent icon list (HTTP ${res.status})`);
  return ((await res.json()) as {tree: {path: string; type: string; sha: string}[]}).tree;
}

// Every sub-folder of assets/ in the Fluent Emoji repo is one icon. Loaded lazily.
export async function searchFluent(query: string, limit = 30): Promise<string[]> {
  if (!fluentIndex) {
    const assets = (await githubTree('main')).find(e => e.path === 'assets');
    if (!assets) throw new Error('Could not find the assets folder in the Fluent Emoji repo');
    fluentIndex = (await githubTree(assets.sha))
      .filter(e => e.type === 'tree')
      .map(e => e.path)
      .sort();
  }
  const q = query.toLowerCase();
  return fluentIndex.filter(n => n.toLowerCase().includes(q)).slice(0, limit);
}
