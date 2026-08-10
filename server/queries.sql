-- ============================================================
-- Analysis queries, written with §6.5's disclosure rules built in
-- rather than applied afterwards. Each one that touches the
-- demographics table carries its own suppression clause, because a
-- suppression rule you have to remember is a suppression rule you
-- will one day forget.
--
--   · n < 30 cells are not reported. For observance × district,
--     use 50 — those categories are small and geographically
--     concentrated, and a haredi respondent in a kibbutz is one
--     person, not a cell.
--   · No three-way crosstabs. Ever. Two axes plus a filter is a
--     three-way crosstab wearing a coat.
--   · Nothing that joins a full answer vector to a full demographic
--     vector gets published, in any form, including as a download
--     "for researchers".
--   · Nothing produced here is a poll. Anyone who reaches the page
--     can answer; the respondents are not a sample of anything.
-- ============================================================

-- ---- volume and consent split -------------------------------------------
SELECT
  COUNT(*)                                                        AS responses,
  (SELECT COUNT(*) FROM demographics)                             AS with_background,
  MIN(received_at)                                                AS first_seen,
  MAX(received_at)                                                AS last_seen
FROM responses;

-- ---- completion, for judging whether the bank is too long ---------------
WITH counted AS (
  SELECT r.response_id,
         SUM(CASE WHEN j.value IS NOT NULL THEN 1 ELSE 0 END) AS answered
  FROM responses r, json_each(r.answers) j
  GROUP BY r.response_id
)
SELECT answered, COUNT(*) AS n
FROM counted
GROUP BY answered
ORDER BY answered;

-- ---- item-level response distribution (§4.7, the post-launch half) -------
-- Variance per item is the number that says which statements are doing work.
-- No demographic join, so no suppression needed.
WITH exploded AS (
  SELECT r.response_id, j.key AS item, CAST(j.value AS INTEGER) AS answer
  FROM responses r, json_each(r.answers) j
  WHERE j.value IS NOT NULL
)
SELECT
  item,
  COUNT(*)                              AS n,
  ROUND(AVG(answer), 3)                 AS mean,
  ROUND(AVG(answer * answer) - AVG(answer) * AVG(answer), 3) AS variance,
  SUM(answer > 0)                       AS agree,
  SUM(answer = 0)                       AS neutral,
  SUM(answer < 0)                       AS disagree
FROM exploded
GROUP BY item
ORDER BY variance ASC;   -- lowest variance first: the candidates for cutting

-- ---- order effects (§8.9) ------------------------------------------------
-- Blocks are shuffled per respondent, so position is randomised and any
-- systematic drift by position is an artefact of the instrument, not the
-- electorate.
WITH pos AS (
  SELECT r.response_id, j.value AS item, j.key AS position
  FROM responses r, json_each(r.item_order) j
)
SELECT
  p.position / 6                                     AS octile,   -- 48 items, eight groups of six
  ROUND(AVG(ABS(CAST(a.value AS INTEGER))), 3)       AS mean_intensity,
  COUNT(*)                                           AS n
FROM pos p
JOIN responses r ON r.response_id = p.response_id
JOIN json_each(r.answers) a ON a.key = p.item
WHERE a.value IS NOT NULL
GROUP BY octile
ORDER BY octile;

-- ---- top match by recalled 2022 vote (§6.4) ------------------------------
-- The crosstab the spec calls the most publishable output here. Two
-- variables, one suppression clause, no third dimension.
WITH top_match AS (
  SELECT response_id, json_extract(ranking, '$[0].code') AS top_code
  FROM responses
)
SELECT
  json_extract(d.answers, '$.D15') AS recalled_2022,
  t.top_code                        AS closest_match,
  COUNT(*)                          AS n
FROM demographics d
JOIN top_match t ON t.response_id = d.response_id
WHERE json_extract(d.answers, '$.D15') NOT IN ('Prefer not to say')
GROUP BY 1, 2
HAVING COUNT(*) >= 30              -- suppression, in the query, not the writeup
ORDER BY 1, n DESC;

-- ---- observance against the religion axis --------------------------------
-- Means rather than a crosstab, and still suppressed: a mean over four people
-- discloses roughly as much as listing them.
SELECT
  json_extract(d.answers, '$.D4')             AS observance,
  COUNT(*)                                     AS n,
  ROUND(AVG(json_extract(r.axes, '$.B')), 1)  AS mean_religion_axis,
  ROUND(AVG(json_extract(r.axes, '$.A')), 1)  AS mean_security_axis
FROM demographics d
JOIN responses r ON r.response_id = d.response_id
WHERE json_extract(d.answers, '$.D4') IS NOT NULL
  AND json_extract(d.answers, '$.D4') <> 'Prefer not to say'
GROUP BY 1
HAVING COUNT(*) >= 30
ORDER BY mean_religion_axis;

-- ---- observance × district: the n = 50 case ------------------------------
-- Two small, geographically concentrated categories. Thirty is not enough
-- here and the threshold is raised rather than the table dropped.
SELECT
  json_extract(d.answers, '$.D4') AS observance,
  json_extract(d.answers, '$.D7') AS district,
  COUNT(*)                        AS n
FROM demographics d
WHERE json_extract(d.answers, '$.D4') IS NOT NULL
  AND json_extract(d.answers, '$.D7') IS NOT NULL
GROUP BY 1, 2
HAVING COUNT(*) >= 50
ORDER BY n DESC;

-- ---- retention check -----------------------------------------------------
-- Should always return 0. If it does not, the cron trigger is not firing.
SELECT COUNT(*) AS overdue
FROM responses
WHERE received_at < datetime('now', '-24 months');
