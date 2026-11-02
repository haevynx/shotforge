// Captures every slide page at the exact store size with Chrome (via Playwright).
import fs from 'node:fs';
import path from 'node:path';
import {chromium, type Browser} from 'playwright-core';
import type {Config} from '../config.js';
import {getTarget, viewportOf, type Target} from '../targets.js';
import {buildDeck} from './document.js';
import {pngSize, stripAlpha} from './png.js';

export async function launchBrowser(): Promise<Browser> {
  const attempts: [string, () => Promise<Browser>][] = [
    ['installed Chrome', () => chromium.launch({channel: 'chrome'})],
    ['Playwright Chromium', () => chromium.launch()],
    ['Microsoft Edge', () => chromium.launch({channel: 'msedge'})],
  ];
  const errors: string[] = [];
  for (const [name, fn] of attempts) {
    try {
      return await fn();
    } catch (e) {
      errors.push(`${name}: ${(e as Error).message.split('\n')[0]}`);
    }
  }
  throw new Error(`Could not launch a browser for rendering.\nInstall Google Chrome, or run: npx playwright install chromium\n${errors.join('\n')}`);
}

export interface RenderOptions {
  config: Config;
  baseDir: string;
  targets?: string[];
  locales?: string[];
  format?: 'png' | 'jpg';
  outDir?: string;
  themeId?: string;
  onFile?: (file: string) => void;
  browser?: Browser;
  /** Overrides the targets, e.g. small images for the gallery */
  customTarget?: Target;
}

export async function renderDeck(o: RenderOptions): Promise<string[]> {
  const format = o.format ?? 'png';
  const outDir = path.resolve(o.baseDir, o.outDir ?? o.config.output);
  const targets = o.customTarget ? [o.customTarget] : (o.targets ?? o.config.targets).map(getTarget);
  const locales = o.locales ?? o.config.locales;
  const browser = o.browser ?? (await launchBrowser());
  const files: string[] = [];
  try {
    for (const target of targets) {
      const vp = viewportOf(target);
      const context = await browser.newContext({viewport: vp, deviceScaleFactor: target.scale});
      const page = await context.newPage();
      for (const locale of locales) {
        const docs = buildDeck({config: o.config, baseDir: o.baseDir, target, locale, themeId: o.themeId});
        const dir = path.join(outDir, target.id, locale);
        fs.mkdirSync(dir, {recursive: true});
        for (let i = 0; i < docs.length; i++) {
          await page.setContent(docs[i], {waitUntil: 'networkidle', timeout: 60_000});
          await page.evaluate(async () => {
            await document.fonts.ready;
            await Promise.all([...document.images].map(img => (img.complete ? null : new Promise(r => ((img.onload = r), (img.onerror = r))))));
          });
          const file = path.join(dir, `${String(i + 1).padStart(2, '0')}.${format}`);
          if (format === 'jpg') {
            await page.screenshot({path: file, type: 'jpeg', quality: 95});
          } else {
            const png = stripAlpha(await page.screenshot({type: 'png'}));
            const {width, height} = pngSize(png);
            if (width !== target.w || height !== target.h) {
              throw new Error(`Rendered ${width}×${height}, expected ${target.w}×${target.h} (${target.id})`);
            }
            fs.writeFileSync(file, png);
          }
          files.push(file);
          o.onFile?.(file);
        }
      }
      await context.close();
    }
  } finally {
    if (!o.browser) await browser.close();
  }
  return files;
}
