// The model reads the app screenshots and proposes a theme, colors, a layout and copy for every slide.
import fs from 'node:fs';
import path from 'node:path';
import type {Config} from '../config.js';
import {LAYOUT_DOCS} from '../layouts/index.js';
import {ICON_NAMES} from '../render/parts.js';
import {THEMES} from '../themes/index.js';
import type {ImageInput} from './text.js';

const textObj = (locales: string[]) => ({
  type: 'object',
  properties: Object.fromEntries(locales.map(l => [l, {type: 'string'}])),
  required: locales,
  additionalProperties: false,
});

export function planSchema(locales: string[]) {
  const t = textObj(locales);
  return {
    type: 'object',
    properties: {
      theme: {type: 'string', enum: THEMES.map(x => x.id)},
      primary: {type: 'string', description: 'Primary brand color as #rrggbb'},
      accent: {type: 'string', description: 'Accent color as #rrggbb'},
      reasoning: {type: 'string'},
      slides: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            layout: {type: 'string', enum: Object.keys(LAYOUT_DOCS)},
            label: t,
            title: t,
            subtitle: t,
            callouts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {title: t, icon: {type: 'string', enum: ICON_NAMES}},
                required: ['title', 'icon'],
                additionalProperties: false,
              },
            },
          },
          required: ['layout', 'label', 'title', 'subtitle', 'callouts'],
          additionalProperties: false,
        },
      },
    },
    required: ['theme', 'primary', 'accent', 'reasoning', 'slides'],
    additionalProperties: false,
  };
}

export const PLAN_SYSTEM = `You are an App Store Optimization expert and art director who designs store screenshots for top apps.
Copy rules:
- Every headline states a user BENEFIT, not a feature list. At most 6 words and 2 lines (use \\n for line breaks).
- Wrap the 1–2 most important words in *asterisks* so the theme can highlight them. **Double asterisks** make a bold lead-in.
- Slide 1 carries the app's biggest promise. The rest follow a story: problem → core action → result → trust.
- Write every locale natively and idiomatically, with correct spelling and diacritics. Never translate word for word.
- Never invent awards, numbers or testimonials. Without real data, do not use the awards, quote or stat layouts.
- label is a small uppercase kicker above the headline (may be an empty string). subtitle is a short supporting line (may be empty).
- callouts are only for the "callouts" layout: 2–3 short cards (5 words max) describing what is visible on screen. Use an empty array otherwise.
Design rules:
- Vary the layout across slides; never use the same layout for every slide.
- Pick a theme that fits the app category and the people browsing the listing. Take the primary color from the brand color visible in the screenshots.`;

export function planPrompt(config: Config, shotNames: string[]): string {
  const themes = THEMES.map(t => `- ${t.id}: ${t.description} (fits: ${t.fits})`).join('\n');
  const layouts = Object.entries(LAYOUT_DOCS)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');
  return `App: ${config.app.name}
Description: ${config.app.description ?? '(none, infer it from the screenshots)'}
Locales to write: ${config.locales.join(', ')}
Number of slides: ${shotNames.length}. The screenshots are attached in this order: ${shotNames.join(', ')}.
Return exactly ${shotNames.length} items in "slides"; item i belongs to screenshot i.

Available themes:
${themes}

Available layouts:
${layouts}`;
}

export function loadImages(baseDir: string, refs: string[]): ImageInput[] {
  return refs.map(r => {
    const abs = path.resolve(baseDir, r);
    const ext = path.extname(abs).toLowerCase();
    return {mime: ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg', data: fs.readFileSync(abs).toString('base64')};
  });
}

export interface Plan {
  theme: string;
  primary: string;
  accent: string;
  reasoning: string;
  slides: {
    layout: string;
    label: Record<string, string>;
    title: Record<string, string>;
    subtitle: Record<string, string>;
    callouts: {title: Record<string, string>; icon: string}[];
  }[];
}

const nonEmpty = (t: Record<string, string>) => (Object.values(t).some(v => v.trim()) ? t : undefined);

// Merges the proposal into the raw config, keeping screenshot paths and every other field.
export function applyPlan(raw: any, plan: Plan, o: {applyTheme: boolean}) {
  if (o.applyTheme) {
    raw.theme = plan.theme;
    raw.brand = {...(raw.brand ?? {}), primary: plan.primary, accent: plan.accent};
  }
  raw.slides = raw.slides.map((s: any, i: number) => {
    const p = plan.slides[i];
    if (!p) return s;
    const next = {...s, layout: p.layout, label: nonEmpty(p.label), title: p.title, subtitle: nonEmpty(p.subtitle)};
    if (p.layout === 'callouts' && p.callouts.length) next.callouts = p.callouts.map(c => ({title: c.title, icon: c.icon}));
    else delete next.callouts;
    for (const k of Object.keys(next)) if (next[k] === undefined) delete next[k];
    return next;
  });
  return raw;
}
