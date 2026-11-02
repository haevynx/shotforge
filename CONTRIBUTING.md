# Contributing to shotforge

Thanks for taking the time to contribute! Bug reports, new themes and layouts, docs fixes and translations are all welcome.

## Getting started

```bash
git clone https://github.com/haevynx/shotforge.git
cd shotforge
npm install
npm test
```

You need Node.js 20+ and Google Chrome (or `npx playwright install chromium`) to render images.

Useful scripts:

| Script                     | What it does                                                                           |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `npm run dev -- <command>` | Run the CLI from source, e.g. `npm run dev -- render -c examples/lumen/shotforge.json` |
| `npm test`                 | Run the unit tests                                                                     |
| `npm run typecheck`        | Type-check without emitting                                                            |
| `npm run format`           | Format with Prettier                                                                   |
| `npm run build`            | Compile to `dist/` and regenerate `schema.json`                                        |

## Project layout

```
src/
  cli.ts            command definitions
  config.ts         zod schema for shotforge.json
  themes/           visual styles (background, type, device frame, decoration)
  layouts/          per-slide compositions
  render/           HTML building, device frame, PNG export and preview
  ai/               copywriting, translation and image generation
  capture.ts        iOS Simulator and Android capture
  keys.ts           local API key storage
test/               vitest unit tests
examples/lumen/     a complete example project
```

## Adding a theme

1. Add an entry to `THEMES` in `src/themes/index.ts`. Derive colors from `c.brand.primary` and `c.brand.accent` rather than hard-coding them, so the theme works for every brand.
2. Render the example with it: `npm run dev -- gallery -c examples/lumen/shotforge.json`.
3. Check both an iOS and an Android target, and a light and a dark screenshot.
4. Add it to the theme table in `README.md`.

Good themes come from real store listings. Mention what inspired yours in the pull request, but do not copy another product's branding, artwork or copy.

## Adding a layout

1. Add a function to `LAYOUTS` in `src/layouts/index.ts` and describe it in `LAYOUT_DOCS`.
2. Add the name to `LAYOUTS` in `src/config.ts`.
3. Make sure it works in every theme. The test `renders every theme with every layout` helps here.
4. Document any new slide fields in `docs/configuration.md`.

## Pull requests

- Keep each pull request focused on one change.
- Run `npm run typecheck`, `npm test` and `npm run format:check` before pushing.
- For visual changes, attach before and after images.
- Write commit messages in the imperative mood, e.g. "Add dusk theme" or "Fix span overlap on Android".

## Reporting bugs

Open an issue with your shotforge version (`shotforge --version`), Node version, OS, the command you ran, and the relevant part of your `shotforge.json`. Remove API keys and anything confidential from screenshots and logs first.

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating you agree to uphold it.
