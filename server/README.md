# Collection endpoint

A reference backend for the optional research submission on the results page.
Cloudflare Worker plus D1: one file, two tables, no framework, free at the
volumes this will see.

**The app works without it.** With no `VITE_COLLECT_ENDPOINT` set at build time
the contribute section never renders, the client contains no reachable `fetch`,
and the intro screen goes back to promising that nothing leaves the browser.
Deploying this is a decision to start collecting, and it should be made once,
deliberately, and after the checklist at the bottom.

## Deploy

```bash
npm install -g wrangler          # or npx wrangler …
wrangler login

wrangler d1 create israquiz      # copy the database_id into wrangler.toml
wrangler d1 execute israquiz --remote --file=./schema.sql

# ALLOWED_ORIGINS in wrangler.toml must list the exact origin the app is
# served from — https://adobrer99-max.github.io, or your custom domain.
wrangler deploy
```

Then point the site at it. The URL is public and not a secret, so it is a
repository **variable**, not a repository secret:

```
Settings → Secrets and variables → Actions → Variables → New variable
  Name:  COLLECT_ENDPOINT
  Value: https://israquiz-collect.israquiz.workers.dev
```

The deploy workflow passes it to the build as `VITE_COLLECT_ENDPOINT`. Delete
the variable and the next deploy has no collection at all — which is the
intended off switch, and the reason the endpoint is a build-time value rather
than something configurable at runtime.

Locally:

```bash
VITE_COLLECT_ENDPOINT=http://127.0.0.1:8787 npm run dev
wrangler dev            # in server/, with ALLOWED_ORIGINS=http://localhost:5173
```

## Deploying from GitHub instead

Cloudflare's Git integration (Workers Builds) can run the deploy on push. It
needs one setting changed from the default, and it changes one thing about this
repository that is worth deciding deliberately rather than discovering.

**Set the build's root directory to `server`.** Settings → Build → Root
directory. Left at the repository root, wrangler finds no config, falls back to
framework detection, and picks up the only thing it can see — the React
frontend:

```
- Worker Name: israquiz
- Framework: Vite
- Build Command: npm run build
- Output Directory: dist
```

On Vite 5 that fails with *"The version of Vite used in the project cannot be
automatically configured. Please update the Vite version to at least 6.0.0"*.
The Vite version is irrelevant to this Worker and upgrading to satisfy the
message is the wrong fix: it clears the error and then deploys the site as a
second Worker, built without `VITE_COLLECT_ENDPOINT` and served from an origin
that is not in `ALLOWED_ORIGINS`. The site is deployed by
`.github/workflows/deploy.yml` to GitHub Pages; only the Worker belongs here.
`npx wrangler deploy --config server/wrangler.toml` from the repository root
works too — `main` resolves relative to the config file — but the root-directory
setting is the one that stops the fallback from happening at all.

Four consequences, in the order they bite:

1. **`database_id` has to be committed.** The build reads `wrangler.toml` from
   git, and the id lives in the config rather than the environment, so there is
   nowhere else to put it. It is not a credential — it does nothing without
   account access — but it is public from then on. Deploying from a laptop keeps
   the placeholder in the repository; this route does not. Decide which you want
   before the first push, because the decision is hard to take back.
2. **The Worker is named `israquiz-collect`**, from `name` at the top of this
   file's neighbour. A first failed build under the repository's own name leaves
   an empty project behind; delete it, or the dashboard grows a second entry and
   a `workers.dev` hostname that serves nothing.
3. **The schema is still applied by hand.** `wrangler deploy` runs no
   migrations and neither does the Git integration. `wrangler d1 execute
   israquiz --remote --file=./schema.sql`, once, from a machine that is logged
   in. Skipping it fails exactly as described below.
4. **Every push to `main` redeploys the collector.** An `ALLOWED_ORIGINS` edit
   goes live on merge rather than when someone decides it should, and a wrong
   one 403s every submission with no command run and no console open. The two
   switches this design turns on — deploy the Worker, then set
   `COLLECT_ENDPOINT` — stay separate, but the first one stops being an
   explicit act.

## Check it before you deploy it

