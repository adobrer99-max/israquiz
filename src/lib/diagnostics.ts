/* ============================================================
   Instrument diagnostics — spec §4.7
   The pre-launch half of item validation: what the bank can and
   cannot tell apart, computed from the codings alone. The
   post-launch half (response variance, item–axis correlation)
   needs live responses and is not available offline.
   ============================================================ */

import { BLOCK_IDS, ITEMS, type BlockId, type Position } from "../data/items";
import { BALLOT_PARTIES, PARTIES, type PartyCode } from "../data/parties";
import { partyAxesFor } from "./scoring";

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
}

export function itemDiagnostics(): ItemDiagnostic[] {
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
 */
export function axisCollapses(): AxisCollapse[] {
  const out: AxisCollapse[] = [];
  for (const block of BLOCK_IDS) {
    const buckets = new Map<number, PartyCode[]>();
    for (const c of BALLOT_PARTIES) {
      const v = Math.round(partyAxesFor(c).value[block] * 100) / 100;
      buckets.set(v, [...(buckets.get(v) ?? []), c]);
    }
    for (const [value, parties] of buckets) {
      if (parties.length > 1) out.push({ block, value, parties });
    }
  }
  return out.sort((a, b) => b.parties.length - a.parties.length);
}

/** Ballot parties whose full 46-item coding vector is identical. */
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
