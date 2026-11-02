#!/usr/bin/env node
import {execFile} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import {Command, Option} from 'commander';
import {buildAssetPrompt, DEFAULT_IMAGE_MODELS, generateImage, IMAGE_PROVIDERS, type AssetStyle, type ImageProvider} from './ai/image.js';
import {applyPlan, loadImages, PLAN_SYSTEM, planPrompt, planSchema, type Plan} from './ai/plan.js';
import {DEFAULT_TEXT_MODELS, generateJson} from './ai/text.js';
import {applyTranslations, TRANSLATE_SYSTEM, translateSchema, translationJob} from './ai/translate.js';
import {searchFluent} from './assets.js';
import {captureAndroid, captureIos} from './capture.js';
import {CONFIG_FILE, loadConfig, localize, parseConfig, saveConfig} from './config.js';
import {credentialsPath, getKey, isProvider, keySource, mask, PROVIDERS, removeKey, setKey, type ProviderId} from './keys.js';
import {LAYOUT_DOCS} from './layouts/index.js';
import {launchBrowser, renderDeck} from './render/export.js';
import {writePreview} from './render/preview.js';
import {TARGETS} from './targets.js';
import {THEMES} from './themes/index.js';

const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {version: string};

const program = new Command();
program.name('shotforge').description('Beautiful App Store and Google Play screenshots from your real app screens.').version(pkg.version);
program.option('-c, --config <file>', 'config file', CONFIG_FILE);

const cfgPath = () => program.opts().config as string;
const log = (s = ''): void => void process.stdout.write(s + '\n');
const list = (v: string) =>
  v
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

function openFile(file: string) {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
  execFile(cmd, [file], () => {});
}

function fail(e: unknown): never {
  process.stderr.write(`\n✖ ${(e as Error).message}\n`);
  process.exit(1);
}

const run =
  <A extends unknown[]>(fn: (...a: A) => Promise<void> | void) =>
  async (...a: A) => {
    try {
      await fn(...a);
    } catch (e) {
      fail(e);
    }
  };

// ---------------------------------------------------------------- init
program
  .command('init')
  .description('Create a starter shotforge.json in the current folder')
  .option('--name <name>', 'app name', path.basename(process.cwd()))
  .option('--theme <id>', 'theme', 'bold-gradient')
  .option('--primary <hex>', 'brand color', '#3a6bff')
  .option('--locales <list>', 'comma-separated locales', 'en')
  .option('--force', 'overwrite an existing config')
  .action(
    run((o: {name: string; theme: string; primary: string; locales: string; force?: boolean}) => {
      const file = path.resolve(cfgPath());
      if (fs.existsSync(file) && !o.force) throw new Error(`${cfgPath()} already exists (use --force to overwrite)`);
      const shots = fs.existsSync('shots')
        ? fs
            .readdirSync('shots')
            .filter(f => /\.(png|jpe?g|webp)$/i.test(f))
            .sort()
        : [];
      const pick = (i: number) => (shots[i] ? `shots/${shots[i]}` : `shots/0${i + 1}.png`);
      const config = {
        $schema: 'https://unpkg.com/shotforge/schema.json',
        app: {name: o.name, description: 'One sentence about what the app does and who it is for.'},
        theme: o.theme,
        brand: {primary: o.primary, accent: '#ffb800'},
        locales: list(o.locales),
        targets: ['ios-6.9', 'android-phone'],
        output: 'out',
        slides: [
          {layout: 'hero', screenshot: pick(0), title: 'Your app’s\n*biggest promise*', subtitle: 'A short supporting line'},
          {
            layout: 'callouts',
            screenshot: pick(1),
            title: 'The *core* feature',
            callouts: [
              {title: 'First highlight', icon: 'check'},
              {title: 'Second highlight', icon: 'bolt'},
            ],
          },
          {layout: 'tilted', screenshot: pick(2), title: 'A *clear* result'},
          {layout: 'hero', screenshot: pick(3), title: 'One more *benefit*'},
        ],
      };
      fs.mkdirSync('shots', {recursive: true});
      saveConfig(file, config);
      log(`✓ Created ${cfgPath()}`);
      log(
        shots.length
          ? `  Using ${Math.min(4, shots.length)} screenshots found in shots/`
          : '  Put your screenshots in shots/ or run "shotforge capture ios home"',
      );
      log('  Next: shotforge ai plan --write   (AI writes the copy)  →  shotforge preview');
    }),
  );

// ---------------------------------------------------------------- catalog
program
  .command('themes')
  .description('List themes')
  .option('--json', 'print JSON')
  .action((o: {json?: boolean}) => {
    if (o.json)
      return log(
        JSON.stringify(
          THEMES.map(t => ({id: t.id, name: t.name, description: t.description, fits: t.fits})),
          null,
          2,
        ),
      );
    for (const t of THEMES) log(`${t.id.padEnd(16)} ${t.name}\n${''.padEnd(16)} ${t.description}\n${''.padEnd(16)} Fits: ${t.fits}\n`);
  });

