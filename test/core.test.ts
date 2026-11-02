import zlib from 'node:zlib';
import {describe, expect, it} from 'vitest';
import {applyPlan, planSchema} from '../src/ai/plan.js';
import {applyTranslations, translationJob} from '../src/ai/translate.js';
import {fluentUrl} from '../src/assets.js';
import {luminance, mix, onColor} from '../src/color.js';
import {localize, parseConfig} from '../src/config.js';
import {inline} from '../src/markup.js';
import {buildDeck} from '../src/render/document.js';
import {pngSize, stripAlpha} from '../src/render/png.js';
import {getTarget, viewportOf, TARGETS} from '../src/targets.js';
import {THEMES} from '../src/themes/index.js';

// A 1×2 RGBA PNG built in memory, like the ones Chrome captures
function rgbaPng(): Buffer {
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(2, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  // row 1: filter None, red; row 2: filter Up adding (0,10,20,0) → (255,10,20)
  const raw = Buffer.from([0, 255, 0, 0, 255, 2, 0, 10, 20, 0]);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
const PIXEL = `data:image/png;base64,${rgbaPng().toString('base64')}`;

const baseConfig = () =>
  parseConfig({
    app: {name: 'Demo'},
    theme: 'bold-gradient',
    brand: {primary: '#3a6bff'},
    locales: ['vi', 'en'],
    slides: [
      {layout: 'hero', screenshot: PIXEL, title: {vi: 'Xin *chào*', en: 'Hello *there*'}},
      {layout: 'span', screenshot: PIXEL, title: 'Spans over'},
      {layout: 'object', asset: 'fluent:Hourglass done', title: 'After span', subtitle: 'Button'},
    ],
  });

describe('markup', () => {
  it('converts *emphasis*, **bold**, line breaks and escapes HTML', () => {
    expect(inline('a *b* **c**\nd <e>')).toBe('a <em>b</em> <strong>c</strong><br>d &lt;e&gt;');
  });
});

describe('color', () => {
  it('mixes colors and picks a contrasting text color', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(onColor('#ffffff')).toBe('#111111');
    expect(onColor('#1a1a1a')).toBe('#ffffff');
    expect(luminance('#ffffff')).toBeCloseTo(1);
  });
});

describe('config', () => {
  it('picks text by locale with a fallback', () => {
    expect(localize({vi: 'A', en: 'B'}, 'en')).toBe('B');
    expect(localize({vi: 'A'}, 'ja', 'vi')).toBe('A');
    expect(localize('X', 'en')).toBe('X');
  });
  it('reports a readable error for an invalid config', () => {
    expect(() => parseConfig({app: {name: 'x'}, slides: []})).toThrow(/slides/);
  });
});

describe('targets', () => {
  it('viewport × scale gives the exact store pixel size', () => {
    for (const t of Object.values(TARGETS)) {
      const vp = viewportOf(t);
      expect(Math.round(vp.width * t.scale)).toBe(t.w);
      expect(Math.round(vp.height * t.scale)).toBe(t.h);
    }
  });
});

describe('png', () => {
  it('drops the alpha channel and keeps size and colors', () => {
    const rgba = rgbaPng();
    const rgb = stripAlpha(rgba);
    expect(pngSize(rgb)).toEqual(pngSize(rgba));
    expect(rgb[25]).toBe(2); // color type RGB
    const idatLen = rgb.readUInt32BE(33);
    const raw = zlib.inflateSync(rgb.subarray(41, 41 + idatLen));
    expect([...raw]).toEqual([0, 255, 0, 0, 0, 255, 10, 20]);
  });
});

describe('document', () => {
  it('builds one page per slide in the requested locale', () => {
    const docs = buildDeck({config: baseConfig(), baseDir: '.', target: getTarget('ios-6.9'), locale: 'en'});
    expect(docs).toHaveLength(3);
    expect(docs[0]).toContain('Hello <em>there</em>');
    expect(docs[2]).toContain(fluentUrl('Hourglass done'));
  });
  it('draws the span device on the next slide and pushes that slide’s headline right', () => {
    const docs = buildDeck({config: baseConfig(), baseDir: '.', target: getTarget('ios-6.9'), locale: 'vi'});
    expect(docs[2]).toContain('rotate(-6deg)');
    expect(docs[2]).toMatch(/class="ab hl" style="left:177px/);
  });
  it('renders every theme with every layout', () => {
    for (const theme of THEMES) {
      const docs = buildDeck({config: baseConfig(), baseDir: '.', target: getTarget('android-phone'), locale: 'vi', themeId: theme.id});
      expect(docs).toHaveLength(3);
    }
  });
});

describe('ai helpers', () => {
  it('plan schema requires every locale', () => {
    const s = planSchema(['vi', 'en']) as any;
    expect(s.properties.slides.items.properties.title.required).toEqual(['vi', 'en']);
  });
  it('merges a plan into the config and keeps screenshots', () => {
    const raw = {slides: [{screenshot: 'a.png', title: 'cũ'}]};
    const out = applyPlan(
      raw,
      {
        theme: 'dusk',
        primary: '#111111',
        accent: '#222222',
        reasoning: '',
        slides: [{layout: 'callouts', label: {vi: ''}, title: {vi: 'mới'}, subtitle: {vi: ''}, callouts: [{title: {vi: 'thẻ'}, icon: 'check'}]}],
      },
      {applyTheme: true},
    );
    expect(out.theme).toBe('dusk');
    expect(out.slides[0]).toEqual({screenshot: 'a.png', layout: 'callouts', title: {vi: 'mới'}, callouts: [{title: {vi: 'thẻ'}, icon: 'check'}]});
  });
  it('collects strings and writes translations back in place', () => {
    const raw: any = {locales: ['vi'], slides: [{title: 'Xin chào', callouts: [{title: 'Một'}]}]};
    const {refs, items} = translationJob(raw, 'vi');
    expect(items.map(i => i.text)).toEqual(['Xin chào', 'Một']);
    applyTranslations(
      raw,
      'vi',
      refs,
      {
        items: [
          {id: 0, en: 'Hello'},
          {id: 1, en: 'One'},
        ],
      },
      ['en'],
    );
    expect(raw.slides[0].title).toEqual({vi: 'Xin chào', en: 'Hello'});
    expect(raw.slides[0].callouts[0].title).toEqual({vi: 'Một', en: 'One'});
    expect(raw.locales).toEqual(['vi', 'en']);
  });
});
