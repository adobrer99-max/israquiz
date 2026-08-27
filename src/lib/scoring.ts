/* ============================================================
   Scoring engine — spec §4
   Pure functions. No React, no DOM, no party names hardcoded.
   ============================================================ */

import {
  BLOCK_IDS, BLOCKS, ITEMS, type BlockId, type Item, type Position,
} from "../data/items";
import {
  BALLOT_PARTIES, COMPONENT_PARTIES, PARTIES, type Bloc, type PartyCode,
} from "../data/parties";

/** −2 … +2, or null for "no opinion / don't know" (§1). */
export type Answer = -2 | -1 | 0 | 1 | 2 | null;
export type Answers = Partial<Record<string, Answer>>;
export type Weights = Record<BlockId, number>;

export const DEFAULT_WEIGHTS: Weights = { A: 20, B: 20, C: 20, D: 20, E: 20 };

/** §4.2 — below this share of coded items a party is suppressed from the ranking. */
export const COVERAGE_FLOOR = 0.7;
/** Below this share of a *block's* items a party's coordinate on that axis is unreliable. */
export const AXIS_CONFIDENCE_FLOOR = 0.5;
/** §4.8.2 — top three inside this spread are reported as indistinguishable. */
export const NOISE_BAND = 4;

const dirOf = (u: number): -1 | 0 | 1 => (u > 0 ? 1 : u < 0 ? -1 : 0);
const dirOfPos = (p: Position): -1 | 0 | 1 => (p === "A" ? 1 : p === "D" ? -1 : 0);

/** §4.1 — direction only. Same side 2 · one side neutral 1 · opposite 0. */
export function agreementPoints(u: number, p: Position): 0 | 1 | 2 {
  return (2 - Math.abs(dirOf(u) - dirOfPos(p))) as 0 | 1 | 2;
}

export interface PartyResult {
  code: PartyCode;
  name: string;
  lead: string;
  color: string;
  bloc: Bloc;
  ballot: boolean;
  belowThreshold: boolean;
  thresholdNote?: string;
  note?: string;
  weighted: number;
  unweighted: number;
  /** share of the scored items on which the party has a coded position */
  coverage: number;
  /** items actually used: coded AND answered */
  scoredItems: number;
  /**
   * scoredItems as a share of everything the respondent answered. `coverage`
   * describes the bank; this describes the comparison actually made. A party
   * can be 90% coded and still be matched on a handful of items if the
   * respondent skipped the ones it holds positions on, and without this the
   * two cases are indistinguishable on the results page.
   */
  overlap: number;
  /** per-block agreement %, used for the one-line reason in §4.8.3 */
  byBlock: Record<BlockId, { pct: number; n: number }>;
}

export interface AxisScores {
  value: Record<BlockId, number>;
  /** items answered / items in block — drives the low-confidence marker */
  confidence: Record<BlockId, number>;
}

export interface ScoreResult {
  ranked: PartyResult[];
  lowCoverage: PartyResult[];
  components: PartyResult[];
  all: Record<PartyCode, PartyResult>;
  user: AxisScores;
  partyAxes: Record<PartyCode, AxisScores>;
  blocs: Record<"pro" | "anti" | "non", number>;
  answeredCount: number;
  skippedCount: number;
}

const blockWeight = (w: Weights, b: BlockId) => w[b] / 20;