program
  .command('layouts')
  .description('List layouts')
  .action(() => {
    for (const [k, v] of Object.entries(LAYOUT_DOCS)) log(`${k.padEnd(10)} ${v}`);
  });

program
  .command('targets')
  .description('List export sizes')
  .action(() => {
    for (const t of Object.values(TARGETS)) log(`${t.id.padEnd(14)} ${t.w}×${t.h}  ${t.label}`);
  });

// ---------------------------------------------------------------- render
program
  .command('render')
  .description('Export store-ready images into the output folder')
  .option('-t, --targets <list>', 'only these targets')
  .option('-l, --locales <list>', 'only these locales')
  .addOption(new Option('-f, --format <fmt>', 'image format').choices(['png', 'jpg']).default('png'))
  .option('--theme <id>', 'try another theme without editing the config')
  .option('--open', 'open the preview page when done')
  .option('--json', 'print the file list as JSON (for AI agents)')
  .action(
    run(async (o: {targets?: string; locales?: string; format: 'png' | 'jpg'; theme?: string; open?: boolean; json?: boolean}) => {
      const {config, dir} = loadConfig(cfgPath());
      const targets = o.targets ? list(o.targets) : config.targets;
      const locales = o.locales ? list(o.locales) : config.locales;
      const files = await renderDeck({
        config,
        baseDir: dir,
        targets,
        locales,
        format: o.format,
        themeId: o.theme,
        onFile: f => !o.json && log(`  ✓ ${path.relative(process.cwd(), f)}`),
      });
      const out = path.resolve(dir, config.output);
      const rows = targets.flatMap(t =>
        locales.map(l => ({
          title: TARGETS[t].label,
          subtitle: `${t} · ${l}`,
          files: files.filter(f => f.includes(`${path.sep}${t}${path.sep}${l}${path.sep}`)),
        })),
      );
      const preview = writePreview(path.join(out, 'preview.html'), `${config.app.name} · ${o.theme ?? config.theme}`, rows);
      if (o.json) log(JSON.stringify({files, preview}, null, 2));
      else log(`\n✓ ${files.length} images · preview: ${path.relative(process.cwd(), preview)}`);
      if (o.open) openFile(preview);
    }),
  );

program
  .command('preview')
  .description('Quickly render one target and one locale, then open the preview')
  .option('-t, --target <id>', 'target')
  .option('-l, --locale <code>', 'locale')
  .option('--theme <id>', 'try another theme')
  .option('--no-open', 'do not open the browser')
  .action(
    run(async (o: {target?: string; locale?: string; theme?: string; open: boolean}) => {
      const {config, dir} = loadConfig(cfgPath());
      const target = o.target ?? config.targets[0];
      const locale = o.locale ?? config.locales[0];
      const files = await renderDeck({
        config,
        baseDir: dir,
        targets: [target],
        locales: [locale],
        themeId: o.theme,
        outDir: path.join(config.output, '.preview'),
      });
      const preview = writePreview(path.resolve(dir, config.output, '.preview', 'index.html'), `${config.app.name} · ${o.theme ?? config.theme}`, [
        {title: TARGETS[target].label, subtitle: locale, files},
      ]);
      log(`✓ ${path.relative(process.cwd(), preview)}`);
      if (o.open) openFile(preview);
    }),
  );

program
  .command('gallery')
  .description('Render your screenshots with EVERY theme to compare them side by side')
  .option('-n, --slides <n>', 'slides per theme', '3')
  .option('--no-open', 'do not open the browser')
  .action(
    run(async (o: {slides: string; open: boolean}) => {
      const {config, dir} = loadConfig(cfgPath());
      const small = {...(TARGETS[config.targets[0]] ?? TARGETS['ios-6.9'])};
      small.id = 'gallery';
      small.w = Math.round(small.w / small.scale);
      small.h = Math.round(small.h / small.scale);
      small.scale = 1;
      const sub = {...config, slides: config.slides.slice(0, Number(o.slides))};
      const browser = await launchBrowser();
      const rows = [];
      try {
        for (const t of THEMES) {
          process.stdout.write(`  ${t.id}…`);
          const files = await renderDeck({
            config: sub,
            baseDir: dir,
            customTarget: small,
            locales: [config.locales[0]],
            themeId: t.id,
            outDir: path.join(config.output, '.gallery', t.id),
            browser,
            format: 'jpg',
          });
          rows.push({title: `${t.name} (${t.id})`, subtitle: t.fits, files});
          log(' ✓');
        }
      } finally {
        await browser.close();
      }
      const page = writePreview(path.resolve(dir, config.output, '.gallery', 'index.html'), `${config.app.name}: ${THEMES.length} themes`, rows);
      log(`✓ ${path.relative(process.cwd(), page)}\n  Pick one and set "theme" in ${cfgPath()}.`);
      if (o.open) openFile(page);
    }),
  );

