# Self-hosted type

These faces are served from this origin rather than from Google Fonts. The
reason is not performance: the intro screen tells respondents that nothing they
answer leaves their browser, and a stylesheet fetched from a third party sends
every visitor's IP address to that third party before a word of the quiz is
read. Given that this instrument collects religion, ethnicity and political
opinion together — special-category data under GDPR and UK GDPR, per §6.5.6 of
the spec — that request was the one thing making the promise untrue.

Self-hosting also means the app has no runtime dependency on anything outside
its own origin.

## What is here

| Family | Files | Notes |
|---|---|---|
| Archivo | `archivo-var-*` | Variable. One file per subset serves 400–700. |
| Source Serif 4 | `source-serif-var-latin` | Variable, latin only — it sets statement text, which is ASCII plus latin-range punctuation. |
| IBM Plex Mono | `plex-mono-{400,600,700}-*` | Static; one file per weight. |

Subsets are `latin` and `latin-ext`. The latter is needed for `†`, used as a
footnote marker in the coding matrix; nothing here needs Cyrillic, Greek or
Vietnamese. Nine files, about 270 KB, all with `font-display: swap` so text
renders immediately in the fallback stack.

## Licences

All three are under the SIL Open Font License 1.1, whose terms are met by
shipping the licence alongside the fonts. Full texts are in this directory.

- **Archivo** — Copyright 2020 The Archivo Project Authors. `LICENSE-Archivo.txt`
- **IBM Plex Mono** — Copyright © 2017 IBM Corp, with Reserved Font Name "Plex".
  `LICENSE-IBM-Plex-Mono.txt`
- **Source Serif 4** — Copyright 2014–2023 Adobe, with Reserved Font Name
  'Source'. `LICENSE-Source-Serif-4.md`

## Regenerating

`node scripts/fetch-fonts.mjs` re-fetches from the Google Fonts API, dedupes the
variable families, and rewrites `public/fonts.css`. Run it if a weight is added
to the design, and check the resulting file count and size — a family that
silently stops being variable will triple its footprint.
