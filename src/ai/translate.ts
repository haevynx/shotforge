// Translates every piece of copy in the config, keeping *emphasis* and **bold** markup intact.
const FIELDS = ['label', 'title', 'subtitle', 'footnote'];

type Ref = {get: () => unknown; set: (v: Record<string, string>) => void};

function collect(raw: any): Ref[] {
  const refs: Ref[] = [];
  const add = (obj: any, key: string | number) => {
    if (obj && obj[key] !== undefined) refs.push({get: () => obj[key], set: v => (obj[key] = v)});
  };
  for (const s of raw.slides ?? []) {
    for (const f of FIELDS) add(s, f);
    for (const c of s.callouts ?? []) {
      add(c, 'title');
      add(c, 'sub');
    }
    (s.awards ?? []).forEach((_: unknown, i: number) => add(s.awards, i));
    if (s.press) add(s.press, 'quote');
    if (s.quote) add(s.quote, 'text');
    if (s.stat) add(s.stat, 'label');
    if (s.rating) add(s.rating, 'count');
  }
  return refs;
}

const asMap = (v: unknown, source: string): Record<string, string> => (typeof v === 'string' ? {[source]: v} : (v as Record<string, string>));

export function translationJob(raw: any, source: string) {
  const refs = collect(raw);
  const items = refs.map((r, id) => ({id, text: asMap(r.get(), source)[source] ?? Object.values(asMap(r.get(), source))[0] ?? ''}));
  return {refs, items};
}

export function translateSchema(targets: string[]) {
  return {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: {type: 'integer'},
            ...Object.fromEntries(targets.map(l => [l, {type: 'string'}])),
          },
          required: ['id', ...targets],
          additionalProperties: false,
        },
      },
    },
    required: ['items'],
    additionalProperties: false,
  };
}

export const TRANSLATE_SYSTEM = `You translate marketing copy for App Store and Google Play screenshots.
- Translate the meaning, concise and idiomatic like a native copywriter; keep a similar length so it fits the layout.
- Keep *emphasis*, **bold** markup and \\n line breaks, placed on the matching words in the translation.
- Do not translate proper nouns, app names or brand names.`;

export function applyTranslations(
  raw: any,
  source: string,
  refs: Ref[],
  result: {items: ({id: number} & Record<string, string | number>)[]},
  targets: string[],
) {
  for (const it of result.items) {
    const ref = refs[it.id];
    if (!ref) continue;
    const map = {...asMap(ref.get(), source)};
    for (const l of targets) if (typeof it[l] === 'string') map[l] = it[l] as string;
    ref.set(map);
  }
  raw.locales = [...new Set([...(raw.locales ?? [source]), ...targets])];
  return raw;
}
