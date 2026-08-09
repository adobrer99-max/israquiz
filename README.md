# israquiz

An English-language election compass for the 26th Knesset, 27 October 2026.

48 statements across five topics, a topic-weighting step, a two-axis grid with the parties plotted,
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
| `src/data/items.ts` | The 48-item bank and the 13-column coding matrix, plus the JL merge and ERD overlays |
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

## Items added after validation

The first run of the §4.6 clustering check found the security axis coding The Democrats, Ra'am and the
Joint List identically on all twelve items — all three on the same point, with the axis carrying no
information about the largest difference between them. Two statements were added rather than the
coordinates adjusted:

- **A13** — *Armed attacks on Israeli soldiers in the West Bank should be condemned without qualification.*
  Block A, hawk-positive.
- **D7** — *Zionism is a legitimate expression of Jewish national self-determination.* Block D,
  ethnonational-positive.

D7 belongs on the identity axis, not the security one. The Democrats are both Zionist and dovish, and an
item that scored those together as hawkishness would wreck the horizontal axis. Placed on D it also
resolves the identical three-way collapse that block had.

Two things fell out of this worth keeping:

**A13 is the most lopsided item in the bank and should not be cut for it.** Eleven of the thirteen ballot
entities agree with it, so by variance alone it reads as dead weight. It is also one of only two items
preventing an axis collapse. The diagnostics therefore report both numbers — *split* (share of party pairs
separated) and *holds* (pairs that would land on an identical coordinate without it). A1 has twice A13's
split and holds nothing.

**A13 is the first item to divide the Joint List outside religion-and-state and economics.** Hadash–Ta'al
is `N`, Balad `D`, so the merged column resolves to `N`. The spec's observation that the three components
are identical on security held only because the bank had not asked the question that divides them.

## What the instrument still cannot do

Under **Diagnostics** in the app, recorded rather than smoothed over:

1. **The Democrats and Ra'am remain on the same point on security** — identical on all thirteen items,
   which is a fair reading of two parties whose operative positions coincide. They do not collide on the
   grid, being 167 points apart vertically.
2. **Institutions still collapses three ways, twice.** Likud with Otzma Yehudit and Religious Zionism at
   one pole; The Democrats with Ra'am and the Joint List at the other. Both look real rather than
   artefactual, and institutions is a reported bar rather than a grid axis.
3. **Yashar plots at −60 on religion** rather than near the origin. This is reported as a finding, not
   corrected: the party has published no platform, and its five coded religion-and-state cells all lean
   secular while the other five are genuinely unstated. Whether that silence is strategy or an absence of
   settled policy is a question about the party, not about the instrument.

## Before this is published

The spec's §8 checklist still applies in full. In particular: re-verify every coding against the platforms
of the lists actually filed in September, re-run the clustering check, drop any party that misses the
ballot, and publish a dated changelog with a corrections form. Until then this build says **preview** on
every screen, and it should keep saying it.

Nothing a respondent answers leaves their browser. Progress is saved to `localStorage` so a session can be
resumed; demographics are stored under a separate key, joined to the answer vector only by a random
response id.