// ---------------------------------------------------------------- capture
program
  .command('capture <platform> <name>')
  .description('Capture a screenshot from the iOS Simulator (ios) or an Android emulator/device (android) into shots/<name>.png')
  .option('--dir <dir>', 'output folder', 'shots')
  .option('--no-clean-status-bar', 'keep the status bar as it is')
  .action(
    run((platform: string, name: string, o: {dir: string; cleanStatusBar: boolean}) => {
      const file = path.resolve(o.dir, name.endsWith('.png') ? name : `${name}.png`);
      if (platform === 'ios') captureIos(file, o.cleanStatusBar);
      else if (platform === 'android') captureAndroid(file, o.cleanStatusBar);
      else throw new Error('platform must be ios or android');
      log(`✓ ${path.relative(process.cwd(), file)}`);
    }),
  );

// ---------------------------------------------------------------- keys
const keys = program.command('keys').description('Manage AI API keys (stored on this machine only)');

function askHidden(q: string): Promise<string> {
  return new Promise(resolve => {
    const rl = readline.createInterface({input: process.stdin, output: process.stdout, terminal: true});
    const out = rl as unknown as {_writeToOutput: (s: string) => void};
    out._writeToOutput = (s: string) => {
      if (s.startsWith(q)) process.stdout.write(q);
    };
    rl.question(q, a => {
      rl.close();
      process.stdout.write('\n');
      resolve(a.trim());
    });
  });
}

keys
  .command('set <provider> [key]')
  .description(`Save a key for: ${Object.keys(PROVIDERS).join(', ')}. Omit [key] to type it hidden.`)
  .action(
    run(async (provider: string, key?: string) => {
      if (!isProvider(provider)) throw new Error(`Provider must be one of: ${Object.keys(PROVIDERS).join(', ')}`);
      const k = key ?? (await askHidden(`${PROVIDERS[provider].label} API key: `));
      if (!k) throw new Error('Empty key');
      setKey(provider, k);
      log(`✓ Saved the ${PROVIDERS[provider].label} key to ${credentialsPath()}`);
    }),
  );

keys
  .command('list')
  .description('Show which keys are configured')
  .action(() => {
    for (const p of Object.keys(PROVIDERS) as ProviderId[]) {
      const k = getKey(p);
      log(`${p.padEnd(8)} ${k ? `${mask(k)}  (${keySource(p)})` : p === 'claude' ? '—  (will try an `ant auth login` profile if present)' : '—'}`);
    }
  });

keys
  .command('remove <provider>')
  .description('Delete a stored key')
  .action(
    run((provider: string) => {
      if (!isProvider(provider)) throw new Error(`Provider must be one of: ${Object.keys(PROVIDERS).join(', ')}`);
      removeKey(provider);
      log(`✓ Removed the ${provider} key`);
    }),
  );

// ---------------------------------------------------------------- ai
const ai = program.command('ai').description('Use AI to write copy, translate and generate artwork');

function pickTextProvider(flag: string | undefined, config?: {ai?: {text?: {provider: string}}}): ProviderId {
  const p = flag ?? config?.ai?.text?.provider ?? (['claude', 'openai', 'gemini', 'grok'] as ProviderId[]).find(x => getKey(x)) ?? 'claude';
  if (!isProvider(p)) throw new Error(`Provider must be one of: ${Object.keys(PROVIDERS).join(', ')}`);
  return p;
}

ai.command('plan')
  .description('Read the screenshots, write headlines for every locale, pick layouts (and suggest a theme and colors)')
  .option('-p, --provider <id>', 'claude | openai | gemini | grok')
  .option('-m, --model <id>', 'specific model')
  .option('--write', 'write the result into the config')
  .option('--apply-theme', 'also apply the suggested theme and colors')
  .action(
    run(async (o: {provider?: string; model?: string; write?: boolean; applyTheme?: boolean}) => {
      const {config, dir, file} = loadConfig(cfgPath());
      const provider = pickTextProvider(o.provider, config);
      const refs = config.slides.map((s, i) => {
        const r = localize(s.screenshot, config.locales[0]);
        if (!r) throw new Error(`Slide ${i + 1} has no screenshot`);
        return r;
      });
      const model = o.model ?? config.ai?.text?.model ?? DEFAULT_TEXT_MODELS[provider];
      log(`… ${PROVIDERS[provider].label} (${model}) is reading ${refs.length} screenshots`);
      const plan = (await generateJson({
        provider,
        model,
        system: PLAN_SYSTEM,
        prompt: planPrompt(config, refs),
        images: loadImages(dir, refs),
        schema: planSchema(config.locales),
      })) as Plan;
      log(`\nSuggested theme: ${plan.theme}  ·  colors ${plan.primary} / ${plan.accent}\n${plan.reasoning}\n`);
      plan.slides.forEach((s, i) =>
        log(
          `${String(i + 1).padStart(2)}. [${s.layout}] ${Object.entries(s.title)
            .map(([l, t]) => `${l}: ${t.replace(/\n/g, ' / ')}`)
            .join('  |  ')}`,
        ),
      );
      if (o.write) {
        const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
        const next = applyPlan(raw, plan, {applyTheme: Boolean(o.applyTheme)});
        parseConfig(next);
        saveConfig(file, next);
        log(`\n✓ Updated ${cfgPath()}${o.applyTheme ? ' (including theme and colors)' : ''}`);
      } else log('\n(add --write to save it to the config)');
    }),
  );

