import type {Config, LocalizedText, SlideConfig} from '../config.js';
import type {Target} from '../targets.js';

export interface Brand {
  primary: string;
  accent: string;
  font?: string;
}

export interface HeadlineStyle {
  font: string;
  size: number;
  weight: number;
  align: 'left' | 'center';
  top?: number;
  lineHeight?: number;
  tracking?: string;
  upper?: boolean;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  fits: string;
  fonts: string[];
  defaultLayout?: string;
  bg: (ctx: Ctx) => string;
  ink: (ctx: Ctx) => string;
  sub?: (ctx: Ctx) => string;
  headline: HeadlineStyle;
  em: (ctx: Ctx) => string;
  strong?: (ctx: Ctx) => string;
  card?: (ctx: Ctx) => {bg: string; ink: string};
  device: {frame: 'black' | 'silver' | 'none'; y?: number; scale?: number; glow?: (ctx: Ctx) => string | undefined};
  overlay?: (ctx: Ctx) => string;
  pano?: (ctx: Ctx) => string;
}

export interface Ctx {
  config: Config;
  slide: SlideConfig;
  i: number;
  n: number;
  W: number;
  H: number;
  locale: string;
  target: Target;
  theme: Theme;
  brand: Brand;
  /** Width (design units) the previous slide's span device intrudes into this slide; 0 if none */
  spanIn: number;
  /** Localized text with *emphasis* markup converted to HTML */
  t: (text: LocalizedText | undefined) => string;
  /** Image or asset reference → URL usable by the renderer */
  src: (ref: LocalizedText | undefined) => string;
}
