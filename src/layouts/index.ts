// A layout is the composition of one slide. Good sets change layout from slide to slide:
// open with hero/awards, use callouts/tilted/span in the middle, close with quote/stat.
import {lighten, mix, onColor} from '../color.js';
import {localize} from '../config.js';
import {assetImg, award, floatCard, iconChip, phone, stars} from '../render/parts.js';
import type {Ctx} from '../render/types.js';

export interface LayoutResult {
  html: string;
  /** Element drawn on the whole strip (coordinates start at the first slide), used by layouts that bleed into the next slide */
  strip?: string;
}

type Layout = (ctx: Ctx) => LayoutResult;

const sub = (c: Ctx) => c.theme.sub?.(c) ?? c.theme.ink(c);

export function headline(c: Ctx, o: {top?: number; size?: number; align?: 'left' | 'center'; color?: string; side?: number} = {}): string {
  const h = c.theme.headline;
  const title = c.t(c.slide.title);
  const label = c.t(c.slide.label);
  const subtitle = c.t(c.slide.subtitle);
  if (!title && !label && !subtitle) return '';
  // Slide right after a span layout: push the text right, away from the device bleeding in
  const align = c.spanIn ? 'left' : (o.align ?? h.align);
  const color = o.color ?? c.theme.ink(c);
  const side = o.side ?? 26;
  const style = [
    `left:${c.spanIn ? c.spanIn + 12 : side}px`,
    `right:${c.spanIn ? 14 : side}px`,
    `top:${o.top ?? h.top ?? 50}px`,
    `text-align:${align}`,
    `color:${color}`,
    `font-family:'${c.brand.font ?? h.font}',sans-serif`,
    `font-size:${(o.size ?? h.size) * (c.spanIn ? 0.82 : 1)}px`,
    `font-weight:${h.weight}`,
    `line-height:${h.lineHeight ?? 1.08}`,
    `letter-spacing:${h.tracking ?? '-0.025em'}`,
    h.upper ? 'text-transform:uppercase' : '',
    'z-index:5',
  ].join(';');
  return `<div class="ab hl" style="${style}">
    ${label ? `<div style="font:600 9.5px Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:${sub(c)};margin-bottom:8px">${label}</div>` : ''}
    ${title}
    ${subtitle ? `<div style="font:500 13px/1.35 Inter,sans-serif;letter-spacing:0;text-transform:none;margin-top:8px;color:${sub(c)};opacity:${c.theme.sub ? 1 : 0.75}">${subtitle}</div>` : ''}
  </div>`;
}

function footnote(c: Ctx): string {
  const f = c.t(c.slide.footnote);
  if (!f) return '';
  return `<div class="ab" style="left:20px;right:20px;bottom:14px;text-align:center;color:${sub(c)};opacity:.55;font:400 7.5px/1.4 Inter,sans-serif;z-index:9">${f}</div>`;
}

function extras(c: Ctx): string {
  return (c.slide.assets ?? []).map(a => assetImg(c.src(a.src), {x: a.x, y: a.y, size: a.size, rotate: a.rotate})).join('');
}

const shot = (c: Ctx) => c.src(c.slide.screenshot);

const hero: Layout = c => ({html: headline(c) + (c.slide.screenshot ? phone(c, shot(c)) : '') + extras(c) + footnote(c)});

const tilted: Layout = c => {
  const w = 270;
  return {
    html: headline(c, {side: 26}) + phone(c, shot(c), {width: w, x: c.W - w + 10, y: (c.theme.device.y ?? 170) + 10, rotate: 7}) + extras(c) + footnote(c),
  };
};

const callouts: Layout = c => {
  const y = c.theme.device.y ?? 180;
  const card = c.theme.card?.(c) ?? {bg: '#ffffff', ink: '#111111'};
  const pos = [
    {x: 12, y: y + 30},
    {x: c.W - 212, y: y + 105},
    {x: 18, y: y + 180},
    {x: c.W - 212, y: y + 255},
  ];
  const palette = [c.brand.primary, c.brand.accent, mix(c.brand.primary, c.brand.accent, 0.5), lighten(c.brand.primary, 0.3)];
  const cards = (c.slide.callouts ?? [])
    .map((k, n) => {
      const color = k.color ?? palette[n % palette.length];
      const s = c.t(k.sub);
      const body = `<div style="display:flex;align-items:center;gap:10px">${iconChip(k.icon ?? 'check', color, onColor(color))}<div><b style="font:700 12.5px/1.25 Inter,sans-serif;display:block">${c.t(k.title)}</b>${s ? `<span style="font:500 9.5px Inter,sans-serif;opacity:.6">${s}</span>` : ''}</div></div>`;
      return floatCard(body, {...pos[n], w: 200, bg: card.bg, ink: card.ink});
    })
    .join('');
  return {html: headline(c) + phone(c, shot(c)) + cards + extras(c) + footnote(c)};
};