ai.command('translate')
  .description('Translate all copy into new locales and add them to "locales"')
  .requiredOption('--to <list>', 'target locales, e.g. de,ja,ko')
  .option('--from <code>', 'source locale (defaults to the first locale)')
  .option('-p, --provider <id>', 'claude | openai | gemini | grok')
  .option('-m, --model <id>', 'specific model')
  .action(
    run(async (o: {to: string; from?: string; provider?: string; model?: string}) => {
      const {config, file} = loadConfig(cfgPath());
      const provider = pickTextProvider(o.provider, config);
      const source = o.from ?? config.locales[0];
      const targets = list(o.to);
      const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
      const {refs, items} = translationJob(raw, source);
      log(`… translating ${items.length} strings ${source} → ${targets.join(', ')} with ${PROVIDERS[provider].label}`);
      const result = (await generateJson({
        provider,
        model: o.model,
        system: TRANSLATE_SYSTEM,
        prompt: `Source locale: ${source}. Target locales: ${targets.join(', ')}.\n${JSON.stringify(items)}`,
        schema: translateSchema(targets),
      })) as never;
      const next = applyTranslations(raw, source, refs, result, targets);
      parseConfig(next);
      saveConfig(file, next);
      log(`✓ Added ${targets.join(', ')} to ${cfgPath()}`);
    }),
  );

ai.command('asset <subject>')
  .description('Generate artwork (3D object, mascot, illustration, background) in your brand colors')
  .addOption(new Option('-s, --style <style>', 'style').choices(['3d', 'mascot', 'illustration', 'background']).default('3d'))
  .addOption(new Option('-p, --provider <id>', 'image provider').choices([...IMAGE_PROVIDERS]))
  .option('-m, --model <id>', 'specific model')
  .option('-o, --out <file>', 'output file (defaults to assets/<subject>.png)')
  .option('--prompt <text>', 'write your own prompt instead of the built-in template')
  .action(
    run(async (subject: string, o: {style: AssetStyle; provider?: ImageProvider; model?: string; out?: string; prompt?: string}) => {
      let colors = ['#3a6bff', '#ffb800'];
      let cfg: ReturnType<typeof loadConfig> | undefined;
      try {
        cfg = loadConfig(cfgPath());
        colors = [cfg.config.brand.primary, cfg.config.brand.accent ?? '#ffb800'];
      } catch {
        // works without a config too
      }
      const provider = o.provider ?? (cfg?.config.ai?.image?.provider as ImageProvider | undefined) ?? IMAGE_PROVIDERS.find(p => getKey(p)) ?? 'openai';
      const prompt = o.prompt ?? buildAssetPrompt(subject, o.style, colors);
      const slug = subject
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const out = path.resolve(cfg?.dir ?? '.', o.out ?? `assets/${slug || 'asset'}.png`);
      log(`… ${PROVIDERS[provider].label} (${o.model ?? DEFAULT_IMAGE_MODELS[provider]}) is drawing "${subject}" in ${o.style} style`);
      const png = await generateImage({provider, model: o.model, prompt, portrait: o.style === 'background'});
      fs.mkdirSync(path.dirname(out), {recursive: true});
      fs.writeFileSync(out, png);
      log(`✓ ${path.relative(process.cwd(), out)}`);
      if (provider !== 'openai' && o.style !== 'background') log('  Note: the image may have a white background (only OpenAI supports transparency).');
      log(`  Use it in a slide: "asset": "${path.relative(cfg?.dir ?? '.', out)}"`);
    }),
  );

// ---------------------------------------------------------------- assets
program
  .command('assets <query>')
  .description('Search free 3D icons (Microsoft Fluent Emoji, MIT). Use in a slide as "asset": "fluent:<Name>"')
  .action(
    run(async (query: string) => {
      const names = await searchFluent(query);
      if (!names.length) return log('Nothing found.');
      for (const n of names) log(`fluent:${n}`);
    }),
  );

program.parseAsync().catch(fail);
