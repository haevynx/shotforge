// Renders every theme with its own sample app (examples/showcase/showcase.json) and
// composes the grid image used in the README: docs/images/themes.jpg.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseConfig} from '../src/config.js';
import {launchBrowser, renderDeck} from '../src/render/export.js';
import {TARGETS, type Target} from '../src/targets.js';
import {getTheme} from '../src/themes/index.js';

interface Entry {
  theme: string;
  app: string;
  brand: {primary: string; accent?: string};
  slides: unknown[];
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'examples/showcase');
const entries = JSON.parse(fs.readFileSync(path.join(dir, 'showcase.json'), 'utf8')) as Entry[];

// Small, crisp thumbnails: the 6.9" ratio at 2x of a 220px wide slide.
const thumb: Target = {...TARGETS['ios-6.9'], id: 'thumb', w: 440, h: 956, scale: 2};

const browser = await launchBrowser();
const blocks: string[] = [];
try {
  for (const e of entries) {
    const config = parseConfig({app: {name: e.app}, theme: e.theme, brand: e.brand, locales: ['en'], slides: e.slides, output: 'out'});
    const files = await renderDeck({config, baseDir: dir, customTarget: thumb, outDir: path.join('out', e.theme), format: 'jpg', browser});
    const imgs = files.map(f => `<img src="data:image/jpeg;base64,${fs.readFileSync(f).toString('base64')}">`).join('');
    blocks.push(`<figure><figcaption><b>${getTheme(e.theme).name}</b><span>${e.theme} · ${e.app}</span></figcaption><div>${imgs}</div></figure>`);
    process.stdout.write(`${e.theme} `);
  }

  const page = await browser.newPage({viewport: {width: 1720, height: 800}, deviceScaleFactor: 1});
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700&display=swap" rel="stylesheet">
<style>
body{margin:0;padding:28px;background:#0d1117;color:#e6edf3;font-family:Inter,sans-serif;display:grid;grid-template-columns:repeat(3,1fr);gap:30px 24px}
figure{margin:0}
figcaption{display:flex;align-items:baseline;gap:10px;margin:0 0 10px 2px}
figcaption b{font-size:17px}
figcaption span{font-size:13px;color:#8b949e}
figure div{display:flex;gap:6px}
img{width:calc((100% - 12px)/3);border-radius:8px;display:block}
</style></head><body>${blocks.join('')}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  const out = path.join(root, 'docs/images/themes.jpg');
  await page.screenshot({path: out, fullPage: true, type: 'jpeg', quality: 86});
  console.log(`\n✓ ${path.relative(root, out)}`);
} finally {
  await browser.close();
}
