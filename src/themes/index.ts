// A theme is the visual style (background, type, device frame, decoration); a layout is the
// composition of one slide. Themes derive their palette from brand.primary / brand.accent, so
// every app gets its own colors. The styles are distilled from real, well-designed store listings.
import {alpha, darken, lighten, mix, onColor} from '../color.js';
import {icon} from '../render/parts.js';
import type {Ctx, Theme} from '../render/types.js';

const INTER = 'Inter:wght@400;500;600;700;800;900';

const stars = (ctx: Ctx) => {
  const w = ctx.W * ctx.n;
  let dots = '';
  for (let k = 0; k < 40 * ctx.n; k++) {
    dots += `<circle cx="${(k * 137) % w}" cy="${(k * 89) % (ctx.H * 0.6)}" r="${k % 3 ? 0.8 : 1.4}" fill="#fff" opacity="${0.3 + (k % 5) / 10}"/>`;
  }
  return `<svg class="ab" style="left:0;top:0;z-index:1" width="${w}" height="${ctx.H}">${dots}<path d="M-20 ${ctx.H * 0.75} Q ${w * 0.3} ${ctx.H * 0.55} ${w * 0.7} ${ctx.H * 0.68} T ${w + 20} ${ctx.H * 0.58}" stroke="${lighten(ctx.brand.primary, 0.3)}" stroke-width="1.5" stroke-dasharray="4 6" fill="none" opacity=".7"/></svg>`;
};

const mountains = (ctx: Ctx) => {
  const w = ctx.W * ctx.n;
  const pts = (seed: number, base: number, amp: number) => {
    let d = `M0 ${base}`;
    const step = 90;
    for (let x = 0, k = 0; x <= w + step; x += step, k++) d += ` L${x} ${base - amp * (((k * seed) % 7) / 7)}`;
    return d + ` V${ctx.H} H0z`;
  };
  return `<svg class="ab" style="left:0;top:0;z-index:1" width="${w}" height="${ctx.H}"><path d="${pts(5, ctx.H * 0.82, 120)}" fill="${mix(ctx.brand.primary, '#1a0f40', 0.5)}"/><path d="${pts(3, ctx.H * 0.92, 70)}" fill="${ctx.brand.accent}" opacity=".55"/></svg>`;
};

