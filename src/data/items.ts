/* ============================================================
   Item bank — spec §3
   46 scored statements across five blocks, plus two diagnostic
   items that never touch the axes or the match percentage.

   Coding key: A = agree · N = neutral or deliberately ambiguous
               D = disagree · "-" = no position on record
                                    (excluded from that party's denominator)

   `sign` is the item's polarity on its block's axis: +1 means
   "agree" moves you toward the positive pole named in BLOCKS.
   ============================================================ */

import { MATRIX_ORDER, type PartyCode } from "./parties";

export type Position = "A" | "N" | "D" | "-";
export type BlockId = "A" | "B" | "C" | "D" | "E";

export interface Block {
  id: BlockId;
  label: string;
  short: string;
  /** true for the two blocks rendered as the results grid (§4.6) */
  grid: boolean;
  neg: string;
  pos: string;
}

export const BLOCKS: Record<BlockId, Block> = {
  A: { id: "A", label: "Security & Territory", short: "security", grid: true, neg: "Dove", pos: "Hawk" },
  B: { id: "B", label: "Religion & State", short: "religion-and-state", grid: true, neg: "Secular", pos: "Religious" },
  C: { id: "C", label: "Institutions & Rule of Law", short: "institutions", grid: false, neg: "Parliamentary supremacy", pos: "Judicial constraint" },
  D: { id: "D", label: "National Identity", short: "national identity", grid: false, neg: "Ethnonational", pos: "Civic-egalitarian" },
  E: { id: "E", label: "Economy & Society", short: "economics", grid: false, neg: "Market", pos: "Social-democratic" },
};

export const BLOCK_IDS: BlockId[] = ["A", "B", "C", "D", "E"];

export interface Item {
  id: string;
  block: BlockId;
  sign: 1 | -1;
  text: string;
  pos: Record<PartyCode, Position>;
}

type Row = [id: string, block: BlockId, sign: 1 | -1, text: string, codings: string];

/**
 * §5 event-dependent items.
 *
 * A5 is pinned to a live negotiation, which makes it the only item in the bank
 * that can be invalidated by a news cycle rather than merely re-coded. The
 * durable replacement captures the same cleavage — sequencing of withdrawal
 * against disarmament — but survives the plan's acceptance, collapse or
 * supersession. It flips polarity cleanly, so every A/D coding inverts and
 * every N stays N.
 *
 * Swap by changing A5_VARIANT. Nothing else in the codebase moves.
 */
export type A5Variant = "live" | "durable";
export const A5_VARIANT: A5Variant = "live";

export const A5_ROWS: Record<A5Variant, Row> = {
  live: [
    "A5", "A", -1,
    "Israel should accept the Board of Peace's phased disarmament plan, withdrawing its forces in stages as Hamas decommissions its weapons.",
    "DNNNNDDNANAAA",
  ],
  durable: [
    "A5", "A", 1,
    "Israeli forces should withdraw from Gaza only once Hamas has completely disarmed.",
    "ANNNNAANDNDDD",
  ],
};

/** The Joint List merge resolves to A on the live wording, which inverts to D. */
const A5_JL: Record<A5Variant, Position> = { live: "A", durable: "D" };

