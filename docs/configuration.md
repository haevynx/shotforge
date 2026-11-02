# Configuration reference

shotforge reads `shotforge.json` from the current folder (or the file passed with `--config`). Paths inside it are relative to the config file. The full JSON Schema ships as [`schema.json`](../schema.json); add `"$schema": "https://unpkg.com/shotforge/schema.json"` for autocomplete.

## Top level

| Field             | Type                 | Default         | Description                                                 |
| ----------------- | -------------------- | --------------- | ----------------------------------------------------------- |
| `app.name`        | string               | required        | App name, used in previews and AI prompts                   |
| `app.description` | string               |                 | One sentence about the app. Gives the AI context            |
| `theme`           | string               | `bold-gradient` | Theme id, see `shotforge themes`                            |
| `brand.primary`   | color                | `#3a6bff`       | Main brand color. Themes derive their palette from it       |
| `brand.accent`    | color                | `#ffb800`       | Secondary color for highlights, chips and accents           |
| `brand.font`      | string               | theme font      | Any Google Fonts family for headlines                       |
| `brand.logo`      | path                 |                 | Square logo, shown by the `awards` layout                   |
| `locales`         | string[]             | `["en"]`        | Locales to render. The first one is the fallback            |
| `targets`         | string[]             | `["ios-6.9"]`   | Export sizes, see `shotforge targets`                       |
| `output`          | path                 | `out`           | Output folder                                               |
| `ai.text`         | `{provider, model?}` |                 | Default provider and model for `ai plan` and `ai translate` |
| `ai.image`        | `{provider, model?}` |                 | Default provider and model for `ai asset`                   |
| `slides`          | Slide[]              | required        | One entry per screenshot in the set                         |

## Text

Every text field accepts either a string or a per-locale map:

```json
"title": "Same text in every locale"
"title": {"en": "Your whole day,\n*one tap away*", "vi": "Cả ngày của bạn\n*gọn trong một chạm*"}
```

Inside text:

- `*keyword*` is emphasized. The theme decides how (brand color, italic, underline…).
- `**phrase**` is bold. Handy for a bold lead sentence in `brand-classic`.
- `\n` breaks the line. Keep headlines to two lines and about six words.

If a locale is missing, the first locale in `locales` is used.

## Slides

| Field         | Used by      | Description                                                                                                                         |
| ------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `layout`      | all          | `hero`, `tilted`, `callouts`, `caption`, `awards`, `quote`, `object`, `stat`, `duo`, `span`. Defaults to the theme's default layout |
| `screenshot`  | most         | Path, or a per-locale map of paths for localized screenshots                                                                        |
| `screenshot2` | `duo`        | The second, background device                                                                                                       |
| `label`       | all          | Small uppercase kicker above the headline                                                                                           |
| `title`       | all          | The headline                                                                                                                        |
| `subtitle`    | all          | Supporting line. In `object` it becomes a pill button under the object                                                              |
| `footnote`    | all          | Small print at the bottom, e.g. legal disclaimers                                                                                   |
| `icon`        | `warm-cream` | Icon shown above the caption                                                                                                        |
| `asset`       | `object`     | The hero object                                                                                                                     |
| `assets`      | all          | Extra decorations: `[{src, x, y, size, rotate}]` on the 320-unit wide canvas                                                        |
| `callouts`    | `callouts`   | Up to 4 cards: `{title, sub?, icon?, color?}`                                                                                       |
| `awards`      | `awards`     | Up to 4 lines of text framed by laurels                                                                                             |
| `rating`      | `awards`     | `{score: "4.9", count: "120K ratings"}`                                                                                             |
| `press`       | `awards`     | `{quote, source}`                                                                                                                   |
| `quote`       | `quote`      | `{text, author?}`                                                                                                                   |
| `stat`        | `stat`       | `{value: "2×", label}`                                                                                                              |
| `background`  | all          | Any CSS background that overrides the theme for this slide                                                                          |

## Assets

Anywhere an asset is accepted (`asset`, `assets[].src`, `brand.logo`) you can use:

| Value                   | Source                                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `assets/hourglass.png`  | A file in your project. Transparent PNGs work best                                                                               |
| `fluent:Hourglass done` | [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) 3D icons (MIT). Find names with `shotforge assets <query>` |
| `peep:Alex`             | [Notionists](https://www.dicebear.com/styles/notionists/) illustrations (CC0). Any seed gives a different character              |
| `https://…`             | Any image URL                                                                                                                    |

`shotforge ai asset "<subject>"` generates a custom asset in your brand colors and prints the value to paste.

## Icons

`callouts[].icon` and `slides[].icon` accept: `check`, `heart`, `moon`, `bolt`, `plane`, `lock`, `bell`, `sun`, `leaf`, `bag`, `chart`, `spark`, `home`, `pin`, `mail`, `cam`, `shield`, `doc`, `car`, `calendar`, `users`, `clock`, `star`.

## The design canvas

Layouts are designed on a canvas 320 units wide. Its height follows the target's aspect ratio (about 695 units for `ios-6.9`, 640 for `android-phone`). `assets[].x`, `y` and `size` use these units, so a decoration lands in the same spot on every target.
