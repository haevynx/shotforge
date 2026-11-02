// Building blocks shared by layouts: device frame, floating cards, laurels, stars, icons.
// All coordinates are on the 320-unit wide design canvas (see DESIGN_W).
import type {Ctx} from './types.js';

const ICONS: Record<string, string> = {
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  heart: '<path d="M12 20s-7-4.4-8.8-9A4.6 4.6 0 0 1 12 6.6 4.6 4.6 0 0 1 20.8 11C19 15.6 12 20 12 20z"/>',
  moon: '<path d="M20 13.5A8 8 0 1 1 10.5 4a6.3 6.3 0 0 0 9.5 9.5z"/>',
  bolt: '<path d="M13 3L5 13.5h6.5L11 21l8-10.5h-6.5z"/>',
  plane: '<path d="M3 13.5l18-6-3 11-5.5-4.5-3.5 3v-4.5z"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5h4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  leaf: '<path d="M5 19c0-8 5.5-13.5 15-14-.5 9.5-6 15-14 15"/><path d="M5 19l7-7"/>',
  bag: '<path d="M5.5 8h13l-1 12.5h-11z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
  chart: '<path d="M5 20V11M12 20V5M19 20v-6"/>',
  spark: '<path d="M12 3.5l1.8 5.4 5.4 1.8-5.4 1.8L12 17.9l-1.8-5.4-5.4-1.8 5.4-1.8z"/>',
  home: '<path d="M4 11l8-6.5 8 6.5v9H4z"/>',
  pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  mail: '<rect x="3.5" y="6" width="17" height="12.5" rx="2.5"/><path d="M4 7l8 6 8-6"/>',
  cam: '<rect x="3.5" y="7" width="17" height="12.5" rx="3"/><circle cx="12" cy="13.2" r="3.3"/><path d="M9 7l1.5-2.5h3L15 7"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
  doc: '<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10.5a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"/><path d="M14 3.5V8h4M9 13h6M9 16.5h6"/>',
  car: '<path d="M4 16v-3.5l2-5h12l2 5V16"/><path d="M3.5 16h17v2.5h-17z"/><circle cx="7.5" cy="16" r="1.5"/><circle cx="16.5" cy="16" r="1.5"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  users:
    '<circle cx="9" cy="9" r="3.2"/><path d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8"/><circle cx="16.5" cy="8" r="2.5"/><path d="M16.5 13c2.2 0 3.6 1.4 4 4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"/>',
};

export const ICON_NAMES = Object.keys(ICONS);

export function icon(name: string, color = 'currentColor', size = 16, stroke = 2): string {
  const body = ICONS[name] ?? ICONS.spark;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

export function iconChip(name: string, bg: string, fg = '#fff', size = 30): string {
  return `<div style="width:${size}px;height:${size}px;border-radius:${size * 0.3}px;background:${bg};display:flex;align-items:center;justify-content:center;flex:none">${icon(name, fg, size * 0.5)}</div>`;
}

export function stars(color: string, n = 5, size = 12): string {
  const s = `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path fill="${color}" d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>`;
  return s.repeat(n);
}

function laurel(color: string, flip = false): string {
  let leaves = '';
  for (let k = 0; k < 7; k++) {
    const a = ((200 + k * 21) * Math.PI) / 180;
    const cx = 22 + 18 * Math.cos(a);
    const cy = 48 - (24 - 20 * Math.sin(a));
    leaves += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="2.6" ry="5.4" fill="${color}" transform="rotate(${-60 + k * 21} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`;
  }
  return `<svg viewBox="0 0 26 48" height="46" style="flex:none;${flip ? 'transform:scaleX(-1)' : ''}">${leaves}</svg>`;
}

export function award(innerHtml: string, color: string, fontSize = 11): string {
  return `<div style="display:flex;align-items:center;justify-content:center;gap:6px;text-align:center;color:${color}">${laurel(color)}<div style="font-size:${fontSize}px;line-height:1.25;font-weight:600">${innerHtml}</div>${laurel(color, true)}</div>`;
}

export interface PhoneOpts {
  x?: number;
  y?: number;
  width?: number;
  rotate?: number;
  z?: number;
  glow?: string;
}

// Device frame around a real screenshot. Its height follows the image ratio, so the UI is never distorted.
export function phone(ctx: Ctx, src: string, o: PhoneOpts = {}): string {
  const dev = ctx.theme.device;
  const width = o.width ?? 250 * (dev.scale ?? 1);
  const x = o.x ?? (ctx.W - width) / 2;
  const y = o.y ?? dev.y ?? 180;
  const z = o.z ?? 3;
  const rot = o.rotate ?? 0;
  const frame = dev.frame;
  if (frame === 'none') {
    return `<div class="ab" style="left:${x}px;top:${y}px;width:${width}px;transform:rotate(${rot}deg);z-index:${z};border-radius:${width * 0.09}px;overflow:hidden;box-shadow:0 24px 50px -14px rgba(0,0,0,.4)"><img src="${src}" style="display:block;width:100%"></div>`;
  }
  const pad = width * 0.032;
  const body = frame === 'silver' ? '#d9dade' : '#0b0b0d';
  const rim = frame === 'silver' ? '#bfc0c5' : '#2c2c30';
  const outerR = width * 0.176;
  const innerR = outerR - pad;
  const notch =
    ctx.target.platform === 'ios'
      ? `<div style="position:absolute;top:${pad + width * 0.03}px;left:50%;width:${width * 0.29}px;height:${width * 0.085}px;margin-left:-${width * 0.145}px;background:#000;border-radius:${width * 0.05}px;z-index:2"></div>`
      : `<div style="position:absolute;top:${pad + width * 0.035}px;left:50%;width:${width * 0.045}px;height:${width * 0.045}px;margin-left:-${width * 0.0225}px;background:#000;border-radius:50%;z-index:2"></div>`;
  const glow = o.glow ?? dev.glow?.(ctx);
  const shadow = `0 0 0 1.5px ${rim} inset, 0 30px 60px -12px rgba(0,0,0,.45), 0 12px 24px -8px rgba(0,0,0,.3)${glow ? `, ${glow}` : ''}`;
  return `<div class="ab" style="left:${x}px;top:${y}px;width:${width}px;padding:${pad}px;box-sizing:border-box;border-radius:${outerR}px;background:${body};box-shadow:${shadow};transform:rotate(${rot}deg);z-index:${z}">${notch}<img src="${src}" style="display:block;width:100%;border-radius:${innerR}px"></div>`;
}

export function floatCard(html: string, o: {x: number; y: number; w?: number; bg?: string; ink?: string; rotate?: number; z?: number}): string {
  return `<div class="ab" style="left:${o.x}px;top:${o.y}px;${o.w ? `width:${o.w}px;` : ''}padding:11px 13px;border-radius:16px;background:${o.bg ?? '#fff'};color:${o.ink ?? '#111'};box-shadow:0 18px 40px -10px rgba(0,0,0,.35),0 3px 8px rgba(0,0,0,.12);transform:rotate(${o.rotate ?? 0}deg);z-index:${o.z ?? 6};box-sizing:border-box">${html}</div>`;
}

export function assetImg(src: string, o: {x: number; y: number; size: number; rotate?: number; z?: number; shadow?: string}): string {
  return `<img class="ab" src="${src}" style="left:${o.x}px;top:${o.y}px;width:${o.size}px;height:${o.size}px;object-fit:contain;transform:rotate(${o.rotate ?? 0}deg);z-index:${o.z ?? 7};filter:drop-shadow(${o.shadow ?? '0 24px 30px rgba(0,0,0,.35)'})">`;
}