/* --- the 13-column matrix, in MATRIX_ORDER --- */
const RAW: Row[] = [
  ["A1", "A", -1, "Israel should accept the establishment of a Palestinian state as part of a wider regional normalization agreement.", "DDNDDDDDADAAA"],
  ["A2", "A", 1, "Israel should retain indefinite overriding security control over the entire area west of the Jordan River.", "AAAANAAADADDD"],
  ["A3", "A", 1, "Israel should apply Israeli sovereignty to parts of the West Bank.", "ADDNNAANDDDDD"],
  ["A4", "A", 1, "Jewish civilian settlement in the Gaza Strip should be permitted to resume.", "NDDNNAADDDDDD"],
  A5_ROWS[A5_VARIANT],
  ["A6", "A", -1, "The Palestinian Authority should be given a governing role in post-war Gaza.", "DDNDNDDDADAAA"],
  ["A7", "A", 1, "Settlement construction in the West Bank should continue to expand.", "ANDNNAANDNDDD"],
  ["A8", "A", -1, "The state should vigorously enforce the law against illegal outposts and settler violence.", "DAANNDDAAAAAA"],
  ["A9", "A", 1, "Israel should be prepared to take major military action against Iran without American approval.", "AANNNAAADNDDD"],
  ["A10", "A", -1, "Israel should be willing to negotiate indirectly with Hamas to reach long-term arrangements.", "DDNNNDDDADAAA"],
  ["A11", "A", -1, "Israel should allow humanitarian aid into Gaza without limiting its volume.", "DNNNNDDNANAAA"],
  ["A12", "A", 1, "The death penalty should be available for convicted terrorists.", "ADDNNAAADDDDD"],

  ["B1", "B", -1, "Haredi yeshiva students should be subject to the military draft on the same terms as other citizens.", "DAADDNNAAA---"],
  ["B2", "B", -1, "Public transport should operate on Shabbat in municipalities that want it.", "DANDDDDAAN-A-"],
  ["B3", "B", -1, "State funding for yeshivot should be conditional on teaching the core curriculum (mathematics, English, science).", "NAADDDDAAA-A-"],
  ["B4", "B", -1, "Civil marriage should be available in Israel.", "DAADDDDAAADAN"],
  ["B5", "B", 1, "The Chief Rabbinate should retain exclusive authority over Jewish marriage, divorce and conversion.", "ADDAAAADDD-D-"],
  ["B6", "B", -1, "Reform and Conservative Judaism should receive state recognition and funding on par with Orthodoxy.", "DANDDDDNAA-N-"],
  ["B7", "B", 1, "Where Israeli law conflicts with halakha, halakha should take precedence.", "DDDAAAADDD-D-"],
  ["B8", "B", -1, "Businesses should be free to open on Shabbat.", "NANDDDDAAN-A-"],
  ["B9", "B", 1, "Gender separation should be permitted at publicly funded events and in public spaces.", "NDDAAAADDDND-"],
  ["B10", "B", -1, "Same-sex couples should have full marriage and adoption rights.", "DANDDDDAAADAN"],

  ["C1", "C", 1, "The Supreme Court should have the power to strike down Basic Laws.", "DNNDDDDNANAAA"],
  ["C2", "C", -1, "Elected politicians should hold a decisive majority on the Judicial Selection Committee.", "ADDAAAANDDDDD"],
  ["C3", "C", -1, "A Knesset majority should be able to override Supreme Court rulings.", "ADDAAAANDDDDD"],
  ["C4", "C", 1, "A prime minister under criminal indictment should be required to step down.", "DAADDDDAAAAAA"],
  ["C5", "C", 1, "The Attorney General's legal opinions should be binding on the government.", "DNADDDDNAAAAA"],
  ["C6", "C", 1, "A state commission of inquiry into the failures of 7 October, with a judicially appointed chair, should be established.", "DAADDDDAAAAAA"],
  ["C7", "C", -1, "The government should have greater control over public broadcasting and media regulation.", "ADDNNAADDDDDD"],
  ["C8", "C", -1, "Ministers should be able to appoint and dismiss their own ministry legal advisers.", "ADDANAANDDDDD"],
  ["C9", "C", 1, "Operational policing decisions should be insulated from ministerial direction.", "DAANNDDAAAAAA"],
  ["C10", "C", -1, "Foreign-government funding of Israeli civil-society organisations should be heavily taxed or restricted.", "ADDNNAANDDDDD"],

  ["D1", "D", -1, "Israel should be defined first and foremost as a Jewish state, even where this limits full equality for non-Jewish citizens.", "ANDANAANDNDDD"],
  ["D2", "D", 1, "Arab parties should be legitimate partners in a governing coalition.", "DNNDDDDDADAAA"],
  ["D3", "D", 1, "The Nation-State Basic Law should be amended to add a clause guaranteeing equality.", "DNNDDDDDANAAA"],
  ["D4", "D", 1, "Government investment in Arab towns should be substantially increased and insulated from coalition politics.", "NAANNDDNAAAAA"],
  ["D5", "D", -1, "Parties and candidates who reject Israel's definition as a Jewish and democratic state should be barred from running.", "AAAANAAADADDD"],
  ["D6", "D", -1, "The Law of Return's “grandchild clause” should be narrowed.", "NDDAAAADDD---"],

  ["E1", "E", 1, "The state should substantially increase spending on health and welfare, even if this requires higher taxes.", "DNNAAANDANAAA"],
  ["E2", "E", 1, "Child allowances and stipends for full-time yeshiva students should be increased.", "NDDAAAADNDAAA"],
  ["E3", "E", -1, "Israel should cut regulation and open the market to more imports to reduce the cost of living.", "AAADNNNANANDN"],
  ["E4", "E", 1, "Public housing construction should be significantly expanded.", "DNNAAANNANAAA"],
  ["E5", "E", -1, "The defence budget should grow even at the expense of civilian spending.", "AAANNAAADADDD"],
  ["E6", "E", 1, "Labour protections and the minimum wage should be strengthened.", "DNNANNNNANAAA"],
  ["E7", "E", -1, "Remaining state monopolies (ports, electricity, land) should be further privatized.", "AANDNNNADNNDD"],
  ["E8", "E", 1, "Israel should adopt binding emissions-reduction targets even at economic cost.", "DNNDDDDNANNAN"],
];