function matchFor(code: PartyCode, answers: Answers, weights: Weights) {
  let wNum = 0, wDen = 0, uNum = 0, uDen = 0, coded = 0, used = 0;
  const byBlock = {} as Record<BlockId, { pct: number; n: number }>;
  const acc = {} as Record<BlockId, { num: number; den: number }>;
  BLOCK_IDS.forEach((b) => {
    acc[b] = { num: 0, den: 0 };
  });

  for (const it of ITEMS) {
    const p = it.pos[code];
    if (p === "-") continue;
    coded++;
    const u = answers[it.id];
    if (u === undefined || u === null) continue;
    used++;
    const pts = agreementPoints(u, p);
    const w = blockWeight(weights, it.block);
    wNum += w * pts;
    wDen += w * 2;
    uNum += pts;
    uDen += 2;
    acc[it.block].num += pts;
    acc[it.block].den += 2;
  }

  BLOCK_IDS.forEach((b) => {
    byBlock[b] = {
      pct: acc[b].den ? (acc[b].num / acc[b].den) * 100 : 0,
      n: acc[b].den / 2,
    };
  });

  return {
    weighted: wDen ? (wNum / wDen) * 100 : 0,
    unweighted: uDen ? (uNum / uDen) * 100 : 0,
    coverage: coded / ITEMS.length,
    scoredItems: used,
    byBlock,
  };
}

/**
 * §4.3 — axis position from the raw 5-point response, no topic weights.
 * `valueOf` returns the −2…+2 value for an item, or null to exclude it.
 */
function axisScores(valueOf: (item: Item) => number | null): AxisScores {
  const value = {} as Record<BlockId, number>;
  const confidence = {} as Record<BlockId, number>;
  for (const b of BLOCK_IDS) {
    const set = ITEMS.filter((i) => i.block === b);
    let sum = 0, n = 0;
    for (const it of set) {
      const v = valueOf(it);
      if (v === null) continue;
      sum += it.sign * v;
      n++;
    }
    value[b] = n ? (100 * sum) / (2 * n) : 0;
    confidence[b] = set.length ? n / set.length : 0;
  }
  return { value, confidence };
}

export function userAxes(answers: Answers): AxisScores {
  return axisScores((it) => {
    const u = answers[it.id];
    return u === undefined || u === null ? null : u;
  });
}

/** §4.3 — party coordinates use the same formula with A/N/D mapped to +2/0/−2. */
export function partyAxesFor(code: PartyCode): AxisScores {
  return axisScores((it) => {
    const p = it.pos[code];
    return p === "-" ? null : dirOfPos(p) * 2;
  });
}

export function score(answers: Answers, weights: Weights = DEFAULT_WEIGHTS): ScoreResult {
  const codes = [...BALLOT_PARTIES, ...COMPONENT_PARTIES];

  let answered = 0, skipped = 0;
  for (const it of ITEMS) {
    const u = answers[it.id];
    if (u === null) skipped++;
    else if (u !== undefined) answered++;
  }

  const all = {} as Record<PartyCode, PartyResult>;
  const partyAxes = {} as Record<PartyCode, AxisScores>;

  for (const code of codes) {
    const m = matchFor(code, answers, weights);
    const p = PARTIES[code];
    all[code] = {
      code,
      name: p.name,
      lead: p.lead,
      color: p.color,
      bloc: p.bloc,
      ballot: p.ballot,
      belowThreshold: !!p.belowThreshold,
      thresholdNote: p.thresholdNote,
      note: p.note,
      ...m,
      overlap: answered ? m.scoredItems / answered : 0,
    };
    partyAxes[code] = partyAxesFor(code);
  }

  const rows = codes.map((c) => all[c]);
  const byWeighted = (a: PartyResult, b: PartyResult) => b.weighted - a.weighted;

  const ranked = rows.filter((r) => r.ballot && r.coverage >= COVERAGE_FLOOR).sort(byWeighted);
  const lowCoverage = rows.filter((r) => r.ballot && r.coverage < COVERAGE_FLOOR).sort(byWeighted);
  const components = rows.filter((r) => !r.ballot).sort(byWeighted);

  const blocAvg = (which: Bloc) => {
    const set = ranked.filter((r) => r.bloc === which);
    return set.length ? set.reduce((s, r) => s + r.weighted, 0) / set.length : 0;
  };

  return {
    ranked,
    lowCoverage,
    components,
    all,
    user: userAxes(answers),
    partyAxes,
    blocs: { pro: blocAvg("pro"), anti: blocAvg("anti"), non: blocAvg("non") },
    answeredCount: answered,
    skippedCount: skipped,
  };
}