export const THEMES: Theme[] = [
  {
    id: 'bold-gradient',
    name: 'Bold Gradient',
    description: 'Vivid gradient from your brand color, big bold left-aligned headline, large device bleeding off the bottom.',
    fits: 'Any app, health, productivity',
    fonts: [INTER],
    bg: c => `linear-gradient(160deg, ${c.brand.primary}, ${mix(c.brand.primary, c.brand.accent, 0.65)})`,
    ink: () => '#ffffff',
    headline: {font: 'Inter', size: 29, weight: 800, align: 'left'},
    em: c => `color:${lighten(c.brand.accent, 0.35)};font-style:normal`,
    device: {frame: 'black', y: 170},
  },
  {
    id: 'brand-classic',
    name: 'Brand Color Classic',
    description: 'One brand color across the set, small left-aligned copy with a bold lead sentence, very large device.',
    fits: 'Productivity, tools, business apps',
    fonts: [INTER],
    bg: c => c.brand.primary,
    ink: c => onColor(c.brand.primary),
    headline: {font: 'Inter', size: 15, weight: 400, align: 'left', top: 40, lineHeight: 1.35, tracking: '0'},
    em: () => 'font-style:normal;font-weight:700',
    strong: () => 'font-weight:700',
    device: {frame: 'black', y: 140, scale: 1.12},
  },
  {
    id: 'apple-minimal',
    name: 'Clean Minimal',
    description: 'Near-white background, crisp dark type, generous whitespace, keywords in the brand color.',
    fits: 'Utilities, finance, SaaS, B2B',
    fonts: [INTER],
    bg: () => '#f5f5f7',
    ink: () => '#1d1d1f',
    sub: () => '#6e6e73',
    headline: {font: 'Inter', size: 28, weight: 700, align: 'center'},
    em: c => `color:${c.brand.primary};font-style:normal`,
    device: {frame: 'black', y: 175},
  },
  {
    id: 'dark-premium',
    name: 'Dark Premium',
    description: 'Black background with a soft glow, centered white type, small legal print for credibility.',
    fits: 'Banking, investing, insurance, pro tools',
    fonts: [INTER],
    bg: c => `radial-gradient(80% 50% at 50% 62%, ${mix(c.brand.primary, '#26262c', 0.75)}, #050506)`,
    ink: () => '#ffffff',
    sub: () => 'rgba(255,255,255,.6)',
    headline: {font: 'Inter', size: 26, weight: 700, align: 'center'},
    em: c => `color:${lighten(c.brand.primary, 0.35)};font-style:normal`,
    card: () => ({bg: '#1b1b22', ink: '#fff'}),
    device: {frame: 'black', y: 170},
  },
  {
    id: 'frosted',
    name: 'Frosted Glow',
    description: 'Frosted-glass backdrop mixed from your brand colors, bold headline that makes numbers pop.',
    fits: 'Productivity, wellness, AI',
    fonts: [INTER],
    bg: c =>
      `radial-gradient(60% 40% at 20% 20%, ${alpha(lighten(c.brand.primary, 0.3), 0.7)}, transparent 70%), radial-gradient(60% 50% at 85% 70%, ${alpha(lighten(c.brand.accent, 0.4), 0.6)}, transparent 70%), linear-gradient(${lighten(c.brand.primary, 0.82)}, ${lighten(c.brand.primary, 0.6)})`,
    ink: c => darken(c.brand.primary, 0.72),
    headline: {font: 'Inter', size: 27, weight: 800, align: 'center'},
    em: c => `color:${c.brand.primary};font-style:normal`,
    device: {frame: 'black', y: 165, scale: 0.94},
  },
  {
    id: 'night-sky',
    name: 'Night Sky Story',
    description: 'Deep night sky with stars and a flight path running across the whole set, white left-aligned type.',
    fits: 'Travel, tracking, premium utilities',
    fonts: [INTER, 'Fraunces:ital,wght@0,600;1,600'],
    bg: c => `radial-gradient(120% 60% at 50% 100%, ${mix(c.brand.primary, '#0a0a18', 0.55)}, #0a0a18 70%)`,
    ink: () => '#ffffff',
    sub: c => lighten(c.brand.primary, 0.4),
    headline: {font: 'Inter', size: 24, weight: 700, align: 'left', top: 56},
    em: c => `color:${lighten(c.brand.primary, 0.45)};font-style:normal`,
    card: () => ({bg: '#17142b', ink: '#fff'}),
    device: {frame: 'black', y: 170},
    pano: stars,
  },
  {
    id: 'caption-blocks',
    name: 'Caption Blocks',
    description: 'Frameless screen on top, headline inside a rounded color block below, a different color per slide.',
    fits: 'Education, casual games, playful apps',
    fonts: ['Nunito:wght@800;900'],
    defaultLayout: 'caption',
    bg: () => '#ffffff',
    // The caption layout picks its own text color; this one is used when a slide picks another layout
    ink: c => darken(c.brand.primary, 0.6),
    headline: {font: 'Nunito', size: 25, weight: 900, align: 'center', lineHeight: 1.1},
    em: () => 'font-style:normal;text-decoration:underline;text-decoration-thickness:3px;text-underline-offset:4px',
    device: {frame: 'none'},
  },
  {
    id: 'warm-cream',
    name: 'Warm Cream',
    description: 'Warm cream background on every slide, a small 3D icon above a short caption. Quiet and trustworthy.',
    fits: 'Travel, marketplaces, services',
    fonts: [INTER],
    bg: () => '#f7f1ea',
    ink: () => '#222222',
    headline: {font: 'Inter', size: 17, weight: 600, align: 'center', top: 96, tracking: '-0.01em'},
    em: c => `color:${c.brand.primary};font-style:normal`,
    device: {frame: 'black', y: 175},
    overlay: c =>
      `<div class="ab" style="left:0;right:0;top:46px;display:flex;justify-content:center;z-index:4"><div style="width:36px;height:36px;border-radius:11px;background:linear-gradient(145deg, ${lighten(c.brand.primary, 0.25)}, ${c.brand.primary});box-shadow:0 6px 12px ${alpha(c.brand.primary, 0.35)}, inset 0 2px 0 rgba(255,255,255,.4);display:flex;align-items:center;justify-content:center">${icon(c.slide.icon ?? 'spark', '#fff', 18, 2.2)}</div></div>`,
  },
  {
    id: 'soft-mesh',
    name: 'Soft Mesh',
    description: 'Light, brand-tinted background with a small label above the headline. Pairs well with callouts.',
    fits: 'Fintech, AI, health tracking',
    fonts: [INTER],
    defaultLayout: 'callouts',
    bg: c => `linear-gradient(180deg, ${lighten(c.brand.primary, 0.92)}, ${lighten(c.brand.accent, 0.9)})`,
    ink: c => darken(c.brand.primary, 0.75),
    sub: () => '#6a6f8a',
    headline: {font: 'Inter', size: 25, weight: 700, align: 'center', top: 66},
    em: c => `color:${c.brand.primary};font-style:normal`,
    device: {frame: 'black', y: 185},
  },
  {
    id: 'editorial-serif',
    name: 'Editorial Serif',
    description: 'Warm gray background, centered serif headline with italic keywords, softly rounded frameless screen.',
    fits: 'Education, reading, knowledge, healthcare',
    fonts: ['Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,600', INTER],
    bg: () => '#efefec',
    ink: () => '#222222',
    headline: {font: 'Fraunces', size: 21, weight: 600, align: 'center', top: 46, tracking: '-0.01em'},
    em: () => 'font-style:italic',
    device: {frame: 'none', y: 140, scale: 1.1},
  },
  {
    id: 'neon-sport',
    name: 'Neon Sport',
    description: 'Loud accent color with black, heavy uppercase type like a sports poster.',
    fits: 'Gym, sports, coaching',
    fonts: ['Anton', INTER],
    bg: c => c.brand.accent,
    ink: c => onColor(c.brand.accent),
    headline: {font: 'Anton', size: 34, weight: 400, align: 'left', lineHeight: 0.98, upper: true, tracking: '0'},
    em: c => `font-style:normal;background:${onColor(c.brand.accent)};color:${c.brand.accent};padding:0 4px`,
    device: {frame: 'black', y: 170},
  },
  {
    id: 'framed-pop',
    name: 'Framed Pop',
    description: 'Thick colored frame like a poster, uppercase type mixing bold and light weights, very colorful.',
    fits: 'Music, podcasts, entertainment, social',
    fonts: [INTER],
    bg: c => c.brand.primary,
    ink: () => '#111111',
    headline: {font: 'Inter', size: 18, weight: 500, align: 'center', upper: true, lineHeight: 1.15, top: 48},
    em: () => 'font-style:normal;font-weight:800',
    strong: () => 'font-weight:800',
    device: {frame: 'black', y: 150},
    overlay: c => `<div class="ab" style="inset:12px;border-radius:6px;background:${lighten(c.brand.accent, 0.35)};z-index:0"></div>`,
  },
  {
    id: 'dusk',
    name: 'Dusk Mountains',
    description: 'Deep purple sky with mountains running across the set, keywords set in bold inside the sentence.',
    fits: 'Sleep, health, meditation',
    fonts: [INTER],
    bg: c => `linear-gradient(${mix(c.brand.primary, '#170d3a', 0.7)}, ${mix(c.brand.primary, '#2a1563', 0.5)})`,
    ink: () => '#ffffff',
    headline: {font: 'Inter', size: 24, weight: 400, align: 'left'},
    em: () => 'font-style:normal;font-weight:800',
    strong: () => 'font-weight:800',
    card: c => ({bg: c.brand.primary, ink: '#fff'}),
    device: {frame: 'black', y: 160},
    pano: mountains,
  },
  {
    id: 'mono-pro',
    name: 'Mono Pro',
    description: 'Matte black, widely tracked uppercase type. Technical and professional.',
    fits: 'Camera, pro tools, audio, B2B',
    fonts: [INTER],
    bg: () => '#111111',
    ink: () => '#ffffff',
    sub: c => c.brand.accent,
    headline: {font: 'Inter', size: 14, weight: 500, align: 'center', upper: true, tracking: '0.18em', lineHeight: 1.5},
    em: c => `color:${c.brand.accent};font-style:normal`,
    device: {frame: 'black', y: 150},
  },
  {
    id: 'lavender-serif',
    name: 'Soft Serif',
    description: 'Soft backgrounds alternating light and dark, large serif headline with italics. Great for testimonials.',
    fits: 'Planners, self-care, lifestyle',
    fonts: ['Instrument Serif:ital@0;1', INTER],
    bg: c => ['#f7f2ea', darken(c.brand.primary, 0.78), lighten(c.brand.primary, 0.78)][c.i % 3],
    ink: c => (c.i % 3 === 1 ? '#ffffff' : darken(c.brand.primary, 0.78)),
    headline: {font: 'Instrument Serif', size: 32, weight: 400, align: 'center', top: 46, lineHeight: 1.02, tracking: '-0.01em'},
    em: () => 'font-style:italic',
    device: {frame: 'black', y: 170},
  },
  {
    id: 'glow-dark',
    name: 'Glow Dark',
    description: 'Black background lit by your brand color from below, glowing device edge, lots of energy.',
    fits: 'Sports, fitness, games, crypto',
    fonts: [INTER],
    bg: c => `radial-gradient(90% 45% at 50% 100%, ${c.brand.primary}, ${darken(c.brand.primary, 0.8)} 55%, #0a0605)`,
    ink: () => '#ffffff',
    headline: {font: 'Inter', size: 24, weight: 800, align: 'center'},
    em: c => `color:${lighten(c.brand.primary, 0.3)};font-style:normal`,
    card: () => ({bg: '#17171b', ink: '#fff'}),
    device: {frame: 'black', y: 150, glow: c => `0 0 0 3px ${c.brand.primary}, 0 0 40px ${alpha(c.brand.primary, 0.55)}`},
  },
  {
    id: 'quiet-luxury',
    name: 'Quiet Luxury',
    description: 'Pure black, small light headline, smaller device with lots of space. Luxury through restraint.',
    fits: 'Premium health, wearables, luxury apps',
    fonts: [INTER],
    bg: () => '#000000',
    ink: () => '#ffffff',
    headline: {font: 'Inter', size: 17, weight: 400, align: 'center', top: 70, tracking: '0'},
    em: c => `color:${lighten(c.brand.accent, 0.2)};font-style:normal`,
    device: {frame: 'black', y: 190, scale: 0.84},
  },
];

export function getTheme(id: string): Theme {
  const t = THEMES.find(x => x.id === id);
  if (!t) throw new Error(`Unknown theme "${id}". Run "shotforge themes" to see the list.`);
  return t;
}
