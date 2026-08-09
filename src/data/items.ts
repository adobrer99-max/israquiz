/* ============================================================
   Item bank — spec §3
   47 scored statements across five blocks, plus diagnostic and
   cross-cutting items that never touch the axes or the match.

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
  // "vigorously" removed after tester feedback: an intensifier makes the
  // disagreeing side sound like it is endorsing lawlessness, which §5's
  // both-sides test forbids. The codings are unchanged — the parties coded D
  // favour retroactive legalisation of outposts, not merely lighter
  // enforcement, so they still decline the plain statement.
  ["A8", "A", -1, "The state should enforce the law against illegal outposts and settler violence.", "DAANNDDAAAAAA"],
  ["A9", "A", 1, "Israel should be prepared to take major military action against Iran without American approval.", "AANNNAAADNDDD"],
  ["A10", "A", -1, "Israel should be willing to negotiate indirectly with Hamas to reach long-term arrangements.", "DDNNNDDDADAAA"],
  ["A12", "A", 1, "The death penalty should be available for convicted terrorists.", "ADDNNAAADDDDD"],
  // A13 added after §4.7 validation: nothing else in the bank separated The
  // Democrats, Ra'am and the Joint List, all three of which were coded
  // identically on the other twelve security items.
  ["A13", "A", 1, "Armed attacks on Israeli soldiers in the West Bank should be condemned without qualification.", "AAAAAAAAAAAND"],
  // A14 sits on the security axis, not religion-and-state, even though the cut
  // it makes is a religious one. Shas and UTJ disagree *because* they hold the
  // strictest rabbinic position — haredi authorities forbid ascending at all —
  // so scoring it on the religion axis would drive the two most religious
  // parties toward the secular pole. As a sovereignty assertion it reads
  // correctly: agree is hawkish.
  ["A14", "A", 1, "Jewish prayer should be permitted on the Temple Mount.", "NNNDDAANDDDDD"],

  ["B1", "B", -1, "Haredi yeshiva students should be subject to the military draft on the same terms as other citizens.", "DAADDNNAAA---"],
  ["B2", "B", -1, "Public transport should operate on Shabbat in municipalities that want it.", "DANDDDDAAN-A-"],
  ["B3", "B", -1, "State funding for yeshivot should be conditional on teaching the core curriculum (mathematics, English, science).", "NAADDDDAAA-A-"],
  ["B4", "B", -1, "Civil marriage should be available in Israel.", "DAADDDDAAADAN"],
  ["B5", "B", 1, "The Chief Rabbinate should retain exclusive authority over Jewish marriage, divorce and conversion.", "ADDAAAADDD-D-"],
  ["B6", "B", -1, "Reform and Conservative Judaism should receive state recognition and funding on par with Orthodoxy.", "DANDDDDNAA-N-"],
  ["B7", "B", 1, "Where Israeli law conflicts with halakha, halakha should take precedence.", "DDDAAAADDD-D-"],
  ["B8", "B", -1, "Businesses should be free to open on Shabbat.", "NANDDDDAAN-A-"],
  ["B9", "B", 1, "Gender separation should be permitted at publicly funded events and in public spaces.", "NDDAAAADDDND-"],
  // Split after tester feedback: marriage and adoption were one item, and they
  // are not one question in Israel. There is no civil marriage for anyone, so
  // same-sex marriage is entangled with the Rabbinate's monopoly, while
  // adoption was opened by the courts and draws a softer opposition.
  ["B10", "B", -1, "Same-sex couples should be able to marry in Israel.", "DANDDDDAAADAN"],
  ["B13", "B", -1, "Same-sex couples should have full adoption rights.", "NANDDDDAAADAN"],
  // B11: signed 2016, frozen 2017, never enacted. Likud is coded N rather than
  // D because the freeze was an act of coalition management that the platform
  // never repudiated — the §7 rule of coding the stated position and
  // documenting the choice.
  ["B11", "B", -1, "The Western Wall egalitarian plaza agreement should be implemented.", "NANDDDDAAA-N-"],
  // B12 is deliberately concrete. The abstractions in this block — halakha's
  // precedence, the Rabbinate's authority — invite people to answer on
  // principle; a hospital ward is where the principle is actually enforced.
  ["B12", "B", -1, "Chametz should be permitted in public hospitals during Passover.", "DANDDDDAAA-A-"],
  // B14 is on the religion axis, not security: it is a question about how far
  // rabbinic authority reaches into military policy, and nothing about it is
  // hawkish or dovish. Placed on A it would have pulled Religious Zionism —
  // sitting at the hawk pole — toward the doves for holding a religious view.
  // It is the one item that separates Religious Zionism from Otzma Yehudit,
  // which have campaigned very differently on it.
  ["B14", "B", -1, "Women should be eligible to serve in every military combat role.", "NAADDNDAAA-N-"],

  ["C1", "C", 1, "The Supreme Court should have the power to strike down Basic Laws.", "DNNDDDDNANAAA"],
  ["C3", "C", -1, "A Knesset majority should be able to override Supreme Court rulings.", "ADDAAAANDDDDD"],
  ["C5", "C", 1, "The Attorney General's legal opinions should be binding on the government.", "DNADDDDNAAAAA"],
  ["C6", "C", 1, "A state commission of inquiry into the failures of 7 October, with a judicially appointed chair, should be established.", "DAADDDDAAAAAA"],
  ["C8", "C", -1, "Ministers should be able to appoint and dismiss their own ministry legal advisers.", "ADDANAANDDDDD"],
  ["C9", "C", 1, "Operational policing decisions should be insulated from ministerial direction.", "DAANNDDAAAAAA"],

  ["D1", "D", -1, "Israel should be defined first and foremost as a Jewish state, even where this limits full equality for non-Jewish citizens.", "ANDANAANDNDDD"],
  ["D2", "D", 1, "Arab parties should be legitimate partners in a governing coalition.", "DNNDDDDDADAAA"],
  ["D3", "D", 1, "The Nation-State Basic Law should be amended to add a clause guaranteeing equality.", "DNNDDDDDANAAA"],
  ["D4", "D", 1, "Government investment in Arab towns should be substantially increased and insulated from coalition politics.", "NAANNDDNAAAAA"],
  ["D6", "D", -1, "The Law of Return's “grandchild clause” should be narrowed.", "NDDAAAADDD---"],
  // D7 added after §4.7 validation. Zionism belongs on the identity axis, not
  // the security one: The Democrats are dovish and Zionist, and an item that
  // scored those together as hawkishness would wreck the horizontal axis.
  ["D7", "D", -1, "Zionism is a legitimate expression of Jewish national self-determination.", "AAAANAAAAANDD"],

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
  A1: "A", A2: "D", A3: "D", A4: "D", A5: A5_JL[A5_VARIANT], A6: "A", A7: "D", A8: "A", A9: "D", A10: "A", A11: "A", A12: "D", A13: "N", A14: "D",
  B1: "-", B2: "A", B3: "A", B4: "N", B5: "D", B6: "N", B7: "D", B8: "A", B9: "D", B10: "N", B11: "N", B12: "A", B13: "N", B14: "N",
  C1: "A", C2: "D", C3: "D", C4: "A", C5: "A", C6: "A", C7: "D", C8: "D", C9: "A", C10: "D",
  D1: "D", D2: "A", D3: "A", D4: "A", D5: "D", D6: "-", D7: "D",
  E1: "A", E2: "A", E3: "N", E4: "A", E5: "D", E6: "A", E7: "D", E8: "N",
};

/**
 * Cells where the merge rule (§3.7) did work worth disclosing.
 * "component" = one component coded, the other silent.
 * "divergent" = components disagreed; resolved to the less committal value.
 */