`server/worker.test.mjs` stubs the database binding, so those 14 tests prove the
validation and the statement *shapes* — they never execute a line of SQL. A
column-count mismatch or a typo in an `ON CONFLICT` clause passes the whole suite
and fails on the first real submission, after someone has ticked a consent box.

Miniflare backs `--local` with real SQLite, so the Worker can be exercised end to
end without a Cloudflare account:

```bash
cd server
# --local ignores database_id, but the file must still parse; any well-formed
# uuid does. Put back whatever was there before — the placeholder if you deploy
# by hand, the real id if the Git integration deploys for you.
sed -i 's/REPLACE_WITH_YOUR_D1_ID/00000000-0000-0000-0000-000000000000/' wrangler.toml
npx wrangler d1 execute israquiz --local --file=./schema.sql
npx wrangler dev --local --port 8799
```

Then POST a payload the app actually produces, rather than one written by hand.
`buildSubmission` in `src/lib/collect.ts` is the source of truth for the shape,
and this runs it over synthetic answers to emit one:

```bash
npx vite-node scripts/smoke-payload.ts     # writes payload.json, from the repo root
```

Its response id is the fixed `deadbeef-0000-4000-8000-000000000001`, so the
withdrawal that deletes the test row can be copied from below without first
going to look up what was sent.

```bash
curl -X POST http://127.0.0.1:8799/ \
  -H 'content-type: application/json' \
  -H 'origin: https://adobrer99-max.github.io' \
  --data-binary @payload.json
npx wrangler d1 execute israquiz --local --command "SELECT * FROM responses;"
```

Worth walking every path, because each one has SQL the tests do not run: a
submission with demographics, the same id sent twice (must replace, not
duplicate), the same id sent again *without* demographics (must delete the
demographic row — that is how withdrawing consent for the background block
works), a withdrawal (must clear both tables), and the retention `DELETE`s from
the `scheduled` handler.

`server/.wrangler/` holds the local database and is gitignored. Do not leave the
throwaway uuid committed: by hand it is merely wrong, but under the Git
integration it is a `database_id` that resolves to nothing, and the Worker
deploys green and then cannot find a table.

## Check it once it is live

The local run proves the SQL. It cannot prove the deployment, and the two differ
in ways that only bite in production:

- `wrangler d1 execute --remote --file=./schema.sql` is a separate command from
  the local one. Skip it, or point it at the wrong database, and the Worker
  deploys cleanly and fails on the first real submission with a missing-table
  error — after a respondent has ticked a consent box.
- The remote binding resolves `database_id`; the local one ignores it entirely.
  A clean local run says nothing about whether that id is right.
- `ALLOWED_ORIGINS` is only exercised for real once a browser sends a genuine
  `Origin` header at a public URL.

This is what the two separate switches are for. The Worker is live and receiving
nothing until `COLLECT_ENDPOINT` is set, so this is the window to prove it works.

Watch the logs in one shell:

```bash
npx wrangler tail
```

In another, send a real submission — `scripts/smoke-payload.ts` again, not JSON
written by hand, for the same reason as the local check:

```bash
ENDPOINT=https://israquiz-collect.israquiz.workers.dev
curl -i -X POST "$ENDPOINT" \
  -H 'content-type: application/json' \
  -H 'origin: https://adobrer99-max.github.io' \
  --data-binary @payload.json          # expect 200 {"ok":true}
```

Confirm it reached the **remote** database. This is the step that catches a
schema never applied with `--remote`:

```bash
npx wrangler d1 execute israquiz --remote --command "SELECT COUNT(*) FROM responses;"
```

Confirm the allowlist is live:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$ENDPOINT" \
  -H 'content-type: application/json' -H 'origin: https://evil.test' \
  --data-binary @payload.json          # expect 403
```

**Then delete the test row.** Send a withdrawal for the same `responseId` and
re-run the count, expecting zero:

```bash
curl -s -X POST "$ENDPOINT" -H 'content-type: application/json' \
  -H 'origin: https://adobrer99-max.github.io' \
  -d '{"format":"israquiz.withdrawal.v1","responseId":"deadbeef-0000-4000-8000-000000000001"}'