/* --- §3.7 The Joint List: merged ballot column (Hadash + Ta'al + Balad) --- */
const JL_POS: Record<string, Position> = {
  A1: "A", A2: "D", A3: "D", A4: "D", A5: A5_JL[A5_VARIANT], A6: "A", A7: "D", A8: "A", A9: "D", A10: "A", A11: "A", A12: "D",
  B1: "-", B2: "A", B3: "A", B4: "N", B5: "D", B6: "N", B7: "D", B8: "A", B9: "D", B10: "N",
  C1: "A", C2: "D", C3: "D", C4: "A", C5: "A", C6: "A", C7: "D", C8: "D", C9: "A", C10: "D",
  D1: "D", D2: "A", D3: "A", D4: "A", D5: "D", D6: "-",
  E1: "A", E2: "A", E3: "N", E4: "A", E5: "D", E6: "A", E7: "D", E8: "N",
};

/**
 * Cells where the merge rule (§3.7) did work worth disclosing.
 * "component" = one component coded, the other silent.
 * "divergent" = components disagreed; resolved to the less committal value.
 */
export const JL_MERGE_FLAGS: Record<string, "component" | "divergent"> = {
  B2: "component", B3: "component", B5: "component", B6: "component",
  B7: "component", B8: "component", B9: "component",
  B4: "divergent", B10: "divergent", E3: "divergent", E8: "divergent",
};

/* --- §3.6 ERD: 17 codeable items, the rest "-" --- */
const ERD_POS: Record<string, Position> = {
  A1: "D", A2: "A", A6: "D", A7: "N", A9: "N", A10: "D",
  B1: "A", B3: "A", B7: "D",
  C4: "N", C6: "N",
  D1: "A", D2: "D", D5: "A",
  E2: "D", E3: "A", E5: "A",
};

const EMPTY_POS = (): Record<PartyCode, Position> =>
  ({} as Record<PartyCode, Position>);

export const ITEMS: Item[] = RAW.map(([id, block, sign, text, codings]) => {
  if (codings.length !== MATRIX_ORDER.length) {
    throw new Error(`Item ${id}: expected ${MATRIX_ORDER.length} codings, got ${codings.length}`);
  }
  const pos = EMPTY_POS();
  MATRIX_ORDER.forEach((code, i) => {
    pos[code] = codings[i] as Position;
  });
  pos.JL = JL_POS[id] ?? "-";
  pos.ERD = ERD_POS[id] ?? "-";
  return { id, block, sign, text, pos };
});

export const ITEMS_BY_ID: Record<string, Item> = Object.fromEntries(
  ITEMS.map((it) => [it.id, it]),
);

export const ITEMS_BY_BLOCK: Record<BlockId, Item[]> = BLOCK_IDS.reduce(
  (acc, b) => {
    acc[b] = ITEMS.filter((i) => i.block === b);
    return acc;
  },
  {} as Record<BlockId, Item[]>,
);

/* --- §3F diagnostic items. Never enter the axes or the match. --- */
export interface Diagnostic {
  id: string;
  text: string;
  /** F2 is presentation-only and has no party codings */
  pos?: Record<PartyCode, Position>;
}

const f1Pos = (() => {
  const s = "ADDAAAADDDDDD";
  const pos = EMPTY_POS();
  MATRIX_ORDER.forEach((c, i) => {
    pos[c] = s[i] as Position;
  });
  pos.JL = "D";
  pos.ERD = "N"; // explicitly declined to rule out sitting with Netanyahu
  return pos;
})();

export const F1: Diagnostic = {
  id: "F1",
  text: "Benjamin Netanyahu should continue as prime minister.",
  pos: f1Pos,
};

export const F2: Diagnostic = {
  id: "F2",
  text: "I would rather see a broad national-unity government than a narrow ideological one.",
};

