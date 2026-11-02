// Generates artwork (3D objects, mascots, illustrations, backgrounds) in the brand colors.
import {getKey, PROVIDERS, type ProviderId} from '../keys.js';

export type AssetStyle = '3d' | 'mascot' | 'illustration' | 'background';

export const IMAGE_PROVIDERS = ['openai', 'gemini', 'grok'] as const;
export type ImageProvider = (typeof IMAGE_PROVIDERS)[number];

export const DEFAULT_IMAGE_MODELS: Record<ImageProvider, string> = {
  openai: 'gpt-image-1',
  gemini: 'gemini-2.5-flash-image',
  grok: 'grok-2-image',
};

const STYLE_PROMPTS: Record<AssetStyle, string> = {
  '3d': 'A single glossy 3D object of {subject}. Soft clay-like material, smooth rounded edges, soft studio lighting, gentle highlights, subtle reflections. Color palette based on {colors}. Centered, isolated, no text, no shadow on the ground, transparent background. Premium App Store marketing style.',
  mascot:
    'A friendly mascot character: {subject}. Simple rounded shapes, expressive face, consistent flat-to-soft 3D shading, brand colors {colors}. Full body, centered, isolated, no text, transparent background. Suitable as a recurring brand character in app store screenshots.',
  illustration:
    'A clean editorial illustration of {subject}. Confident hand-drawn ink lines with limited flat color fills from {colors}. Minimal, plenty of white space, centered, isolated, no text, transparent background.',
  background:
    'An abstract background for a vertical app store screenshot: {subject}. Soft gradients and atmospheric depth using {colors}. No objects in the center third, no text, no people, portrait orientation.',
};

export function buildAssetPrompt(subject: string, style: AssetStyle, colors: string[]): string {
  return STYLE_PROMPTS[style].replace('{subject}', subject).replace('{colors}', colors.join(', '));
}

function requireKey(p: ProviderId): string {
  const k = getKey(p);
  if (!k) throw new Error(`No API key for ${PROVIDERS[p].label}. Run: shotforge keys set ${p}`);
  return k;
}

async function post(url: string, headers: Record<string, string>, body: unknown): Promise<any> {
  const res = await fetch(url, {method: 'POST', headers: {'content-type': 'application/json', ...headers}, body: JSON.stringify(body)});
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).host}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

export async function generateImage(o: {provider: ImageProvider; model?: string; prompt: string; portrait?: boolean}): Promise<Buffer> {
  if (o.provider === 'openai') {
    const data = await post(
      'https://api.openai.com/v1/images/generations',
      {authorization: `Bearer ${requireKey('openai')}`},
      {
        model: o.model ?? DEFAULT_IMAGE_MODELS.openai,
        prompt: o.prompt,
        size: o.portrait ? '1024x1536' : '1024x1024',
        background: o.portrait ? 'opaque' : 'transparent',
        output_format: 'png',
        n: 1,
      },
    );
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error('OpenAI returned no image');
    return Buffer.from(b64, 'base64');
  }
  if (o.provider === 'grok') {
    const data = await post(
      'https://api.x.ai/v1/images/generations',
      {authorization: `Bearer ${requireKey('grok')}`},
      {model: o.model ?? DEFAULT_IMAGE_MODELS.grok, prompt: o.prompt, n: 1, response_format: 'b64_json'},
    );
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error('Grok returned no image');
    return Buffer.from(b64, 'base64');
  }
  const model = o.model ?? DEFAULT_IMAGE_MODELS.gemini;
  const data = await post(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {'x-goog-api-key': requireKey('gemini')},
    {
      contents: [{role: 'user', parts: [{text: o.prompt}]}],
      generationConfig: {responseModalities: ['IMAGE']},
    },
  );
  const part = (data.candidates?.[0]?.content?.parts ?? []).find((p: {inlineData?: {data: string}}) => p.inlineData?.data);
  if (!part) throw new Error('Gemini returned no image');
  return Buffer.from(part.inlineData.data, 'base64');
}