const caption: Layout = c => {
  const palette = [c.brand.primary, c.brand.accent, mix(c.brand.primary, c.brand.accent, 0.5)];
  const color = c.slide.background ?? palette[c.i % palette.length];
  const blockH = 150;
  const title = c.t(c.slide.title);
  const h = c.theme.headline;
  return {
    html:
      `<div class="ab" style="left:10px;right:10px;top:10px;bottom:${blockH + 20}px;border-radius:24px;overflow:hidden;border:1px solid #eee;z-index:2"><img src="${shot(c)}" style="display:block;width:100%"></div>` +
      `<div class="ab hl" style="left:10px;right:10px;bottom:10px;height:${blockH}px;border-radius:24px;background:${color};display:flex;align-items:center;justify-content:center;text-align:center;padding:0 18px;box-sizing:border-box;color:${onColor(color)};font:${h.weight} ${h.size}px/${h.lineHeight ?? 1.1} '${c.brand.font ?? h.font}',sans-serif;z-index:3">${title}</div>`,
  };
};

const awards: Layout = c => {
  const ink = c.theme.ink(c);
  const lines = (c.slide.awards ?? []).map(a => `<div style="margin-top:16px">${award(c.t(a), ink, 10)}</div>`).join('');
  const r = c.slide.rating;
  const rating = r
    ? `<div style="margin-top:22px;text-align:center;color:${ink}"><div style="font:800 26px Inter,sans-serif;letter-spacing:-.02em">${r.score} <span style="vertical-align:3px">${stars(ink, 5, 15)}</span></div>${r.count ? `<div style="font:700 10px Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;margin-top:2px">${c.t(r.count)}</div>` : ''}</div>`
    : '';
  const p = c.slide.press;
  const press = p
    ? `<div style="margin-top:26px;text-align:center;color:${ink}"><div style="font:600 13px/1.35 Fraunces,serif;font-style:italic">“${c.t(p.quote)}”</div><div style="font:700 11px Inter,sans-serif;margin-top:6px;letter-spacing:.06em;text-transform:uppercase;opacity:.7">${p.source}</div></div>`
    : '';
  const logo = c.config.brand.logo
    ? `<img src="${c.src(c.config.brand.logo)}" style="width:64px;height:64px;border-radius:15px;display:block;margin:0 auto 14px;box-shadow:0 10px 24px rgba(0,0,0,.25)">`
    : '';
  const hasShot = Boolean(c.slide.screenshot);
  const top = hasShot ? 44 : c.H * 0.16;
  const block = `<div class="ab" style="left:20px;right:20px;top:${top}px;z-index:5;text-align:center">${logo}${headline(c, {align: 'center'})
    .replace('class="ab hl"', 'class="hl"')
    .replace(/left:\d+px;right:\d+px;top:[\d.]+px;/, 'position:relative;')}${rating}${lines}${press}</div>`;
  return {html: block + (hasShot ? phone(c, shot(c), {y: c.H * 0.58, width: 230}) : '') + extras(c) + footnote(c)};
};

const quote: Layout = c => {
  const q = c.slide.quote;
  const ink = c.theme.ink(c);
  const h = c.theme.headline;
  const hasShot = Boolean(c.slide.screenshot);
  const top = hasShot ? c.H * 0.47 : c.H * 0.3;
  const body = q
    ? `<div class="ab hl" style="left:24px;right:24px;top:${top}px;text-align:center;color:${ink};z-index:5"><div>${stars('#ffc94a', 5, 18)}</div><div style="font:${h.font === 'Inter' ? 700 : 400} ${Math.min(h.size + 4, 34)}px/1.08 '${h.font}',serif;margin:14px 0 10px;letter-spacing:-.01em">“${c.t(q.text)}”</div>${q.author ? `<div style="font:500 12px Inter,sans-serif;opacity:.7">${q.author}</div>` : ''}${c.slide.subtitle ? `<div style="font:500 11px Inter,sans-serif;opacity:.6;margin-top:26px">${c.t(c.slide.subtitle)}</div>` : ''}</div>`
    : '';
  return {html: (hasShot ? phone(c, shot(c), {y: -c.H * 0.4}) : '') + body + extras(c) + footnote(c)};
};

