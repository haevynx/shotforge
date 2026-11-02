# Security policy

## Supported versions

Security fixes are released for the latest minor version of shotforge.

## Reporting a vulnerability

Please do not open a public issue for security problems. Report them privately through [GitHub security advisories](https://github.com/haevynx/shotforge/security/advisories/new). You will get a response within a few days, and a fix or mitigation plan once the issue is confirmed.

## How shotforge handles your data

- API keys are read from environment variables or stored in `~/.config/shotforge/credentials.json` with file mode `600`. They are only sent to the provider they belong to.
- Screenshots are rendered locally in a headless browser. They are only sent to an AI provider when you run an `ai` command, and only to the provider you chose.
- Rendering loads fonts from Google Fonts and, if you use them, icons from jsDelivr and illustrations from DiceBear. Use local files for assets if you need a fully offline setup.

Screenshots of real apps often contain personal data. Capture store screenshots from a demo account with sample data.
