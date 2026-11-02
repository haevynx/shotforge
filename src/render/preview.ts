// Preview page: lays the slides out in a horizontal strip, like a store listing.
import fs from 'node:fs';
import path from 'node:path';
import {escapeHtml} from '../markup.js';

export interface PreviewRow {
  title: string;
  subtitle?: string;
  files: string[];
}

export function writePreview(file: string, heading: string, rows: PreviewRow[]): string {
  const dir = path.dirname(file);
  const body = rows
    .map(
      r => `<section><h2>${escapeHtml(r.title)}${r.subtitle ? ` <span>${escapeHtml(r.subtitle)}</span>` : ''}</h2>
<div class="strip">${r.files.map(f => `<img src="${escapeHtml(path.relative(dir, f).split(path.sep).join('/'))}" loading="lazy">`).join('')}</div></section>`,
    )
    .join('\n');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(heading)}</title>
<style>
:root{color-scheme:light dark;--bg:#f4f4f6;--fg:#111;--mute:#666}
@media (prefers-color-scheme:dark){:root{--bg:#141417;--fg:#f2f2f5;--mute:#999}}
body{margin:0;padding:24px 16px 48px;background:var(--bg);color:var(--fg);font:15px/1.5 -apple-system,BlinkMacSystemFont,Inter,sans-serif}
h1{font-size:22px;margin:0 0 20px}
section{margin-bottom:32px}
h2{font-size:15px;margin:0 0 10px}
h2 span{color:var(--mute);font-weight:400}
.strip{display:flex;gap:10px;overflow-x:auto;padding-bottom:8px}
.strip img{height:min(62vh,560px);border-radius:14px;flex:none;box-shadow:0 2px 10px rgba(0,0,0,.12)}
</style></head><body><h1>${escapeHtml(heading)}</h1>${body}</body></html>`;
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(file, html);
  return file;
}
