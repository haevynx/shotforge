import fs from 'node:fs';
import path from 'node:path';
import {z} from 'zod';

// Text is either a plain string or a per-locale map: {"en": "...", "vi": "..."}
const Text = z.union([z.string(), z.record(z.string(), z.string())]).describe('A string, or a map of locale code to string');
export type LocalizedText = z.infer<typeof Text>;

export const LAYOUTS = ['hero', 'tilted', 'callouts', 'caption', 'awards', 'quote', 'object', 'stat', 'duo', 'span'] as const;

const ImageRef = z.union([z.string(), z.record(z.string(), z.string())]).describe('Image path relative to the config file, or a per-locale map of paths');

const Callout = z.object({
  title: Text,
  sub: Text.optional(),
  icon: z.string().optional().describe('Icon name, see `shotforge layouts`'),
  color: z.string().optional().describe('Chip color, defaults to the brand palette'),
});

const Slide = z.object({
  // Leave empty to use the theme's default layout (usually hero)
  layout: z.enum(LAYOUTS).optional(),
  screenshot: ImageRef.optional(),
  screenshot2: ImageRef.optional().describe('Second screenshot for the duo layout'),
  label: Text.optional().describe('Small uppercase kicker above the title'),
  title: Text.optional().describe('Headline. Supports *emphasis*, **bold** and \\n line breaks'),
  subtitle: Text.optional(),
  footnote: Text.optional().describe('Small print at the bottom, e.g. legal disclaimers'),
  icon: z.string().optional(),
  asset: z.string().optional().describe('Hero object for the object layout: file path, fluent:<Name> or peep:<seed>'),
  assets: z
    .array(z.object({src: z.string(), x: z.number(), y: z.number(), size: z.number().default(100), rotate: z.number().default(0)}))
    .optional()
    .describe('Extra decorative assets, positioned on the 320-unit wide design canvas'),
  callouts: z.array(Callout).max(4).optional(),
  awards: z.array(Text).max(4).optional(),
  rating: z.object({score: z.string(), count: Text.optional()}).optional(),
  press: z.object({quote: Text, source: z.string()}).optional(),
  quote: z.object({text: Text, author: z.string().optional()}).optional(),
  stat: z.object({value: z.string(), label: Text.optional()}).optional(),
  background: z.string().optional().describe('CSS background that overrides the theme for this slide'),
});

export const ConfigSchema = z.object({
  $schema: z.string().optional(),
  app: z.object({name: z.string(), description: z.string().optional()}),
  theme: z.string().default('bold-gradient'),
  brand: z
    .object({
      primary: z.string().default('#3a6bff'),
      accent: z.string().optional(),
      font: z.string().optional().describe('Google Fonts family used for headlines'),
      logo: z.string().optional(),
    })
    .default({primary: '#3a6bff'}),
  locales: z.array(z.string()).min(1).default(['en']),
  targets: z.array(z.string()).min(1).default(['ios-6.9']),
  output: z.string().default('out'),
  ai: z
    .object({
      text: z.object({provider: z.string(), model: z.string().optional()}).optional(),
      image: z.object({provider: z.string(), model: z.string().optional()}).optional(),
    })
    .optional(),
  slides: z.array(Slide).min(1),
});

export type Config = z.infer<typeof ConfigSchema>;
export type SlideConfig = z.infer<typeof Slide>;
export type CalloutConfig = z.infer<typeof Callout>;

export const CONFIG_FILE = 'shotforge.json';

export function localize(t: LocalizedText | undefined, locale: string, fallback?: string): string {
  if (t === undefined) return '';
  if (typeof t === 'string') return t;
  return t[locale] ?? (fallback ? t[fallback] : undefined) ?? Object.values(t)[0] ?? '';
}

export function parseConfig(raw: unknown): Config {
  const r = ConfigSchema.safeParse(raw);
  if (!r.success) {
    const msg = r.error.issues.map(i => `  • ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
    throw new Error(`Invalid config:\n${msg}`);
  }
  return r.data;
}

export function loadConfig(file = CONFIG_FILE): {config: Config; dir: string; file: string} {
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) throw new Error(`${file} not found. Run "shotforge init" to create one.`);
  const raw = JSON.parse(fs.readFileSync(abs, 'utf8'));
  return {config: parseConfig(raw), dir: path.dirname(abs), file: abs};
}

export function saveConfig(file: string, config: unknown) {
  fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
}
