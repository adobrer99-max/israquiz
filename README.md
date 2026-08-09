# israquiz

An English-language election compass for the 26th Knesset, 27 October 2026.

46 statements across five topics, a topic-weighting step, a two-axis grid with the parties plotted,
a ranked match percentage, and the full coding matrix published alongside it.

Built to `israel-2026-compass-spec.md`. Section references throughout the source (`§4.2`, `§3.7`, and so
on) point back at that document.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # scoring engine + bank integrity + the §4.6 clustering smoke test
npm run build      # static site into dist/
```

Add `?validate=1` to the URL for validation mode (§4.7): the quiz asks for your intended vote up front and
then reports whether it recovered it, along with every statement where you flatly oppose that party. That
is the screen to hand to the fifteen-to-twenty known voters before launch.

## Layout

| Path | What lives there |
|---|---|
| `src/data/parties.ts` | Party registry — names, blocs, colours, ballot status |
| `src/data/items.ts` | The 46-item bank and the 13-column coding matrix, plus the JL merge and ERD overlays |
| `src/data/glossary.ts` | Glossary terms and the inline-annotation matcher (§5) |
| `src/data/editorial.ts` | Version stamp, coding uncertainties, instrument limits (§7) |
| `src/data/demographics.ts` | The optional post-result block (§6) |
| `src/lib/scoring.ts` | The whole of §4. Pure functions, no React |
| `src/lib/diagnostics.ts` | Pre-launch item validation (§4.7) |
| `src/components/` | Screens |

The engine is party-agnostic. Mergers, splits and threshold failures are absorbed by editing
`parties.ts` and the coding strings in `items.ts`; no scoring code changes.

## Scoring, in brief

- **Match** compares direction only (§4.1). A party either takes a position or it doesn't, so intensity is
  discarded here: same side 2, one side neutral 1, opposite sides 0. Weighted by the user's topic
  allocation, and always computed unweighted alongside.
- **Axis coordinates** use the raw 5-point response with no topic weights (§4.3), because caring intensely
  about security doesn't make you more hawkish.
- **No opinion** is excluded from every calculation rather than treated as neutral.
- **Coverage floor** of 70%: parties coded on too few items are shown in a separate *insufficient position
  data* list rather than being allowed to win a ranking. That is what keeps a two-day-old party off the
  podium.

## Statements that will need re-coding

`A5` is pinned to a live negotiation and is the one item a news cycle can invalidate rather than merely
re-code. A durable replacement is drafted in `items.ts`; swap it with a one-line change:

```ts
export const A5_VARIANT: A5Variant = "durable";
```

Everything else — polarity, the Joint List merge, the tests — follows automatically.

## Two things the instrument cannot currently do

Both surface in the app under **Diagnostics**, and both are recorded rather than smoothed over:

1. **The security axis cannot separate The Democrats, Ra'am and the Joint List.** All three are coded
   identically on all twelve security items, so they sit at exactly the same point. §4.6 expects the Joint
   List further left. The fix is a discriminating statement, not a nudge to the coordinates.
2. **Yashar plots at −60 on religion**, well clear of the origin its unstated platform should produce,
   because its five coded cells all lean secular and the other five are `N`. If those are really "unstated"
   rather than "centrist", they belong as no-position codings.

## Before this is published

The spec's §8 checklist still applies in full. In particular: re-verify every coding against the platforms
of the lists actually filed in September, re-run the clustering check, drop any party that misses the
ballot, and publish a dated changelog with a corrections form. Until then this build says **preview** on
every screen, and it should keep saying it.

Nothing a respondent answers leaves their browser. Progress is saved to `localStorage` so a session can be
resumed; demographics are stored under a separate key, joined to the answer vector only by a random
response id.
