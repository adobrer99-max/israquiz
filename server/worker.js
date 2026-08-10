/* ============================================================
   Collection endpoint — Cloudflare Worker + D1

   One route, two verbs' worth of behaviour:
     POST {format: "israquiz.submission.v1", …}  -> two INSERTs
     POST {format: "israquiz.withdrawal.v1", …}  -> two DELETEs

   Design rules, all of them from spec §6.5:

   · Nothing about the request itself is recorded. No IP, no user
     agent, no referer, no cookie. `console.log` is used only for
     failures and never given the body. If you turn on Cloudflare
     request logging you undo this, so don't.
   · Answers and demographics are written to separate tables in
     separate statements. The transport carries both because one
     round trip is one consent decision, but nothing downstream
     ever sees them as one row.
   · Withdrawal needs no account and no email. The response id is a
     v4 UUID minted in the browser: 122 bits, unguessable, and held
     only by the device that sent it. That is the rare case where
     holding an identifier improves the privacy position.
   · Everything is validated by shape and size before it touches the
     database. A browser can be made to send anything, so the "no
     free text" rule (§6.5.4) is enforced here as well as in the
     client — length caps and key patterns, not trust.
   ============================================================ */

const MAX_BODY = 64 * 1024;

const MAX_ITEMS = 200;          // the bank is 48 + a handful unscored
const MAX_DEMO_KEYS = 40;
const MAX_DEMO_VALUE = 96;      // longest real option is well under this
const MAX_DEMO_ARRAY = 24;

const ID_RE = /^[0-9a-fA-F-]{8,64}$/;
const ITEM_RE = /^[A-Z]{1,2}\d{1,3}[a-z]?$/;
const CODE_RE = /^[A-Z]{2,12}$/;

function cors(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const ok = Boolean(origin) && allowed.includes(origin);
  return {
    ok,
    headers: {
      "access-control-allow-origin": ok ? origin : "null",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400",
      vary: "origin",
    },
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "content-type": "application/json", "cache-control": "no-store" },
  });
}

const isStr = (v, max) => typeof v === "string" && v.length > 0 && v.length <= max;
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/** Answers must be item id -> integer in −2..2, or null for a skip. */
function validAnswers(a) {
  if (!isObj(a)) return false;
  const keys = Object.keys(a);
  if (keys.length > MAX_ITEMS) return false;
  return keys.every((k) => {
    if (!ITEM_RE.test(k)) return false;
    const v = a[k];
    return v === null || (Number.isInteger(v) && v >= -2 && v <= 2);
  });
}

function validSmallMap(m, lo, hi) {
  if (!isObj(m)) return false;
  const keys = Object.keys(m);
  if (keys.length > MAX_ITEMS) return false;
  return keys.every((k) => {
    if (k.length > 8) return false;
    const v = m[k];
    return v === null || (typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi);
  });
}

/**
 * Demographic values come from fixed option lists in the client. Enforced here
 * as short strings and short arrays of them, which is what stops a tampered
 * client from turning an option button into a free-text field (§6.5.4).
 */
function validDemographics(d) {
  if (!isObj(d)) return false;
  const keys = Object.keys(d).filter((k) => k !== "responseId");
  if (keys.length > MAX_DEMO_KEYS) return false;
  return keys.every((k) => {
    if (!/^D\d{1,2}[a-z]?$/.test(k)) return false;
    const v = d[k];
    if (typeof v === "string") return v.length <= MAX_DEMO_VALUE;
    if (Array.isArray(v)) {
      return v.length <= MAX_DEMO_ARRAY && v.every((x) => typeof x === "string" && x.length <= MAX_DEMO_VALUE);
    }
    return false;
  });
}

function validSubmission(b) {
  if (!isObj(b.instrument) || !isObj(b.consent) || !isObj(b.responses)) return "malformed envelope";
  if (!isStr(b.instrument.version, 64)) return "instrument.version";
  if (!isStr(b.instrument.a5Variant, 16)) return "instrument.a5Variant";
  if (!Number.isInteger(b.instrument.itemCount)) return "instrument.itemCount";
  if (!isStr(b.consent.version, 64) || !isStr(b.consent.at, 40)) return "consent";
  if (typeof b.consent.demographics !== "boolean") return "consent.demographics";

  const r = b.responses;
  if (!isStr(r.responseId, 64) || !ID_RE.test(r.responseId)) return "responseId";
  if (!Array.isArray(r.order) || r.order.length > MAX_ITEMS) return "order";
  if (!r.order.every((k) => typeof k === "string" && ITEM_RE.test(k))) return "order";
  if (!validAnswers(r.answers)) return "answers";
  if (!validSmallMap(r.weights, 0, 100)) return "weights";
  if (!validSmallMap(r.g, -1, 1)) return "cross-cutting";
  if (!validSmallMap(r.axes, -100, 100)) return "axes";
  if (!validSmallMap(r.blocs, -100, 100)) return "blocs";
  if (!Array.isArray(r.ranking) || r.ranking.length > 64) return "ranking";
  for (const f of ["f1", "f2"]) {
    const v = r[f];
    if (!(v === null || v === undefined || (Number.isInteger(v) && v >= -1 && v <= 1))) return f;
  }
  if (r.declared !== undefined && !(isStr(r.declared, 12) && CODE_RE.test(r.declared))) return "declared";

  if (b.demographics !== null && b.demographics !== undefined) {
    if (!isObj(b.demographics)) return "demographics";
    if (b.demographics.responseId !== r.responseId) return "demographics.responseId";
    if (!validDemographics(b.demographics)) return "demographics";
  }
  return null;
}

