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
  Value: https://israquiz-collect.<your-subdomain>.workers.dev
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

## Check it before you deploy it

`server/worker.test.mjs` stubs the database binding, so those 14 tests prove the
validation and the statement *shapes* — they never execute a line of SQL. A
column-count mismatch or a typo in an `ON CONFLICT` clause passes the whole suite
and fails on the first real submission, after someone has ticked a consent box.

Miniflare backs `--local` with real SQLite, so the Worker can be exercised end to
end without a Cloudflare account:

```bash
cd server
# any well-formed uuid works locally; put the placeholder back afterwards
sed -i 's/REPLACE_WITH_YOUR_D1_ID/00000000-0000-0000-0000-000000000000/' wrangler.toml
npx wrangler d1 execute israquiz --local --file=./schema.sql
npx wrangler dev --local --port 8799
```

Then POST a payload the app actually produces, rather than one written by hand —
`buildSubmission` in `src/lib/collect.ts` is the source of truth for the shape:

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

`server/.wrangler/` holds the local database and is gitignored. Restore the
`database_id` placeholder before committing.

## Protocol

One route, POST only, JSON in and JSON out, CORS locked to an exact-origin
allowlist.

```jsonc
// submission
{
  "format": "israquiz.submission.v1",
  "instrument": { "version": "v0.2 — preview", "itemCount": 49, "a5Variant": "live", … },
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
