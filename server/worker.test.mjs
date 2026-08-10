/* ============================================================
   Contract test: the payload the browser builds must be the payload
   the Worker accepts. These two live in different languages, different
   directories and different deployments, and nothing else stops them
   drifting apart — a field renamed in the client would otherwise show
   up as a silent 400 in production, after the respondent has already
   ticked the box.
   ============================================================ */

import { describe, expect, it } from "vitest";
import worker from "./worker.js";
import { buildSubmission } from "../src/lib/collect.ts";
import { DEFAULT_WEIGHTS, score } from "../src/lib/scoring.ts";
import { ITEMS } from "../src/data/items.ts";

const ORIGIN = "https://example.test";

function fakeEnv() {
  const run = [];
  return {
    run,
    env: {
      ALLOWED_ORIGINS: ORIGIN,
      RETENTION_MONTHS: "24",
      DB: {
        prepare: (sql) => ({ sql, bind: (...args) => ({ sql, args }) }),
        batch: async (stmts) => {
          run.push(...stmts);
          return [];
        },
      },
    },
  };
}

const post = (body, origin = ORIGIN) =>
  new Request("https://collect.test/", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  });

const answers = Object.fromEntries(ITEMS.map((it, i) => [it.id, (i % 5) - 2]));

function submission(over = {}) {
  const session = {
    responseId: "8cc4ad51-d87c-48b8-af04-3198c6cb72a8",
    seed: 1,
    index: ITEMS.length,
    answers,
    weights: { ...DEFAULT_WEIGHTS },
    f1: 1,
    f2: -1,
    g: { G1: 1, G2: 0, G3: -1 },
    stage: "results",
    savedAt: "2026-08-10T00:00:00.000Z",
    declared: "LIK",
    tester: "YS",
  };
  return buildSubmission({
    session,
    result: score(session.answers, session.weights),
    order: ITEMS.map((i) => i.id),
    demographics: { D0: "Israel", D3: "Jewish", D6: ["Mizrahi / Sephardi"] },
    includeDemographics: false,
    validation: true,
    now: "2026-08-10T09:00:00.000Z",
    ...over,
  });
}

describe("client payload against server validation", () => {
  it("accepts a real submission with demographics", async () => {
    const { env, run } = fakeEnv();
    const res = await worker.fetch(post(submission({ includeDemographics: true })), env);
    expect(res.status).toBe(200);
    // one insert into responses, one into demographics — never a single row
    expect(run).toHaveLength(2);
    expect(run[0].sql).toMatch(/INSERT INTO responses/);
    expect(run[1].sql).toMatch(/INSERT INTO demographics/);
  });

  it("accepts one without, and clears any demographic row already stored", async () => {
    const { env, run } = fakeEnv();
    const res = await worker.fetch(post(submission()), env);
    expect(res.status).toBe(200);
    expect(run[1].sql).toMatch(/DELETE FROM demographics/);
  });

  it("binds no column that could hold an address or a device", async () => {
    const { env, run } = fakeEnv();
    await worker.fetch(post(submission({ includeDemographics: true })), env);
    for (const s of run) expect(s.sql).not.toMatch(/\b(ip|ip_address|user_agent|referer|cookie|email)\b/i);
  });
});

describe("what the server refuses", () => {
  it("rejects a demographic value long enough to be free text (§6.5.4)", async () => {
    const { env } = fakeEnv();
    const body = submission({ includeDemographics: true });
    body.demographics.D3 = "x".repeat(400);
    expect((await worker.fetch(post(body), env)).status).toBe(400);
  });

  it("rejects a demographic key that is not a D-number", async () => {
    const { env } = fakeEnv();
    const body = submission({ includeDemographics: true });
    body.demographics.freeText = "anything at all";
    expect((await worker.fetch(post(body), env)).status).toBe(400);
  });

  it("rejects a demographic row pointing at someone else's response", async () => {
    const { env } = fakeEnv();
    const body = submission({ includeDemographics: true });
    body.demographics.responseId = "11111111-2222-3333-4444-555555555555";
    expect((await worker.fetch(post(body), env)).status).toBe(400);
  });

  it("rejects an answer outside the five-point scale", async () => {
    const { env } = fakeEnv();
    const body = submission();
    body.responses.answers.A1 = 9;
    expect((await worker.fetch(post(body), env)).status).toBe(400);
  });

  it("rejects a declared vote that is not a party code", async () => {
    const { env } = fakeEnv();
    const body = submission();
    body.responses.declared = "a whole sentence";
    expect((await worker.fetch(post(body), env)).status).toBe(400);
  });

  it("refuses an origin that is not on the allowlist", async () => {
    const { env } = fakeEnv();
    const res = await worker.fetch(post(submission(), "https://evil.test"), env);
    expect(res.status).toBe(403);
    expect(res.headers.get("access-control-allow-origin")).toBe("null");
  });

  it("refuses anything but POST", async () => {
    const { env } = fakeEnv();
    const res = await worker.fetch(
      new Request("https://collect.test/", { headers: { origin: ORIGIN } }),
      env,
    );
    expect(res.status).toBe(405);
  });

  it("answers a preflight without touching the database", async () => {
    const { env, run } = fakeEnv();
    const res = await worker.fetch(
      new Request("https://collect.test/", { method: "OPTIONS", headers: { origin: ORIGIN } }),
      env,
    );
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe(ORIGIN);
    expect(run).toHaveLength(0);
  });
});

describe("withdrawal", () => {
  it("deletes from both tables", async () => {
    const { env, run } = fakeEnv();
    const res = await worker.fetch(
      post({ format: "israquiz.withdrawal.v1", responseId: "8cc4ad51-d87c-48b8-af04-3198c6cb72a8" }),
      env,
    );
    expect(res.status).toBe(200);
    expect(run.map((s) => s.sql.trim().split(" ").slice(0, 3).join(" "))).toEqual([
      "DELETE FROM responses",
      "DELETE FROM demographics",
    ]);
  });

  /** A 404 for an unknown id would answer "was this response ever sent?". */
  it("answers 200 for an id that was never stored", async () => {
    const { env } = fakeEnv();
    const res = await worker.fetch(
      post({ format: "israquiz.withdrawal.v1", responseId: "00000000-0000-0000-0000-000000000000" }),
      env,
    );
    expect(res.status).toBe(200);
  });
});

describe("retention sweep", () => {
  it("deletes from both tables at the promised horizon", async () => {
    const { env, run } = fakeEnv();
    await worker.scheduled({}, env);
    expect(run).toHaveLength(2);
    const cutoff = run[0].args[0];
    const months = (Date.now() - Date.parse(cutoff)) / (1000 * 60 * 60 * 24 * 30.44);
    expect(months).toBeGreaterThan(23);
    expect(months).toBeLessThan(25);
  });
});