export const JL_MERGE_FLAGS: Record<string, "component" | "divergent"> = {
  B2: "component", B3: "component", B5: "component", B6: "component",
  B7: "component", B8: "component", B9: "component", B11: "component", B12: "component",
  B14: "component",
  // A13 is the first divergence outside religion-and-state and economics.
  // The spec's claim that the three components are identical on security held
  // only because the bank had not asked the question that divides them.
  A13: "divergent",
  B4: "divergent", B10: "divergent", B13: "divergent", E3: "divergent", E8: "divergent",
};

/* --- §3.6 ERD: 17 codeable items, the rest "-" --- */
const ERD_POS: Record<string, Position> = {
  A1: "D", A2: "A", A6: "D", A7: "N", A9: "N", A10: "D",
  B1: "A", B3: "A", B7: "D",
  C4: "N", C6: "N",
  D1: "A", D2: "D", D5: "A", D7: "A",
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

/* ============================================================
   Retired items — spec §4.7, "publish what you cut and why"
   Each of these carried a coding row identical to another item's,
   so no pair of parties was separated by one and not the other.
   They are kept here, and shown in the app, rather than deleted:
   a cut is an editorial act and should be auditable.
   ============================================================ */

export interface RetiredItem extends Item {
  /** the item kept in its place */
  duplicateOf: string;
  reason: string;
}

const RETIRED_ROWS: (readonly [Row, string, string])[] = [
  [
    ["A11", "A", -1, "Israel should allow humanitarian aid into Gaza without limiting its volume.", "DNNNNDDNANAAA"],
    "A5",
    "Identical contribution to the security axis as A5. A5 was kept because it has a succession plan — §5's durable replacement is drafted and one line swaps it in — where this item had none. The closest of the six calls, and the easiest to reverse.",
  ],
  [
    ["C2", "C", -1, "Elected politicians should hold a decisive majority on the Judicial Selection Committee.", "ADDAAAANDDDDD"],
    "C3",
    "Identical contribution to the institutions axis as C3. C3 was kept because it states the underlying principle where this states a mechanism for reaching it, and §5 prefers the principle to the proposal.",
  ],
  [
    ["C4", "C", 1, "A prime minister under criminal indictment should be required to step down.", "DAADDDDAAAAAA"],
    "C6",
    "Identical contribution to the institutions axis as C6. C6 was kept because §3.6 turns on the distinction it draws — a state commission with a judicially appointed chair against a 'national' probe — and because this item ran close to being a second Netanyahu question, which F1 already asks and deliberately keeps out of the scoring.",
  ],
  [
    ["C7", "C", -1, "The government should have greater control over public broadcasting and media regulation.", "ADDNNAADDDDDD"],
    "C9",
    "Identical contribution to the institutions axis as C9. C9 was kept because §3.8 added it deliberately, for a party fielding a former police commander for the national security portfolio, and because it is the cell most likely to stop being a duplicate once Ra'am's column is re-coded.",
  ],
  [
    ["C10", "C", -1, "Foreign-government funding of Israeli civil-society organisations should be heavily taxed or restricted.", "ADDNNAANDDDDD"],
    "A3",
    "Carried the same coding row as A3 across all thirteen columns. A3 was kept as the more consequential question; this one cost a slot without separating any party A3 does not.",
  ],
  [
    ["D5", "D", -1, "Parties and candidates who reject Israel's definition as a Jewish and democratic state should be barred from running.", "AAAANAAADADDD"],
    "A2",
    "Carried the same coding row as A2 across all thirteen columns. A2 was kept as the more consequential question, and D2 and D3 already cover the legitimacy of Arab parties from two other angles.",
  ],
];

export const RETIRED: RetiredItem[] = RETIRED_ROWS.map(([row, duplicateOf, reason]) => {
  const [id, block, sign, text, codings] = row;
  const pos = EMPTY_POS();
  MATRIX_ORDER.forEach((code, i) => {
    pos[code] = codings[i] as Position;
  });
  pos.JL = JL_POS[id] ?? "-";
  pos.ERD = ERD_POS[id] ?? "-";
  return { id, block, sign, text, pos, duplicateOf, reason };
});

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

function diagnosticPos(codings: string, jl: Position, erd: Position): Record<PartyCode, Position> {
  const pos = EMPTY_POS();
  MATRIX_ORDER.forEach((c, i) => {
    pos[c] = codings[i] as Position;
  });
  pos.JL = jl;
  pos.ERD = erd;
  return pos;
}

export const F1: Diagnostic = {
  id: "F1",
  text: "Benjamin Netanyahu should continue as prime minister.",
  // ERD explicitly declined to rule out sitting with Netanyahu.
  pos: diagnosticPos("ADDAAAADDDDDD", "D", "N"),
};

export const F2: Diagnostic = {
  id: "F2",
  text: "I would rather see a broad national-unity government than a narrow ideological one.",
};

/**
 * Block G — cross-cutting. Coded, reported, never scored.
 *
 * These load on none of the five axes. Each one is discriminating, and each
 * would corrupt whichever axis it was forced onto: G1 measures coalitionability
 * rather than ideology, G2 measures party size, and G3 is intra-Jewish communal
 * politics that would load wrongly on an identity axis about Arab citizens.
 * They are reported as a separate readout, which is the honest place for an
 * item that discriminates on something other than issue position.
 */
export const G1: Diagnostic = {
  id: "G1",
  text: "An Arab party should be willing to join a coalition led by a Zionist party.",
  pos: diagnosticPos("NNNNNDDNANADD", "D", "-"),
};

export const G2: Diagnostic = {
  id: "G2",
  text: "The electoral threshold should be raised above its current 3.25%.",
  pos: diagnosticPos("AANDDDDADDDDD", "D", "-"),
};

/**
 * G3 has no party coded D. That is exactly why it cannot be scored: §5 requires
 * a scored statement to draw both agreement and disagreement, and one that
 * nobody opposes inflates every match percentage uniformly. As an unscored
 * readout it still does real work — the A/N split is the Shas-versus-UTJ
 * communal cut, which nothing else in the bank produces.
 */
export const G3: Diagnostic = {
  id: "G3",
  text: "The state should acknowledge and compensate for discrimination against Mizrahi immigrants in its early decades.",
  pos: diagnosticPos("ANNANANNANNA-", "A", "-"),
};

/** Cross-cutting items, asked after the topic weighting. */
export const CROSS_CUTTING: Diagnostic[] = [G1, G2, G3];

/** Every unscored item, in the order asked (§3F). */
export const DIAGNOSTICS: Diagnostic[] = [F1, F2, ...CROSS_CUTTING];

