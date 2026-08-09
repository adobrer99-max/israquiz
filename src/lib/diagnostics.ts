/* ============================================================
   Instrument diagnostics — spec §4.7
   The pre-launch half of item validation: what the bank can and
   cannot tell apart, computed from the codings alone. The
   post-launch half (response variance, item–axis correlation)
   needs live responses and is not available offline.
   ============================================================ */

import { BLOCK_IDS, ITEMS, type BlockId, type Item, type Position } from "../data/items";
import { BALLOT_PARTIES, PARTIES, type PartyCode } from "../data/parties";
import { COVERAGE_FLOOR, partyAxesFor } from "./scoring";

export interface ItemDiagnostic {
  id: string;
  block: BlockId;
  text: string;
  agree: number;
  neutral: number;
  disagree: number;
  uncoded: number;
  /**
   * 0 … 1. Probability that two ballot parties drawn at random hold different
   * positions on this item. 0 means the statement separates nobody.
   */
  discrimination: number;
  /**
   * Pairs of ballot parties that would land on an identical coordinate on this
   * item's own axis if the item were dropped, but do not with it in.
   *
   * This is the metric that answers the §4.6 failure mode, and it is the reason
   * a lopsided item is not necessarily a dead one: an item almost every party
   * agrees with can still be the only thing keeping two parties apart on an
   * axis, and dropping it for low variance would undo exactly that.
   */
  collapsesPrevented: number;
}

/** Axis coordinate for one party over an explicit item set (§4.3). */
function coordinate(set: Item[], code: PartyCode): number {
  let sum = 0, n = 0;
  for (const it of set) {
    const p = it.pos[code];
    if (p === "-") continue;
    sum += it.sign * (p === "A" ? 2 : p === "D" ? -2 : 0);
    n++;
  }
  return n ? Math.round(((100 * sum) / (2 * n)) * 1e6) / 1e6 : 0;
}

function equalPairs(set: Item[]): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < BALLOT_PARTIES.length; i++) {
    for (let j = i + 1; j < BALLOT_PARTIES.length; j++) {
      const a = BALLOT_PARTIES[i];
      const b = BALLOT_PARTIES[j];
      if (coordinate(set, a) === coordinate(set, b)) out.add(`${a}|${b}`);
    }
  }
  return out;
}

function collapsesPreventedCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const b of BLOCK_IDS) {
    const set = ITEMS.filter((i) => i.block === b);
    const withAll = equalPairs(set);
    for (const it of set) {
      const without = equalPairs(set.filter((x) => x.id !== it.id));
      let n = 0;
      for (const pair of without) if (!withAll.has(pair)) n++;
      counts[it.id] = n;
    }
  }
  return counts;
}

export function itemDiagnostics(): ItemDiagnostic[] {
  const prevented = collapsesPreventedCounts();
  return ITEMS.map((it) => {
    const counts: Record<Position, number> = { A: 0, N: 0, D: 0, "-": 0 };
    for (const c of BALLOT_PARTIES) counts[it.pos[c]]++;
    const coded = counts.A + counts.N + counts.D;
    let same = 0;
    for (const k of ["A", "N", "D"] as Position[]) same += counts[k] * (counts[k] - 1);
    const pairs = coded * (coded - 1);
    return {
      id: it.id,
      block: it.block,
      text: it.text,
      agree: counts.A,
      neutral: counts.N,
      disagree: counts.D,
      uncoded: counts["-"],
      discrimination: pairs ? 1 - same / pairs : 0,
      collapsesPrevented: prevented[it.id],
    };
  });
}

export interface AxisCollapse {
  block: BlockId;
  value: number;
  parties: PartyCode[];
}

/**
 * Groups of ballot parties that land on an identical axis coordinate.
 * Any group larger than one is a place the axis cannot tell them apart.
 *
 * Restricted to parties above the coverage floor, because a party suppressed
 * from the ranking and the grid cannot collide with anything a reader can see.
 */
export function axisCollapses(): AxisCollapse[] {
  const plotted = BALLOT_PARTIES.filter(
    (c) => ITEMS.filter((i) => i.pos[c] !== "-").length / ITEMS.length >= COVERAGE_FLOOR,
  );
  const out: AxisCollapse[] = [];
  for (const block of BLOCK_IDS) {
    const buckets = new Map<number, PartyCode[]>();
    for (const c of plotted) {
      const v = Math.round(partyAxesFor(c).value[block] * 100) / 100;
      buckets.set(v, [...(buckets.get(v) ?? []), c]);
    }
    for (const [value, parties] of buckets) {
      if (parties.length > 1) out.push({ block, value, parties });
    }
  }
  return out.sort((a, b) => b.parties.length - a.parties.length);
}

/** Ballot parties whose full coding vector is identical across the bank. */
export function identicalColumns(): PartyCode[][] {
  const seen = new Map<string, PartyCode[]>();
  for (const c of BALLOT_PARTIES) {
    const key = ITEMS.map((it) => it.pos[c]).join("");
    seen.set(key, [...(seen.get(key) ?? []), c]);
  }
  return [...seen.values()].filter((g) => g.length > 1);
}

export interface CoverageRow {
  code: PartyCode;
  name: string;
  coverage: number;
  byBlock: Record<BlockId, number>;
}

export function coverageTable(): CoverageRow[] {
  return (Object.keys(PARTIES) as PartyCode[])
    .map((code) => {
      const byBlock = {} as Record<BlockId, number>;
      for (const b of BLOCK_IDS) {
        const set = ITEMS.filter((i) => i.block === b);
        byBlock[b] = set.filter((i) => i.pos[code] !== "-").length / set.length;
      }
      return {
        code,
        name: PARTIES[code].name,
        coverage: ITEMS.filter((i) => i.pos[code] !== "-").length / ITEMS.length,
        byBlock,
      };
    })
    .sort((a, b) => b.coverage - a.coverage);
}
