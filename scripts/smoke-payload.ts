/* ============================================================
   Build a real submission payload for the post-deploy smoke test.

     npx vite-node scripts/smoke-payload.ts > payload.json

   `server/README.md` asks for a payload the app actually produces
   rather than one written by hand, and it is right to: the shape is
   defined by `buildSubmission`, the ranking comes out of the scoring
   engine, and a payload typed from memory tests the typist. Before
   this script the only way to obtain one was to sit the quiz with a
   devtools window open, which is not available while
   `COLLECT_ENDPOINT` is deliberately unset.

   The answers are synthetic and deterministic. This proves the
   endpoint accepts and stores what the client sends; it is not data
   and must never be left in the database — see the withdrawal step
   in `server/README.md`, which the fixed response id below exists to
   make easy.
   ============================================================ */

import { writeFileSync } from "node:fs";
import { buildSubmission } from "../src/lib/collect";
import { score, DEFAULT_WEIGHTS } from "../src/lib/scoring";
import type { Answer } from "../src/lib/scoring";
import { ITEMS, BLOCK_IDS, ITEMS_BY_BLOCK } from "../src/data/items";
import type { Session } from "../src/lib/storage";
import type { Demographics } from "../src/data/demographics";

/**
 * Hex and dashes, because the Worker's ID_RE rejects anything else — so it
 * cannot be spelled "smoke-test". Fixed rather than random so the withdrawal
 * that deletes it can be copied straight out of the README without first
 * going to find what id was sent.
 */
const SMOKE_ID = "deadbeef-0000-4000-8000-000000000001";

/** −2..2 cycled by position: every scale point exercised, no randomness. */
const answers: Record<string, Answer> = {};
ITEMS.forEach((item, i) => {
  answers[item.id] = ((i % 5) - 2) as Answer;
});

const result = score(answers, DEFAULT_WEIGHTS);

/**
 * Presentation order (§8.9). Blocks in canonical order rather than shuffled:
 * the field is transmitted and stored either way, and a fixed order keeps the
 * payload byte-identical between runs so a diff means something changed.
 */
const order = BLOCK_IDS.flatMap((b) => ITEMS_BY_BLOCK[b].map((it) => it.id));

const session: Session = {
  responseId: SMOKE_ID,
  seed: 1,
  index: ITEMS.length,
  answers,
  weights: DEFAULT_WEIGHTS,
  f1: 0,
  f2: 0,
  g: {},
  stage: "results",
  savedAt: "2026-01-01T00:00:00.000Z",
};

/**
 * Left empty, so `demographics` serialises as null. The demographic path is
 * covered by the local Miniflare walk-through; sending a synthetic religion
 * and ethnicity to the production table to prove a column exists is not a
 * trade this project should make, and the null case is the one that has to
 * work for a respondent who consents to answers only.
 */
const demographics: Demographics = {};

const payload = buildSubmission({
  session,
  result,
  order,
  demographics,
  includeDemographics: false,
  validation: false,
  now: "2026-01-01T00:00:00.000Z",
});

const json = JSON.stringify(payload, null, 2);
const out = process.argv[2] ?? "payload.json";
writeFileSync(out, json + "\n");

const kb = (Buffer.byteLength(json) / 1024).toFixed(1);
process.stderr.write(
  `wrote ${out} — ${ITEMS.length} items, ${kb} KiB (the Worker rejects over 64)\n` +
    `response id: ${SMOKE_ID}\n` +
    `withdraw it when the check is done, or it becomes row 1 of the dataset.\n`,
);
