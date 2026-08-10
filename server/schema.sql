-- ============================================================
-- israquiz collection schema — spec §6.5
--
-- Two tables, joined only by a random response id, because §6.5.1
-- treats a full answer vector bolted to a full demographic vector as
-- a fingerprint even with no name on it. Keeping them apart in
-- storage is what makes "we will never publish the join" an
-- arrangement rather than a promise.
--
-- Note what is absent and stays absent: no ip column, no user_agent,
-- no referer, no session cookie, no email. Adding one later is a
-- decision with consequences, not a convenience.
-- ============================================================

CREATE TABLE IF NOT EXISTS responses (
  response_id        TEXT PRIMARY KEY,
  received_at        TEXT NOT NULL,      -- server clock, ISO 8601
  instrument_version TEXT NOT NULL,      -- e.g. "v0.2 — preview"
  item_count         INTEGER NOT NULL,
  a5_variant         TEXT NOT NULL,      -- "live" or "durable"; A5's polarity inverts between them
  consent_version    TEXT NOT NULL,
  consented_at       TEXT NOT NULL,      -- client clock, as shown to the respondent
  item_order         TEXT NOT NULL,      -- JSON array — §8.9 order effects are unmeasurable without it
  answers            TEXT NOT NULL,      -- JSON object, item id -> -2..2
  weights            TEXT NOT NULL,      -- JSON object, block -> 0..60
  f1                 INTEGER,            -- unscored: Netanyahu should continue
  f2                 INTEGER,            -- unscored: unity government preferred
  cross_cutting      TEXT NOT NULL,      -- JSON object, block G
  axes               TEXT NOT NULL,      -- JSON object, five coordinates
  ranking            TEXT NOT NULL,      -- JSON array of {code, weighted, unweighted, coverage}
  blocs              TEXT NOT NULL,      -- JSON object, bloc -> mean match
  declared           TEXT                -- validation runs only; a party code, never free text
);

CREATE TABLE IF NOT EXISTS demographics (
  response_id     TEXT PRIMARY KEY,
  received_at     TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  answers         TEXT NOT NULL          -- JSON object, D-id -> option string or array of them
);

-- Retention is enforced, not merely stated (§6.5). Run this on a cron
-- trigger; the consent text promises 24 months.
CREATE INDEX IF NOT EXISTS responses_received_at ON responses (received_at);
CREATE INDEX IF NOT EXISTS demographics_received_at ON demographics (received_at);
