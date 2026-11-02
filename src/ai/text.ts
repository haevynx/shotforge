// Calls a vision-capable text model and returns JSON that matches a schema.
// Claude goes through the official SDK; OpenAI, Gemini and Grok are called over REST.
import Anthropic from '@anthropic-ai/sdk';
import {getKey, PROVIDERS, type ProviderId} from '../keys.js';

export interface ImageInput {
  mime: string;
  data: string; // base64
}

export interface JsonRequest {
  provider: ProviderId;
  model?: string;
  system: string;
  prompt: string;
  images?: ImageInput[];
  schema: Record<string, unknown>;
}

export const DEFAULT_TEXT_MODELS: Record<ProviderId, string> = {
  claude: 'claude-opus-5-5',
  openai: 'gpt-5',
  gemini: 'gemini-2.5-pro',
  grok: 'grok-4',
};

function requireKey(p: ProviderId): string {
  const k = getKey(p);
  if (!k) throw new Error(`No API key for ${PROVIDERS[p].label}. Run: shotforge keys set ${p}`);
  return k;
}

function parseJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '');
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`The model did not return valid JSON:\n${text.slice(0, 500)}`);
  }
}

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<any> {
  const res = await fetch(url, {method: 'POST', headers: {'content-type': 'application/json', ...headers}, body: JSON.stringify(body)});
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).host}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

async function claude(r: JsonRequest): Promise<unknown> {
  // Without a stored key, let the SDK resolve credentials (ANTHROPIC_API_KEY or an `ant auth login` profile).
  const key = getKey('claude');
  const client = key ? new Anthropic({apiKey: key}) : new Anthropic();
  const content: Anthropic.Beta.BetaContentBlockParam[] = [
    ...(r.images ?? []).map(img => ({
      type: 'image' as const,
      source: {type: 'base64' as const, media_type: img.mime as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif', data: img.data},
    })),
    {type: 'text', text: r.prompt},
  ];
  const params = {
    model: r.model ?? DEFAULT_TEXT_MODELS.claude,
    max_tokens: 16000,
    // If the primary model declines on a safety classifier, the server retries on a suitable fallback model.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: {effort: 'medium', format: {type: 'json_schema', schema: r.schema}},
    system: r.system,
    messages: [{role: 'user', content}],
  };
  const msg = (await client.beta.messages.create(params as never)) as Anthropic.Beta.BetaMessage;
  if (msg.stop_reason === 'refusal') throw new Error('Claude declined this request.');
  const text = msg.content.map(b => (b.type === 'text' ? b.text : '')).join('');
  return parseJson(text);
}

async function openaiCompatible(r: JsonRequest, base: string, key: string, model: string, strictSchema: boolean): Promise<unknown> {
  const content = [
    {type: 'text', text: r.prompt},
    ...(r.images ?? []).map(img => ({type: 'image_url', image_url: {url: `data:${img.mime};base64,${img.data}`}})),
  ];
  const body = {
    model,
    messages: [
      {role: 'system', content: strictSchema ? r.system : `${r.system}\n\nReply with JSON only, matching this schema:\n${JSON.stringify(r.schema)}`},
      {role: 'user', content},
    ],
    response_format: strictSchema ? {type: 'json_schema', json_schema: {name: 'result', strict: true, schema: r.schema}} : {type: 'json_object'},
  };
  const data = await postJson(`${base}/chat/completions`, {authorization: `Bearer ${key}`}, body);
  return parseJson(data.choices?.[0]?.message?.content ?? '');
}

async function gemini(r: JsonRequest): Promise<unknown> {
  const key = requireKey('gemini');
  const model = r.model ?? DEFAULT_TEXT_MODELS.gemini;
  const body = {
    systemInstruction: {parts: [{text: `${r.system}\n\nReply with JSON only, matching this schema:\n${JSON.stringify(r.schema)}`}]},
    contents: [{role: 'user', parts: [...(r.images ?? []).map(img => ({inline_data: {mime_type: img.mime, data: img.data}})), {text: r.prompt}]}],
    generationConfig: {responseMimeType: 'application/json'},
  };
  const data = await postJson(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {'x-goog-api-key': key}, body);
  const text = (data.candidates?.[0]?.content?.parts ?? []).map((p: {text?: string}) => p.text ?? '').join('');
  return parseJson(text);
}

export async function generateJson(r: JsonRequest): Promise<unknown> {
  switch (r.provider) {
    case 'claude':
      return claude(r);
    case 'openai':
      return openaiCompatible(r, 'https://api.openai.com/v1', requireKey('openai'), r.model ?? DEFAULT_TEXT_MODELS.openai, true);
    case 'grok':
      return openaiCompatible(r, 'https://api.x.ai/v1', requireKey('grok'), r.model ?? DEFAULT_TEXT_MODELS.grok, false);
    case 'gemini':
      return gemini(r);
  }
}
