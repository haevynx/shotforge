// Builds one self-contained HTML page per slide, ready to be captured as an image.
import {resolveRef} from '../assets.js';
import type {Config, LocalizedText} from '../config.js';
import {localize} from '../config.js';
import {getLayout, SPAN_INTRUSION, type LayoutResult} from '../layouts/index.js';
import {inline} from '../markup.js';
import {DESIGN_W, designHeight, viewportOf, type Target} from '../targets.js';
import {getTheme} from '../themes/index.js';
import type {Brand, Ctx, Theme} from './types.js';

export interface DeckOptions {
  config: Config;
  baseDir: string;
  target: Target;
  locale: string;
  /** Overrides the configured theme (used by the gallery command) */
  themeId?: string;
}

function fontsLink(theme: Theme, brand: Brand): string {
  const families = [...theme.fonts];
  if (brand.font) families.push(`${brand.font}:wght@400;500;600;700;800;900`);
  const q = families.map(f => `family=${f.replace(/ /g, '+')}`).join('&');
  return `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${q}&display=swap">`;
}

export function resolveBrand(config: Config): Brand {
  return {primary: config.brand.primary, accent: config.brand.accent ?? '#ffb800', font: config.brand.font};
}

export function buildDeck(o: DeckOptions): string[] {
  const {config, baseDir, target, locale} = o;
  const theme = getTheme(o.themeId ?? config.theme);
  const brand = resolveBrand(config);
  const H = designHeight(target);
  const n = config.slides.length;
  const fallback = config.locales[0];

  const ctxs: Ctx[] = config.slides.map((slide, i) => {
    return {
      config,
      slide,
      i,
      n,
      W: DESIGN_W,
      H,
      locale,
      target,
      theme,
      brand,
      spanIn: i > 0 && config.slides[i - 1].layout === 'span' ? SPAN_INTRUSION : 0,
      t: (x: LocalizedText | undefined) => inline(localize(x, locale, fallback)),
      src: (x: LocalizedText | undefined) => resolveRef(localize(x, locale, fallback), baseDir),
    };
  });

  const results: LayoutResult[] = ctxs.map(c => getLayout(c.slide.layout ?? theme.defaultLayout ?? 'hero')(c));
  const strip = results.map(r => r.strip ?? '').join('');
  const vp = viewportOf(target);

  return ctxs.map((c, i) => {
    const pano = theme.pano?.(c) ?? '';
    const bg = c.slide.background ?? theme.bg(c);
    return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8">${fontsLink(theme, brand)}
<style>
html,body{margin:0;padding:0;width:${vp.width}px;height:${vp.height}px;overflow:hidden;background:#000}
.stage{position:absolute;left:0;top:0;width:${DESIGN_W}px;height:${H}px;transform:scale(${vp.width / DESIGN_W});transform-origin:0 0;overflow:hidden;font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.ab{position:absolute}
.hl em{${theme.em(c)}}
.hl strong{${theme.strong?.(c) ?? 'font-weight:800'}}
</style></head><body>
<div class="stage" style="background:${bg}">
  ${theme.overlay?.(c) ?? ''}
  <div class="ab" style="left:${-i * DESIGN_W}px;top:0;width:${n * DESIGN_W}px;height:${H}px;z-index:1">${pano}${strip}</div>
  ${results[i].html}
</div></body></html>`;
  });
}
