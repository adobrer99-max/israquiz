# israquiz

An English-language election compass for the 26th Knesset, 27 October 2026.

49 statements across five topics, a topic-weighting step, three unscored cross-cutting questions, a
two-axis grid with the parties plotted, a ranked match percentage, and the full coding matrix published
alongside it.

Built to `israel-2026-compass-spec.md`. Section references throughout the source (`§4.2`, `§3.7`, and so
on) point back at that document.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # scoring engine + bank integrity + the §4.6 clustering smoke test
npm run build      # static site into dist/
```

## Deploying

A static site by default: no server, no database, no secrets. `npm run build`
writes `dist/`, which any static host will serve. Research collection is
optional and off unless `VITE_COLLECT_ENDPOINT` is set at build time — see
**Where answers go** below and `server/README.md`.

`vite.config.ts` sets `base: "./"`, so assets resolve relatively and the same
artifact works from an apex domain, a subdirectory, or a GitHub Pages project
path without reconfiguration.

**GitHub Pages** is wired up in `.github/workflows/deploy.yml`. Enable it once
under Settings → Pages → Source: **GitHub Actions**; after that every push to
`main` typechecks, runs the tests, builds, and publishes. Feature branches never
publish. The workflow fails the build if a third-party asset reference ever
reappears in the output.

**Cloudflare Pages** is the better choice if you want a custom domain: connect
the repo, build command `npm run build`, output directory `dist`. Free
certificates, and analytics without cookies — which matters for a page that
asks about religion and political opinion.

Type is **self-hosted** (`public/fonts/`), so the app makes no third-party
request at runtime and the intro screen's promise that nothing leaves your
browser is literally true. That was not the case while the fonts came from
Google, whose stylesheet sends every visitor's IP address to Google before the
quiz renders — a live GDPR question anywhere, and a sharper one here, since
§6.5.6 flags this instrument as collecting special-category data. Regenerate
with `node scripts/fetch-fonts.mjs`; see `public/fonts/README.md`.

Before publishing anything for real, `VERSION` in `src/data/editorial.ts` reads
`v0.2 — preview` and shows on every screen. §8.7 says v1 waits for the filed
lists in September.

Add `?validate=1` to the URL for validation mode (§4.7): the quiz asks for your intended vote up front and
then reports whether it recovered it, along with every statement where you flatly oppose that party. That
is the screen to hand to the fifteen-to-twenty known voters before launch.

## Running the validation round

`?validate=1` produces one JSON blob per tester. To turn a pile of them into findings:

```bash
npx vite-node scripts/validation-report.ts validation/    # writes validation/REPORT.md
```

`validation/BRIEF.md` has the message to send testers and how to read what comes
back. The headline recovery rate is the least interesting output; the table worth
having is **cells to re-check** — statements where several people who declared the
same party disagree with that party's coded position. A compass cannot check its
own codings, and that table is the only mechanism here that can. Cells the
editorial notes already flag as doubtful are marked, because an independent hit on
one of those is as close to proof as this exercise gets.

**Replies are gitignored and must stay that way.** One joins a named tester to a
declared vote and a full answer vector — the same join §6.5.1 keeps apart
everywhere else, and special-category data under GDPR. Only `BRIEF.md` is
committed.

## Layout

| Path | What lives there |
|---|---|
| `src/data/parties.ts` | Party registry — names, blocs, colours, ballot status |
| `src/data/items.ts` | The 49-item bank and the 13-column coding matrix, plus the JL merge and the Unity, Noam and Haredi Public Party overlays |
| `src/data/glossary.ts` | Glossary terms and the inline-annotation matcher (§5) |
| `src/data/editorial.ts` | Version stamp, coding uncertainties, instrument limits (§7) |
| `src/data/demographics.ts` | The optional post-result block (§6) |
| `src/lib/scoring.ts` | The whole of §4. Pure functions, no React |
| `src/lib/diagnostics.ts` | Pre-launch item validation (§4.7) |
| `src/lib/collect.ts` | The optional research submission — the only code that can transmit anything |
| `src/lib/validation.ts` | The §4.7 validation round: recovery rate and the miscoding table |
| `scripts/` | Font fetcher, and the validation-report CLI |
| `src/components/` | Screens |
| `server/` | Reference collection backend: Cloudflare Worker, D1 schema, analysis queries |

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

## A15, added mid-cycle

The bank asked nothing about encouraging the emigration of Gaza's population while three ballot entities
campaigned on it — Otzma Yehudit, Religious Zionism, and People of Israel, for which it is the central Gaza
plank. A compass silent on a position that openly held is not describing the choice in front of voters, so
the item went in rather than waiting for September.

It earns the slot on the numbers too: it separates 68% of party pairs, above `A4`'s 64%, and it is the only
thing keeping one pair off an identical security coordinate. `A4`, on whether Jewish settlement in Gaza may
resume, is the adjacent item and a different question — the two rows differ on Yashar, Yisrael Beiteinu,
Unity and People of Israel.

The wording follows `D8`: it names the policy as its supporters name it, because §5 requires a supporter to
accept the statement as a fair description of their own position, and it asks about state action rather than
about anyone's opinion of Gazans. As with `D8`, it should be said plainly that this item asks Arab and
Palestinian respondents about a policy aimed at people like them, and that no wording makes that comfortable.

Adding it cost a storage bump to `v4`. Every session saved before it is retired rather than resumed — a
resumed session would have produced a result computed over a questionnaire the respondent never saw.

## Block G — cross-cutting, coded, never scored

Three statements load on none of the five axes, and each would corrupt whichever axis it was forced onto.
They are asked after the topic weighting and reported as their own readout.

- **G1** — *An Arab party should be willing to join a coalition led by a Zionist party.* Measures
  coalitionability rather than ideology, and is the sharpest Ra'am / Joint List divide in the bank.
- **G2** — *The electoral threshold should be raised above its current 3.25%.* Parties answer from
  self-interest. It is the only configuration anywhere in the bank where Otzma Yehudit and Balad land on
  the same side, and both sides of it span blocs.
- **G3** — *The state should acknowledge and compensate for discrimination against Mizrahi immigrants in
  its early decades.* Looks like a national-identity item, but that axis is about Arab citizens, so it
  would load wrongly.

G3 has no party coded `D`. §5 requires a scored statement to draw both agreement and disagreement, and one
nobody opposes inflates every match percentage uniformly — which is the concrete reason block G exists
rather than a sixth weighted topic. Unscored, the agree-versus-neutral split still does the work: it is
the Shas-against-United Torah Judaism communal cut, which nothing else produces.

## Two items on placement

**A14, the Temple Mount, sits on the security axis rather than religion-and-state.** It makes a cut nothing
else in the bank makes — Otzma Yehudit and Religious Zionism agree, Shas and United Torah Judaism disagree,
Likud is neutral. But the haredi parties oppose Jewish prayer there *by holding the strictest rabbinic
position*: their authorities forbid entering the compound at all. On the religion axis the item would have
driven the two most religious parties toward the secular pole. As a sovereignty assertion, agree reads
correctly as hawkish, and a test pins the placement.

**B11, the Western Wall egalitarian plaza, codes Likud `N` rather than `D`.** The agreement was signed in
2016 and frozen in 2017 under coalition pressure, but the platform never repudiated it — §7's rule of
coding the stated position and documenting the choice.

## Six statements cut, and why

`A11`, `C2`, `C4`, `C7`, `C10` and `D5` each carried a coding row identical to another item's: no pair of
parties was separated by one and not the other, so they cost a question slot and told the scoring nothing
it did not already know. They are **retired rather than deleted** — kept in `RETIRED` with the item held in
each one's place and the reason recorded, and shown in the app under Diagnostics. §4.7 asks you to publish
what you cut and why; a cut is an editorial act and should be auditable.

Three of the six were in institutions and rule of law, which is a finding rather than an accident: the
judicial overhaul was a pure bloc fight, and every party's position on every judicial question was fixed by
which side of the coalition it sat on. That block is where a compass learns least.

`A8` and `C9` still duplicate each other and were kept on purpose — different blocks, so neither axis is
redundant, and §3.8 added C9 for a reason that should make it diverge once Ra'am's column is re-coded. A
test pins that as the only surviving duplicate.

## Presentation order

§8.9 says to randomise items within each block and never across blocks, because
interleaving topics raises abandonment. Testers found the gap it left: the
blocks themselves ran in a fixed order, so everyone met twelve security
statements first and the primacy effect landed on one of the two axes the grid
is built from. Blocks are now shuffled as whole units, items shuffled within
them, and never interleaved — topic coherence, the thing §8.9 was protecting, is
untouched. Both shuffles come from one persisted seed, so going back and
resuming never reshuffle.

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
4. **Balad cannot surface in the ranking, and now never will.** It takes no position on intra-Jewish
   religion-and-state questions, and the Joint List merge absorbs that silence into a ballot column.
   While the alliance was provisional this was an artefact that might have dissolved; with Hadash–Ta'al
   and Balad confirmed to be running together it will not. Someone whose views sit closest to Balad
   specifically sees the Joint List instead, and the component readout below the ranking is the only
   place that difference appears — which is why those columns stay published.

## Before this is published

The spec's §8 checklist still applies in full. In particular: re-verify every coding against the platforms
of the lists actually filed in September, re-run the clustering check, drop any party that misses the
ballot, and publish a dated changelog with a corrections form. Until then this build says **preview** on
every screen, and it should keep saying it.

## Where answers go

By default, nowhere. Answers live in two `localStorage` keys on the respondent's own device —
`israquiz.session.v3` and `israquiz.demographics.v3` — kept apart deliberately (§6.5.1) and joined only by
a random response id, so the export hands over two tables rather than one fingerprint. With no collection
endpoint configured there is no analytics, no cookie and no reachable `fetch` in the bundle; the only route
out is the JSON blob a respondent copies from the results page. The intro screen says so, and a CI check
fails the build if any origin other than the configured endpoint appears in it.

That is enough for the §4.7 validation round, where a handful of known voters email their results back. It
is not enough for anything in §6: without collection there is no aggregate, and no way to compute the vote
recall crosstab §6.4 calls the most publishable output here.

### Optional research collection

Set `VITE_COLLECT_ENDPOINT` at build time — in CI, a repository *variable* named `COLLECT_ENDPOINT` — and
a contribute section appears at the bottom of the results page. `server/` holds a reference backend
(Cloudflare Worker plus D1, one file) and `server/README.md` the deployment steps. Unset the variable and
the feature is gone from the artifact rather than merely hidden, which is the point of making it a
build-time value.

This is research, not a product. Nothing is sold, nothing goes to a campaign or a party, and there is no
advertising anywhere in it. What that obliges, and what the code does about it:

- **Opt-in, once, at the end.** Two checkboxes, both unticked. Nothing is transmitted while anyone is
  answering, and skipping changes nothing about the result.
- **Consent to the answers and to the background block are separate controls.** §6.5.1 treats them as two
  tables; binding them into one decision would be incoherent.
- **Exactly what will be sent is shown before it is sent**, in full, rather than described.
- **The payload names every field it carries** instead of spreading the session object, so a field added
  later cannot start transmitting itself. Validation-mode tester initials are stripped — free text about a
  person from a cohort of fifteen (§6.5.4). So are the seed, the index and the saved-at stamp.
- **Withdrawal takes one click and no email.** The response id is a v4 UUID held only by the device that
  sent it, so the person who submitted is the only one who can name the row. Both rows are deleted.
- **No IP address, user agent, referer or cookie is stored.** There are no columns for them, Worker
  observability is off, and the error path logs a message and never a body.
- **Retention is 24 months, swept nightly by a cron trigger**, because a promise nothing enforces decays
  into an intention.
- **`server/queries.sql` compiles the disclosure rules into the SQL** — `HAVING COUNT(*) >= 30` on every
  query that touches demographics, 50 for observance × district, no three-way crosstabs, and never a
  published join of a full answer vector to a full demographic vector.
- **It is not a poll and must never be called one.** Anyone who reaches the page can answer it.

The instrument collects political opinion alongside religion, observance and ethnicity — special-category
data under GDPR and UK GDPR, and there will be EU and UK respondents. §6.5.6 asks for the consent text to
be reviewed by someone qualified before launch, and that is not a formality. The wording lives in
`src/components/Contribute.tsx`; when it changes materially, bump `CONSENT_VERSION` in `src/lib/collect.ts`
so stored rows stay attributable to what their respondents were actually shown.

**Bump the key version** in `src/lib/storage.ts` whenever a change makes an in-flight session
unresumable — a new item, a reordering, anything that alters what a stored `seed` produces. Superseded
keys are deleted on first load, so stale special-category data is not stranded in a browser with no way to
clear it from inside the app.