const object: Layout = c => {
  const free = c.W - c.spanIn;
  const size = Math.min(230, free - 20);
  const x0 = c.spanIn + (free - size) / 2;
  const asset = c.slide.asset ? assetImg(c.src(c.slide.asset), {x: x0, y: c.H * 0.3, size, rotate: -6}) : '';
  const shadow = `<div class="ab" style="left:${x0 + size * 0.1}px;width:${size * 0.8}px;top:${c.H * 0.3 + size - 10}px;height:36px;border-radius:50%;background:radial-gradient(rgba(0,0,0,.28),transparent 70%);z-index:2"></div>`;
  const btnW = Math.min(180, free - 30);
  const btn = c.slide.subtitle
    ? `<div class="ab" style="left:${c.spanIn + (free - btnW) / 2}px;width:${btnW}px;box-sizing:border-box;top:${c.H * 0.3 + size + 50}px;padding:12px;border-radius:24px;background:${c.theme.ink(c)};color:${onColor(c.theme.ink(c))};text-align:center;font:600 12px Inter,sans-serif;z-index:6">${c.t(c.slide.subtitle)}</div>`
    : '';
  // The subtitle is rendered as a pill button under the object, not under the headline
  const ctxNoSub = {...c, slide: {...c.slide, subtitle: undefined}};
  return {html: headline(ctxNoSub) + shadow + asset + btn + extras(c) + footnote(c)};
};

const stat: Layout = c => {
  const s = c.slide.stat;
  const ink = c.theme.ink(c);
  const big = s
    ? `<div class="ab hl" style="left:20px;right:20px;top:44px;text-align:center;color:${ink};z-index:5"><div style="font:900 64px/1 Inter,sans-serif;letter-spacing:-.04em">${s.value}</div>${s.label ? `<div style="font:600 13px Inter,sans-serif;margin-top:6px;opacity:.8">${c.t(s.label)}</div>` : ''}</div>`
    : '';
  const ctxNoTitle = {...c, slide: {...c.slide, title: undefined, label: undefined}};
  return {html: big + headline(ctxNoTitle, {top: 150}) + phone(c, shot(c), {y: 200}) + extras(c) + footnote(c)};
};

const duo: Layout = c => {
  const y = c.theme.device.y ?? 180;
  const back = c.slide.screenshot2 ? phone(c, c.src(c.slide.screenshot2), {x: 6, y: y + 40, width: 205, rotate: -6, z: 2}) : '';
  return {html: headline(c) + back + phone(c, shot(c), {x: c.W - 215, y, width: 205, rotate: 4, z: 3}) + extras(c) + footnote(c)};
};

// An oversized, tilted device that crosses into the next slide, so the two slides read as one
// when swiping through the store listing. Works best when the next slide is object or quote.
// The device tilts counter-clockwise so its top corner (where the next headline sits) intrudes
// the least: about 125 units at headline height and about 160 in the middle of the slide.
export const SPAN_INTRUSION = 165;

const span: Layout = c => {
  const w = 300;
  const x = c.i * c.W + c.W * 0.6;
  const y = c.H * 0.1;
  const rotate = -6;
  const html = headline(c, {side: 22, size: c.theme.headline.size * 0.95}).replace(/right:22px/, `right:${c.W * 0.52}px`);
  return {html: html + extras(c) + footnote(c), strip: phone(c, shot(c), {x, y, width: w, rotate, z: 6})};
};

export const LAYOUTS: Record<string, Layout> = {hero, tilted, callouts, caption, awards, quote, object, stat, duo, span};

export function getLayout(id: string): Layout {
  const l = LAYOUTS[id];
  if (!l) throw new Error(`Unknown layout "${id}". Layouts: ${Object.keys(LAYOUTS).join(', ')}`);
  return l;
}

export const LAYOUT_DOCS: Record<string, string> = {
  hero: 'Headline on top, large device bleeding off the bottom. The default.',
  tilted: 'Device tilted and offset to the right for extra energy.',
  callouts: 'Device plus up to 4 cards lifted out of the screen.',
  caption: 'Frameless screen on top, headline in a colored block below.',
  awards: 'Awards, rating and a press quote. A strong first slide.',
  quote: 'User testimonial with five stars.',
  object: 'No device, one large 3D object or asset in the middle.',
  stat: 'One huge number plus a device.',
  duo: 'Two overlapping devices (screenshot + screenshot2).',
  span: 'Oversized device that crosses into the next slide.',
};

export {localize};