async function handleSubmission(body, env, now) {
  const bad = validSubmission(body);
  if (bad) return { status: 400, body: { error: `invalid field: ${bad}` } };

  const r = body.responses;
  const stmts = [
    env.DB.prepare(
      `INSERT INTO responses
         (response_id, received_at, instrument_version, item_count, a5_variant,
          consent_version, consented_at, item_order, answers, weights,
          f1, f2, cross_cutting, axes, ranking, blocs, declared)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17)
       ON CONFLICT(response_id) DO UPDATE SET
         received_at = excluded.received_at,
         consent_version = excluded.consent_version,
         consented_at = excluded.consented_at,
         item_order = excluded.item_order,
         answers = excluded.answers,
         weights = excluded.weights,
         f1 = excluded.f1, f2 = excluded.f2,
         cross_cutting = excluded.cross_cutting,
         axes = excluded.axes, ranking = excluded.ranking,
         blocs = excluded.blocs, declared = excluded.declared`,
    ).bind(
      r.responseId,
      now,
      body.instrument.version,
      body.instrument.itemCount,
      body.instrument.a5Variant,
      body.consent.version,
      body.consent.at,
      JSON.stringify(r.order),
      JSON.stringify(r.answers),
      JSON.stringify(r.weights),
      r.f1 ?? null,
      r.f2 ?? null,
      JSON.stringify(r.g ?? {}),
      JSON.stringify(r.axes),
      JSON.stringify(r.ranking),
      JSON.stringify(r.blocs),
      r.declared ?? null,
    ),
  ];

  if (body.demographics) {
    const { responseId, ...answers } = body.demographics;
    stmts.push(
      env.DB.prepare(
        `INSERT INTO demographics (response_id, received_at, consent_version, answers)
         VALUES (?1,?2,?3,?4)
         ON CONFLICT(response_id) DO UPDATE SET
           received_at = excluded.received_at,
           consent_version = excluded.consent_version,
           answers = excluded.answers`,
      ).bind(responseId, now, body.consent.version, JSON.stringify(answers)),
    );
  } else {
    // Consent for the background block can be withdrawn by resubmitting
    // without it, so a prior row must not survive the second decision.
    stmts.push(env.DB.prepare("DELETE FROM demographics WHERE response_id = ?1").bind(r.responseId));
  }

  await env.DB.batch(stmts);
  return { status: 200, body: { ok: true } };
}

async function handleWithdrawal(body, env) {
  const id = body.responseId;
  if (!isStr(id, 64) || !ID_RE.test(id)) return { status: 400, body: { error: "invalid responseId" } };
  await env.DB.batch([
    env.DB.prepare("DELETE FROM responses WHERE response_id = ?1").bind(id),
    env.DB.prepare("DELETE FROM demographics WHERE response_id = ?1").bind(id),
  ]);
  // Always 200, whether or not a row existed: a different answer would turn
  // this into an oracle for testing whether a given id was ever submitted.
  return { status: 200, body: { ok: true } };
}

export default {
  async fetch(request, env) {
    const { ok: originAllowed, headers } = cors(request.headers.get("origin"), env);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return json({ error: "POST only" }, 405, headers);
    if (!originAllowed) return json({ error: "origin not allowed" }, 403, headers);

    const length = Number(request.headers.get("content-length") || 0);
    if (length > MAX_BODY) return json({ error: "payload too large" }, 413, headers);

    // Optional native rate limit. Keyed on the origin rather than the caller,
    // because keying on an IP would mean handling one, which this service does
    // not do. Put per-IP flood protection in a WAF rule instead — that runs in
    // front of the Worker and never hands the address to application code.
    if (env.RATE_LIMIT) {
      const { success } = await env.RATE_LIMIT.limit({ key: "submissions" });
      if (!success) return json({ error: "rate limited" }, 429, headers);
    }

    let body;
    try {
      const text = await request.text();
      if (text.length > MAX_BODY) return json({ error: "payload too large" }, 413, headers);
      body = JSON.parse(text);
    } catch {
      return json({ error: "invalid JSON" }, 400, headers);
    }
    if (!isObj(body)) return json({ error: "invalid JSON" }, 400, headers);

    const now = new Date().toISOString();
    try {
      let out;
      if (body.format === "israquiz.submission.v1") out = await handleSubmission(body, env, now);
      else if (body.format === "israquiz.withdrawal.v1") out = await handleWithdrawal(body, env);
      else out = { status: 400, body: { error: "unknown format" } };
      return json(out.body, out.status, headers);
    } catch (err) {
      // The message only — never the body, which is the data itself.
      console.error("collection failure:", err && err.message);
      return json({ error: "storage failure" }, 500, headers);
    }
  },

  /**
   * Retention (§6.5). The consent text promises deletion after
   * RETENTION_MONTHS; a promise nothing enforces is a promise that quietly
   * stops being true. Wire this to a cron trigger in wrangler.toml.
   */
  async scheduled(_event, env) {
    const months = Number(env.RETENTION_MONTHS || 24);
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const iso = cutoff.toISOString();
    await env.DB.batch([
      env.DB.prepare("DELETE FROM responses WHERE received_at < ?1").bind(iso),
      env.DB.prepare("DELETE FROM demographics WHERE received_at < ?1").bind(iso),
    ]);
  },
};