/* ---------------- results-page helpers (§4.8) ---------------- */

/** Items where the user and the party sit on flatly opposite sides. */
export function flatOpposition(code: PartyCode, answers: Answers): Item[] {
  return ITEMS.filter((it) => {
    const p = it.pos[code];
    if (p === "-") return false;
    const u = answers[it.id];
    if (u === undefined || u === null) return false;
    return agreementPoints(u, p) === 0;
  });
}

/** §4.8.3 — "You align with X most on religion-and-state, least on economics." */
export function reasonLine(r: PartyResult): string | null {
  const blocks = BLOCK_IDS
    .map((b) => ({ b, ...r.byBlock[b] }))
    .filter((x) => x.n >= 2);
  if (blocks.length < 2) return null;
  const sorted = [...blocks].sort((a, b) => b.pct - a.pct);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  if (Math.round(best.pct) === Math.round(worst.pct)) {
    return `You align with ${r.name} about evenly across all five topics.`;
  }
  return `You align with ${r.name} most on ${BLOCKS[best.b].short} (${Math.round(best.pct)}%), least on ${BLOCKS[worst.b].short} (${Math.round(worst.pct)}%).`;
}

/** Straight-line distance on the grid, for the text equivalent of the scatter plot. */
export function gridDistance(user: AxisScores, party: AxisScores): number {
  const dx = user.value.A - party.value.A;
  const dy = user.value.B - party.value.B;
  return Math.sqrt(dx * dx + dy * dy);
}

export function quadrantLabel(a: number, b: number): string {
  const x = a > 8 ? "hawkish" : a < -8 ? "dovish" : "centrist on security";
  const y = b > 8 ? "religious" : b < -8 ? "secular" : "in the middle on religion and state";
  return `${x}, ${y}`;
}

/**
 * Which ballot parties sit on each side of a diagnostic item.
 * Used to report the unscored items rather than fold them into anything.
 */
export function diagnosticSides(
  pos: Record<PartyCode, Position>,
): { agree: PartyCode[]; neutral: PartyCode[]; disagree: PartyCode[] } {
  const agree: PartyCode[] = [];
  const neutral: PartyCode[] = [];
  const disagree: PartyCode[] = [];
  for (const c of BALLOT_PARTIES) {
    if (pos[c] === "A") agree.push(c);
    else if (pos[c] === "N") neutral.push(c);
    else if (pos[c] === "D") disagree.push(c);
  }
  return { agree, neutral, disagree };
}

/** True when a set of parties spans more than one of the three blocs. */
export function spansBlocs(codes: PartyCode[]): boolean {
  const blocs = new Set(codes.map((c) => PARTIES[c].bloc).filter((b) => b !== "unaligned"));
  return blocs.size > 1;
}

/**
 * The configuration actually worth remarking on: a Netanyahu-bloc party and a
 * non-aligned one on the same side. Pro-with-anti happens often enough to be
 * unremarkable, and saying "these parties agree on nothing else" about every
 * side of every item would spend the observation until it means nothing.
 */
export function unlikelyBedfellows(codes: PartyCode[]): boolean {
  const blocs = new Set(codes.map((c) => PARTIES[c].bloc));
  return blocs.has("pro") && blocs.has("non");
}

/** §4.4 — the effective multiplier a topic allocation produces. */
export function effectiveWeights(weights: Weights): Record<BlockId, number> {
  const out = {} as Record<BlockId, number>;
  BLOCK_IDS.forEach((b) => {
    out[b] = blockWeight(weights, b);
  });
  return out;
}

/** True when the weighted and unweighted rankings disagree at the top (§4.4). */
export function rankingsDisagree(result: ScoreResult): boolean {
  if (result.ranked.length < 2) return false;
  const w = [...result.ranked].sort((a, b) => b.weighted - a.weighted)[0];
  const u = [...result.ranked].sort((a, b) => b.unweighted - a.unweighted)[0];
  return w.code !== u.code;
}