npx wrangler d1 execute israquiz --remote --command "SELECT COUNT(*) FROM responses;"
```

That leaves the database empty, so the first real respondent is genuinely the
first row. A test record left behind is a row someone later has to explain, and
it quietly corrupts the first `n` you report.

The cron trigger fires at 03:17 UTC. The day after deploying, the retention query
at the end of `queries.sql` should return zero — that is the first evidence the
sweep is actually scheduled rather than merely configured.

## Protocol

One route, POST only, JSON in and JSON out, CORS locked to an exact-origin
allowlist.

```jsonc
// submission
{
  "format": "israquiz.submission.v1",
  "instrument": { "version": "v0.2 — preview", "itemCount": 50, "a5Variant": "live", … },
  "consent":    { "version": "consent-2026-08-10", "at": "…", "demographics": false },
  "responses":  { "responseId": "…", "answers": {…}, "weights": {…}, … },
  "demographics": null            // or { "responseId": "…", "D0": "Israel", … }
}

// withdrawal
{ "format": "israquiz.withdrawal.v1", "responseId": "…" }
```

Both are idempotent. Re-submitting the same `responseId` replaces the row
rather than adding one, and a submission that arrives without demographics
deletes any demographic row that already exists — so withdrawing consent for
the background block by re-sending without it actually withdraws it.

Withdrawal always answers 200, whether or not a row existed. Any other
behaviour turns the endpoint into an oracle for testing whether a given id was
ever submitted.

## What it does not store

No IP address, no user agent, no referer, no cookie, no email, no name. There
are no columns for them, `[observability]` is off in `wrangler.toml`, and the
error path logs `err.message` and never the body. Turning Cloudflare's request
logging on would quietly undo all of that, so don't — and if you must for a
debugging session, turn it off again and say so in the changelog.

Nothing here is a trust exercise: the payload is validated by shape and size
before it reaches the database. Demographic values are capped at 96 characters
and their keys must match `D<digits>`, which is what enforces §6.5.4's no-free-
text rule against a tampered client rather than only against an honest one.

## Reading the data

`queries.sql` holds the analysis queries with the disclosure rules compiled in:

- Every query touching the demographics table carries its own `HAVING COUNT(*)
  >= 30`. A suppression rule you have to remember applying is one you will
  eventually forget.
- Observance × district uses 50, not 30. Both categories are small and
  geographically concentrated.
- No three-way crosstabs. Two variables plus a `WHERE` filter is a three-way
  crosstab wearing a coat.
- Never publish, export, or hand to a collaborator anything that joins a full
  answer vector to a full demographic vector. That combination is a fingerprint
  with no name on it, which is the entire reason there are two tables.
- Never call the aggregate a poll. Anyone who reaches the page can answer it,
  so the respondents are not a sample of the Israeli electorate, and the
  distinction stops being available the first time it is blurred.

## Retention

24 months, swept nightly by the `scheduled` handler against
`RETENTION_MONTHS`. The last query in `queries.sql` should always return zero;
if it does not, the cron trigger is not firing and the retention promise has
quietly stopped being true.

## Before you turn this on

The instrument collects political opinion alongside religion, observance and
ethnicity. All three are special-category data under GDPR and UK GDPR, and
there will be EU and UK respondents, so the lawful basis has to be explicit
consent — which is what the two unticked checkboxes and the recorded
`consent-…` version are for.

1. **Have the consent text reviewed by someone qualified.** §6.5.6 asks for
   this and it is not a formality. The wording lives in
   `src/components/Contribute.tsx`; when it changes materially, bump
   `CONSENT_VERSION` in `src/lib/collect.ts` so rows stay attributable to what
   their respondents were actually shown.
2. Name a controller and publish a contact route. Self-service withdrawal
   covers erasure for anyone still holding the device that submitted; it does
   not cover someone who has cleared their browser, and it is not a substitute
   for a published address.
3. Decide, and write down, who gets access to the database and under what
   terms. "Nobody else yet" is a valid answer and worth recording as one.
4. Re-read §6.5 in full. Most of what is above is a restatement of it, and the
   parts that are not are the parts to check hardest.
