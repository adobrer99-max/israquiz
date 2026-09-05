import { describe, expect, it } from "vitest";
import {
  agreementPoints, COVERAGE_FLOOR, DEFAULT_WEIGHTS, diagnosticSides, flatOpposition,
  partyAxesFor, score, spansBlocs, unlikelyBedfellows, userAxes, type Answers, type Weights,
} from "./scoring";
import {
  A5_ROWS, BLOCK_IDS, CROSS_CUTTING, F1, F2, G1, G2, G3, INFERRED, ITEMS, ITEMS_BY_BLOCK, JL_MERGE_FLAGS, PENDING, RETIRED,
  type Position,
} from "../data/items";
import { axisCollapses, identicalColumns, itemDiagnostics } from "./diagnostics";
import { orderedBlocks, orderedItems } from "./shuffle";
import { BALLOT_PARTIES, COMPONENT_PARTIES, MATRIX_ORDER, PARTIES, WITHDRAWN_PARTIES, type PartyCode } from "../data/parties";

/** Answer every item exactly as a party would, at full intensity. */
function answerAs(code: PartyCode): Answers {
  const a: Answers = {};
  for (const it of ITEMS) {
    const p = it.pos[code];
    if (p === "-") continue;
    a[it.id] = p === "A" ? 2 : p === "D" ? -2 : 0;
  }
  return a;
}

describe("bank integrity (§3, §5)", () => {
  it("holds 50 scored items across five blocks", () => {
    expect(ITEMS).toHaveLength(50);
    expect(BLOCK_IDS.map((b) => ITEMS_BY_BLOCK[b].length)).toEqual([15, 14, 6, 7, 8]);
  });

  it("gives every party a coding cell for every item", () => {
    const codes = Object.keys(PARTIES) as PartyCode[];
    for (const it of ITEMS) {
      for (const c of codes) {
        expect(["A", "N", "D", "-"], `${it.id}/${c}`).toContain(it.pos[c]);
      }
    }
  });

  it("has unique item ids", () => {
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
  });

  it("carries no unanimous item — every statement is agreed by one party and disagreed by another", () => {
    for (const it of ITEMS) {
      const vals = MATRIX_ORDER.map((c) => it.pos[c]);
      expect(vals, `${it.id} has no A`).toContain("A");
      expect(vals, `${it.id} has no D`).toContain("D");
    }
  });

  it("keeps every statement under 30 words and free of justification clauses", () => {
    for (const it of ITEMS) {
      expect(it.text.split(/\s+/).length, `${it.id} too long`).toBeLessThanOrEqual(30);
      expect(it.text.toLowerCase(), `${it.id} justifies itself`).not.toMatch(/\bbecause\b|\bgiven that\b/);
    }
  });
});

describe("event-dependent items (§5)", () => {
  it("keeps the durable A5 replacement a faithful inversion of the live wording", () => {
    const [, , liveSign, , liveCodings] = A5_ROWS.live;
    const [, , durableSign, durableText, durableCodings] = A5_ROWS.durable;
    expect(durableSign).toBe(-liveSign);
    const invert = (p: string) => (p === "A" ? "D" : p === "D" ? "A" : p);
    expect(durableCodings).toBe([...liveCodings].map(invert).join(""));
    expect(durableText).not.toMatch(/Board of Peace/);
    expect(durableText.split(/\s+/).length).toBeLessThanOrEqual(30);
  });
});

describe("Temple Mount placement (A14)", () => {
  const pos = (c: PartyCode) => ITEMS.find((i) => i.id === "A14")!.pos[c];

  it("cuts the religious right away from the haredi parties", () => {
    expect([pos("OTZ"), pos("RZ")]).toEqual(["A", "A"]);
    expect([pos("SHS"), pos("UTJ")]).toEqual(["D", "D"]);
    expect(pos("LIK")).toBe("N");
  });

  it("makes that cut nowhere else in the bank", () => {
    const others = ITEMS.filter(
      (it) =>
        it.id !== "A14" &&
        it.pos.OTZ === "A" && it.pos.RZ === "A" &&
        it.pos.SHS === "D" && it.pos.UTJ === "D",
    );
    expect(others.map((i) => i.id)).toEqual([]);
  });

  /**
   * The item lives on the security axis rather than religion-and-state. Shas
   * and UTJ disagree because they hold the strictest rabbinic position, so
   * scoring it on the religion axis would drag the two most religious parties
   * toward the secular pole. This pins the placement.
   */
  it("does not drag the haredi parties off the religious pole", () => {
    expect(ITEMS.find((i) => i.id === "A14")!.block).toBe("A");
    for (const c of ["SHS", "UTJ"] as PartyCode[]) {
      expect(partyAxesFor(c).value.B, c).toBe(100);
    }
  });
});

describe("cross-cutting block G", () => {
  it("keeps every G item out of the scored bank", () => {
    for (const d of CROSS_CUTTING) {
      expect(ITEMS.some((i) => i.id === d.id), d.id).toBe(false);
    }
  });

  it("cannot leak into the match or the axes even if answered", () => {
    const base = answerAs("LIK");
    const withG: Answers = { ...base };
    for (const d of [...CROSS_CUTTING, F1, F2]) withG[d.id] = -2;
    const before = score(base);
    const after = score(withG);
    for (const code of [...BALLOT_PARTIES, ...COMPONENT_PARTIES]) {
      expect(after.all[code].weighted, code).toBe(before.all[code].weighted);
      expect(after.all[code].scoredItems, code).toBe(before.all[code].scoredItems);
    }
    expect(after.user.value).toEqual(before.user.value);
    expect(after.answeredCount).toBe(before.answeredCount);
  });

  /**
   * The Joint List arrangement is confirmed rather than expected, so it is now a
   * fact worth pinning: Hadash–Ta'al and Balad are components, the Joint List is
   * the thing on the ballot, and no edit to the registry should quietly promote a
   * component into a ranking a voter cannot act on.
   */
  it("keeps the Joint List on the ballot and its components off it", () => {
    expect(PARTIES.JL.ballot).toBe(true);
    expect(PARTIES.HTA.ballot).toBe(false);
    expect(PARTIES.BAL.ballot).toBe(false);

    const r = score({});
    expect(r.components.map((c) => c.code).sort()).toEqual(["BAL", "HTA"]);
    const ranked = r.ranked.map((x) => x.code);
    expect(ranked).not.toContain("HTA");
    expect(ranked).not.toContain("BAL");
    expect([...ranked, ...r.lowCoverage.map((x) => x.code)]).toContain("JL");
  });

  it("separates Ra'am from the Joint List on coalitionability (G1)", () => {
    expect(G1.pos!.RAM).toBe("A");
    expect(G1.pos!.JL).toBe("D");
  });

  it("puts Otzma Yehudit and Balad on the same side of the threshold (G2)", () => {
    expect(G2.pos!.OTZ).toBe(G2.pos!.BAL);
    const sides = diagnosticSides(G2.pos!);
    expect(sides.disagree).toContain("OTZ");
    expect(sides.disagree).toContain("JL");
    expect(spansBlocs(sides.disagree)).toBe(true);
    expect(spansBlocs(sides.agree)).toBe(true);
    // the remark-worthy case: Netanyahu-bloc and non-aligned parties together
    expect(unlikelyBedfellows(sides.disagree)).toBe(true);
    expect(unlikelyBedfellows(sides.agree)).toBe(false);
  });

  it("reserves the bedfellows remark for sides that actually earn it", () => {
    const g1 = diagnosticSides(G1.pos!);
    expect(unlikelyBedfellows(g1.disagree), "G1 disagree").toBe(true);
    expect(unlikelyBedfellows(g1.agree), "G1 agree").toBe(false);
    expect(unlikelyBedfellows(diagnosticSides(G3.pos!).agree), "G3 agree").toBe(true);
  });

  it("makes the Shas–UTJ communal cut nothing else makes (G3)", () => {
    expect(G3.pos!.SHS).toBe("A");
    expect(G3.pos!.UTJ).toBe("N");
  });

  /**
   * G3 draws no disagreement from any party. §5 requires a scored statement to
   * draw both, and one nobody opposes would inflate every match percentage
   * uniformly — which is the concrete reason block G has to stay unscored.
   */
  it("keeps the unopposed item unscorable", () => {
    expect(diagnosticSides(G3.pos!).disagree).toEqual([]);
    expect(ITEMS.some((i) => i.id === "G3")).toBe(false);
  });

  it("gives every G item a coding for every party", () => {
    for (const d of CROSS_CUTTING) {
      for (const c of Object.keys(PARTIES) as PartyCode[]) {
        expect(["A", "N", "D", "-"], `${d.id}/${c}`).toContain(d.pos![c]);
      }
    }
  });
});

describe("retired items (§4.7 — publish what you cut and why)", () => {
  /** Signed contribution of an item to its own block, per party. */
  const contribution = (it: { sign: number; pos: Record<string, string> }) =>
    MATRIX_ORDER.map((c) => {
      const p = it.pos[c];
      return p === "-" ? "x" : String(it.sign * (p === "A" ? 1 : p === "D" ? -1 : 0));
    }).join(",");

  it("keeps six retired statements out of the scored bank", () => {
    expect(RETIRED).toHaveLength(6);
    for (const r of RETIRED) expect(ITEMS.some((i) => i.id === r.id), r.id).toBe(false);
  });

  it("names a surviving item for each one cut, carrying the same information", () => {
    for (const r of RETIRED) {
      const kept = ITEMS.find((i) => i.id === r.duplicateOf);
      expect(kept, `${r.id} -> ${r.duplicateOf}`).toBeDefined();
      const same = MATRIX_ORDER.every((c) => r.pos[c] === kept!.pos[c]);
      const inverted = MATRIX_ORDER.every(
        (c) => r.pos[c] === (kept!.pos[c] === "A" ? "D" : kept!.pos[c] === "D" ? "A" : kept!.pos[c]),
      );
      expect(same || inverted, `${r.id} does not duplicate ${r.duplicateOf}`).toBe(true);
      expect(r.reason.length, r.id).toBeGreaterThan(40);
    }
  });

  it("leaves no two items in a block contributing identically to its axis", () => {
    const seen = new Map<string, string[]>();
    for (const it of ITEMS) {
      const key = `${it.block}|${contribution(it)}`;
      seen.set(key, [...(seen.get(key) ?? []), it.id]);
    }
    const dupes = [...seen.values()].filter((g) => g.length > 1);
    expect(dupes).toEqual([]);
  });

  /**
   * A8 and C9 still share a coding row. They sit in different blocks, so neither
   * axis is redundant, and §3.8 added C9 for a reason that should make it diverge
   * once Ra'am's column is re-coded. Pinned so the exception stays deliberate.
   */
  it("leaves exactly one duplicate row, and it is the deliberate one", () => {
    // Every column, not just the 13-character matrix: parties held in an
    // overlay (JL, Unity, Noam, HPP) are ballot entities too, and a check blind to
    // them would call two items identical when a real party tells them apart.
    const all = Object.keys(PARTIES) as PartyCode[];
    const canon = (it: { pos: Record<string, string> }) => {
      const raw = all.map((c) => it.pos[c]).join("");
      const inv = [...raw].map((c) => (c === "A" ? "D" : c === "D" ? "A" : c)).join("");
      return raw < inv ? raw : inv;
    };
    const seen = new Map<string, string[]>();
    for (const it of ITEMS) seen.set(canon(it), [...(seen.get(canon(it)) ?? []), it.id]);
    const dupes = [...seen.values()].filter((g) => g.length > 1).map((g) => g.sort().join(","));
    expect(dupes).toEqual(["A8,C9"]);
  });
});

describe("presentation order (§8.9, extended)", () => {
  it("keeps every item, exactly once", () => {
    const ids = orderedItems(42).map((i) => i.id);
    expect(ids).toHaveLength(ITEMS.length);
    expect(new Set(ids).size).toBe(ITEMS.length);
  });

  it("never interleaves topics — each block appears as one unbroken run", () => {
    for (const seed of [0, 1, 2, 7, 99, 12345]) {
      const runs = orderedItems(seed)
        .map((i) => i.block)
        .join("")
        .replace(/(.)\1*/g, "$1");
      expect(runs.length, `seed ${seed}`).toBe(BLOCK_IDS.length);
    }
  });

  /**
   * The fixed block order meant every respondent met the twelve security items
   * first, putting a primacy effect on one of the two axes the grid is built
   * from. Blocks are now shuffled as units.
   */
  it("does not always open on the same topic", () => {
    const first = new Set(Array.from({ length: 200 }, (_, s) => orderedBlocks(s)[0]));
    expect(first.size).toBe(BLOCK_IDS.length);
  });

  it("opens on each topic about equally often", () => {
    const counts: Record<string, number> = {};
    const N = 4000;
    for (let s = 0; s < N; s++) {
      const b = orderedBlocks(s)[0];
      counts[b] = (counts[b] ?? 0) + 1;
    }
    for (const b of BLOCK_IDS) {
      expect(counts[b] / N, b).toBeGreaterThan(0.13);
      expect(counts[b] / N, b).toBeLessThan(0.27);
    }
  });

  it("is stable for a given seed, so going back and resuming do not reshuffle", () => {
    expect(orderedItems(31).map((i) => i.id)).toEqual(orderedItems(31).map((i) => i.id));
    expect(orderedBlocks(31)).toEqual(orderedItems(31).map((i) => i.block).filter((b, i, a) => b !== a[i - 1]));
  });
});

describe("items revised after tester feedback", () => {
  const item = (id: string) => ITEMS.find((i) => i.id === id)!;

  it("states the settler-violence item as two concrete acts, with no intensifier", () => {
    expect(item("A8").text).not.toMatch(/vigorous/i);
    expect(item("A8").text).toBe(
      "Illegal outposts should be removed and settler violence prosecuted.",
    );
    // The point of naming the acts is that refusing them stays a real position.
    expect(item("A8").pos.LIK).toBe("D");
    expect(item("A8").pos.OTZ).toBe("D");
    expect(item("A8").pos.DEM).toBe("A");
  });

  it("asks marriage and adoption separately, and they are not the same question", () => {
    expect(item("B10").text).toMatch(/marry/);
    expect(item("B13").text).toMatch(/adoption/);
    expect(item("B10").text).not.toMatch(/adoption/);
    const identical = MATRIX_ORDER.every((c) => item("B10").pos[c] === item("B13").pos[c]);
    expect(identical, "the split produced two copies of one item").toBe(false);
  });

  it("separates Otzma Yehudit from Religious Zionism via women in combat roles", () => {
    expect(item("B14").pos.RZ).toBe("D");
    expect(item("B14").pos.OTZ).toBe("N");
    expect(partyAxesFor("OTZ").value.B).not.toBe(partyAxesFor("RZ").value.B);
  });

  it("puts women in combat on the religion axis, not the security one", () => {
    expect(item("B14").block).toBe("B");
    // Religious Zionism holds a religious view here; on axis A it would have
    // been scored as dovishness and dragged it off the hawk pole.
    expect(partyAxesFor("RZ").value.A).toBe(100);
  });
});

/**
 * A governing party polling out of the next Knesset is the case §4.8.1 exists
 * for, and the easiest one to forget to flag — the threshold caveat is usually
 * added for new or tiny lists, not for the one holding the finance ministry.
 */
describe("Religious Zionism's threshold caveat", () => {
  it("carries a polling-based threshold flag despite governing", () => {
    expect(PARTIES.RZ.ballot).toBe(true);
    expect(PARTIES.RZ.belowThreshold).toBe(true);
    expect(PARTIES.RZ.thresholdNote).toMatch(/polling/);
    expect(score({}).ranked.map((r) => r.code)).toContain("RZ");
  });

  it("keeps it off the haredi religion coordinate", () => {
    // B1 was briefly coded D here on Smotrich's backing of the exemption bill.
    // It collapsed RZ onto Shas and UTJ at religion 100 and was reverted; this
    // pins the outcome so the same change cannot land again unnoticed.
    expect(ITEMS.find((i) => i.id === "B1")!.pos.RZ).toBe("N");
    expect(partyAxesFor("RZ").value.B).not.toBe(partyAxesFor("SHS").value.B);
  });
});

describe("Noam For Israel", () => {
  const item = (id: string) => ITEMS.find((i) => i.id === id)!;

  it("is a ranked ballot entity carrying its own threshold caveat", () => {
    expect(PARTIES.NOAM.ballot).toBe(true);
    expect(PARTIES.NOAM.belowThreshold).toBe(true);
    // not a polling claim — it has never contested an election on its own
    expect(PARTIES.NOAM.thresholdNote).not.toMatch(/polling/);
    expect(score({}).ranked.map((r) => r.code)).toContain("NOAM");
  });

  it("is coded complete on its own turf and silent on economics", () => {
    const coded = (b: string) =>
      ITEMS.filter((i) => i.block === b && i.pos.NOAM !== "-").length;
    expect(coded("B"), "religion-and-state").toBe(ITEMS_BY_BLOCK.B.length);
    expect(coded("D"), "national identity").toBe(ITEMS_BY_BLOCK.D.length);
    expect(coded("E"), "economics").toBe(0);
    const cov = score({}).all.NOAM.coverage;
    expect(cov).toBeGreaterThanOrEqual(COVERAGE_FLOOR);
    expect(cov).toBeLessThan(0.8);
  });

  it("recovers itself for a respondent who answers as it does", () => {
    expect(score(answerAs("NOAM")).ranked[0].code).toBe("NOAM");
  });

  /**
   * Noam is the political arm of the Har Hamor stream, whose rabbinic authority
   * forbids ascending the Temple Mount — so it parts company with the rest of
   * the religious right on A14. That cell is the flagged one; if it is wrong,
   * very little else distinguishes the column.
   */
  it("is not a copy of Otzma Yehudit or Religious Zionism", () => {
    for (const other of ["OTZ", "RZ"] as PartyCode[]) {
      const diff = ITEMS.filter(
        (it) => it.pos.NOAM !== "-" && it.pos[other] !== "-" && it.pos.NOAM !== it.pos[other],
      );
      expect(diff.length, `NOAM vs ${other}`).toBeGreaterThan(0);
      expect(diff.map((d) => d.id), `NOAM vs ${other}`).toContain("A14");
      expect(diff.map((d) => d.id), `NOAM vs ${other}`).toContain("A4");
    }
    // Both cells trace to the same reading of one rabbinic stream's quietism
    // about territorial activism. If that reading is wrong, two of the five
    // things distinguishing this column go with it.
    expect([item("A14").pos.NOAM, item("A4").pos.NOAM]).toEqual(["D", "N"]);
    expect([item("A14").pos.OTZ, item("A4").pos.OTZ]).toEqual(["A", "A"]);
  });
});

describe("D8 — state programmes against Jewish–Arab relationships", () => {
  const d8 = () => ITEMS.find((i) => i.id === "D8")!;

  it("sits on the identity axis, ethnonational-positive", () => {
    expect(d8().block).toBe("D");
    expect(d8().sign).toBe(-1);
  });

  it("asks about state policy rather than about anyone's private choices", () => {
    expect(d8().text).toMatch(/^The state should fund programmes/);
    expect(d8().text.toLowerCase()).not.toMatch(/miscegenation|forbid|ban/);
  });

  /**
   * Shas, UTJ and Noam all agree, by different routes: the haredi parties on
   * halachic grounds, which single out no ethnicity, and Noam on ethnic grounds.
   * The matrix records positions, not reasons, and cannot show the difference.
   */
  it("collects the halachic and the ethnic objection in one cell", () => {
    for (const c of ["SHS", "UTJ", "NOAM", "OTZ", "RZ"] as PartyCode[]) {
      expect(d8().pos[c], c).toBe("A");
    }
    expect(d8().pos.DEM).toBe("D");
  });
});

/**
 * A16 was justified on two grounds and only one of them survived the August
 * rewrite. The discrimination argument is gone — the corrected wording puts
 * five columns at "-", and the item now separates fewer pairs than most of
 * block A. What it is checked for here is the construct: it must ask about the
 * institutional choice rather than about who the troops are, which is the
 * §5 failure the first wording committed.
 */
describe("Gaza security-responsibility item (A16)", () => {
  const a16 = () => ITEMS.find((i) => i.id === "A16")!;

  it("sits on the security axis with agreement as the dovish side", () => {
    expect(a16().block).toBe("A");
    expect(a16().sign).toBe(-1);
  });

  /**
   * The first wording asked about "a force of Arab and Muslim states", which
   * named the troops by ethnicity and religion for a force that is neither.
   * An identity cue changes what a respondent is answering.
   */
  it("names no national, ethnic or religious group", () => {
    expect(a16().text).not.toMatch(/Arab|Muslim|Egypt|Jewish|Turk|Qatar/i);
  });

  it("asks about policing, not governance, so it is not a second A6", () => {
    const a6 = ITEMS.find((i) => i.id === "A6")!;
    const identical = MATRIX_ORDER.every((c) => a6.pos[c] === a16().pos[c]);
    expect(identical, "A16 duplicates A6").toBe(false);
    expect(a16().text).toMatch(/security|police/i);
  });

  it("takes no position for the columns that have not addressed the structure", () => {
    for (const c of ["TOG", "YSH", "UNI", "NOAM", "HPP", "AMY"] as PartyCode[]) {
      expect(a16().pos[c], c).toBe("-");
    }
    // and does still separate the parties that have
    expect(a16().pos.LIK).toBe("D");
    expect(a16().pos.DEM).toBe("A");
  });
});

/**
 * Coverage answers "how completely is this party coded", which is a fact about
 * the bank. Overlap answers "how much of what this respondent said was actually
 * compared", which is a fact about the result on screen. The audit that
 * prompted this pointed out that a party can pass the coverage floor and still
 * be matched on almost nothing, and the two were indistinguishable.
 */
describe("effective overlap (§4.2)", () => {
  it("reports the size of the comparison, not just the size of the column", () => {
    const full = score(answerAs("LIK"));
    expect(full.all.LIK.overlap).toBe(1);

    // answer three items only, all of them ones Likud is coded on
    const sparse: Answers = { A1: -2, A2: 2, A3: 2 };
    const r = score(sparse);
    expect(r.all.LIK.coverage).toBe(1);        // the column is still fully coded
    expect(r.all.LIK.scoredItems).toBe(3);     // but the comparison is three items
    expect(r.all.LIK.overlap).toBe(1);
    expect(Math.round(r.all.LIK.weighted)).toBeGreaterThan(0);
  });

  it("falls when the respondent answers items the party has no position on", () => {
    // A16 is "-" for Together; A9 and A10 are "-" for Yashar
    const answers: Answers = { A16: 2, A9: 2, A10: 2, A1: 2 };
    const r = score(answers);
    expect(r.answeredCount).toBe(4);
    expect(r.all.YSH.scoredItems).toBe(1);     // only A1 is both answered and coded
    expect(r.all.YSH.overlap).toBeCloseTo(0.25);
    expect(r.all.LIK.overlap).toBe(1);         // Likud is coded on all four
  });

  it("is zero rather than NaN when nothing is answered", () => {
    const r = score({});
    for (const row of r.ranked) expect(row.overlap, row.code).toBe(0);
  });
});

describe("chametz item (B12)", () => {
  const b12 = () => ITEMS.find((i) => i.id === "B12")!;

  it("sits in religion-and-state on the secular side of agreement", () => {
    expect(b12().block).toBe("B");
    expect(b12().sign).toBe(-1);
  });

  it("splits Likud from the parties it governs with on enforcement", () => {
    expect(b12().pos.LIK).toBe("D");
    expect(b12().pos.YB).toBe("A");
    expect(b12().pos.DEM).toBe("A");
  });

  it("is not a restatement of the Shabbat items", () => {
    for (const other of ["B2", "B8"]) {
      const o = ITEMS.find((i) => i.id === other)!;
      const identical = MATRIX_ORDER.every((c) => o.pos[c] === b12().pos[c]);
      expect(identical, `B12 duplicates ${other}`).toBe(false);
    }
  });
});

describe("item agreement (§4.1)", () => {
  it("scores direction only, discarding intensity", () => {
    expect(agreementPoints(2, "A")).toBe(2);
    expect(agreementPoints(1, "A")).toBe(2);
    expect(agreementPoints(0, "A")).toBe(1);
    expect(agreementPoints(-1, "A")).toBe(0);
    expect(agreementPoints(-2, "A")).toBe(0);
    expect(agreementPoints(0, "N")).toBe(2);
    expect(agreementPoints(2, "N")).toBe(1);
    expect(agreementPoints(-2, "D")).toBe(2);
  });
});

describe("party match (§4.2)", () => {
  it("returns 100% for a user who answers exactly as a party does", () => {
    // every party the engine scores — withdrawn columns are deliberately absent
    for (const code of [...BALLOT_PARTIES, ...COMPONENT_PARTIES]) {
      const r = score(answerAs(code)).all[code];
      expect(Math.round(r.weighted), code).toBe(100);
      expect(Math.round(r.unweighted), code).toBe(100);
    }
  });

  it("recovers the party as the top ranked match for every ballot entity above the coverage floor", () => {
    const ranked = score({}).ranked.map((r) => r.code);
    for (const code of ranked) {
      const top = score(answerAs(code)).ranked[0];
      expect(top.code, `${code} did not recover itself`).toBe(code);
    }
  });

  it("excludes no-opinion answers and uncoded cells from the denominator", () => {
    const a = answerAs("LIK");
    a.A1 = null;
    const r = score(a).all.LIK;
    expect(Math.round(r.weighted)).toBe(100);
    expect(r.scoredItems).toBe(49);
  });

  it("reproduces the unweighted result when every topic keeps its default allocation", () => {
    const a = answerAs("DEM");
    a.B1 = 0;
    a.E3 = 1;
    const r = score(a, DEFAULT_WEIGHTS).all.DEM;
    expect(r.weighted).toBeCloseTo(r.unweighted, 10);
  });

  it("is invariant to the total number of points allocated", () => {
    const a = answerAs("SHS");
    a.A1 = 1;
    a.C5 = 2;
    const small: Weights = { A: 10, B: 20, C: 5, D: 5, E: 10 };
    const doubled: Weights = { A: 20, B: 40, C: 10, D: 10, E: 20 };
    expect(score(a, small).all.SHS.weighted).toBeCloseTo(score(a, doubled).all.SHS.weighted, 10);
  });

  it("suppresses the thin columns for low coverage and keeps the Joint List in", () => {
    const r = score(answerAs("LIK"));
    expect(r.lowCoverage.map((x) => x.code).sort()).toEqual(["AMY", "HPP"]);
    expect(r.ranked.map((x) => x.code)).toContain("JL");
    expect(r.all.JL.coverage).toBeGreaterThanOrEqual(0.95);
  });

  /**
   * §8 says drop any party that misses the ballot. Suppression is not enough:
   * a low-coverage party is still shown, under "insufficient position data",
   * and a withdrawn one must not appear at all. The distinction matters because
   * the two states look similar in the registry and are opposite for a voter —
   * one is a party we know too little about, the other is not a choice.
   */
  it("removes a withdrawn party from the result entirely, not merely from the ranking", () => {
    expect(WITHDRAWN_PARTIES).toContain("UNI");
    expect(PARTIES.UNI.withdrawn).toBe(true);

    const r = score(answerAs("LIK"));
    expect(r.ranked.map((x) => x.code)).not.toContain("UNI");
    expect(r.lowCoverage.map((x) => x.code)).not.toContain("UNI");
    expect(r.components.map((x) => x.code)).not.toContain("UNI");
    expect(r.all.UNI, "a withdrawn party must not be scored at all").toBeUndefined();

    // and it is out of the sets every screen and diagnostic iterates
    expect(BALLOT_PARTIES).not.toContain("UNI");
    expect(COMPONENT_PARTIES).not.toContain("UNI");
  });

  it("keeps the withdrawn column in the registry and the coding matrix", () => {
    // deleting it would erase the record; the matrix is where cut things stay
    expect(PARTIES.UNI).toBeDefined();
    expect(ITEMS.filter((i) => i.pos.UNI !== "-").length).toBeGreaterThan(0);
  });

  /**
   * The Haredi Public Party exists in the bank for one reason: it is the first
   * haredi column on the pro-conscription side, and B1 and B3 are where that
   * shows. If either cell ever matches Shas and UTJ the column has stopped
   * earning its place, and this test should be the thing that says so.
   */
  it("puts the Haredi Public Party opposite Shas and UTJ on the draft and the curriculum", () => {
    for (const id of ["B1", "B3"]) {
      const it_ = ITEMS.find((x) => x.id === id)!;
      expect(it_.pos.HPP, id).toBe("A");
      expect(it_.pos.SHS, id).toBe("D");
      expect(it_.pos.UTJ, id).toBe("D");
    }
    // and the money version of the same split
    const e2 = ITEMS.find((x) => x.id === "E2")!;
    expect(e2.pos.HPP).toBe("D");
    expect(e2.pos.SHS).toBe("A");
    expect(e2.pos.UTJ).toBe("A");
  });

  it("suppresses the Haredi Public Party, which is coded on three stated planks", () => {
    const r = score(answerAs("LIK"));
    expect(r.lowCoverage.map((x) => x.code)).toContain("HPP");
    expect(r.ranked.map((x) => x.code)).not.toContain("HPP");
    expect(r.all.HPP.coverage).toBeLessThan(COVERAGE_FLOOR);
    // religion-and-state is complete; everything else is deliberately unstated
    expect(ITEMS.filter((x) => x.block === "B" && x.pos.HPP !== "-")).toHaveLength(14);
    expect(ITEMS.filter((x) => x.block !== "B" && x.pos.HPP !== "-").map((x) => x.id)).toEqual(["E2"]);
  });

  /**
   * The inference flags exist to make "a third of those inferred" checkable
   * rather than asserted. A flag pointing at a cell the party has no coding for
   * is worse than no flag: it claims a judgement was made where none was.
   */
  it("flags only cells the party is actually coded on", () => {
    for (const [code, ids] of Object.entries(INFERRED)) {
      for (const id of ids) {
        const item = ITEMS.find((x) => x.id === id);
        expect(item, `${code} flags ${id}, which is not a live item`).toBeDefined();
        expect(item!.pos[code as PartyCode], `${code} flags ${id} but codes it "-"`).not.toBe("-");
      }
    }
  });

  it("never claims a matrix column is inferred", () => {
    // The thirteen matrix columns come from published platforms. Only the thin
    // overlay columns carry inference, and saying so is the flag's whole value.
    for (const code of Object.keys(INFERRED) as PartyCode[]) {
      expect(MATRIX_ORDER, code).not.toContain(code);
    }
  });

  /**
   * A drafted item must not leak into the live bank. If it ever did, every
   * party's coverage would shift and every saved session would be answering a
   * different questionnaire from the one it started.
   */
  it("keeps drafted items out of the live bank entirely", () => {
    const live = new Set(ITEMS.map((i) => i.id));
    for (const p of PENDING) {
      expect(live.has(p.item.id), `${p.item.id} has gone live without a bank revision`).toBe(false);
      // ready to drop in: coded on every column, no gaps to discover later
      for (const code of Object.keys(PARTIES) as PartyCode[]) {
        expect(p.item.pos[code], `${p.item.id}/${code}`).toBeDefined();
      }
    }
  });

  /**
   * B15's documented claim is that it is B1's row with exactly one cell
   * changed. That is the argument both for it — it isolates enforcement from
   * enlistment — and against it, since the whole item rests on one column.
   * If the codings drift, the note stops being true and this should say so.
   */
  it("pins B15 as B1 separated by one stated position and one silence", () => {
    const b15 = PENDING.find((p) => p.item.id === "B15")!.item;
    const b1 = ITEMS.find((i) => i.id === "B1")!;
    const differing = (Object.keys(PARTIES) as PartyCode[]).filter(
      (c) => b15.pos[c] !== b1.pos[c],
    );
    expect(differing.sort()).toEqual(["AMY", "HPP"]);

    // HPP is the whole point: it wants haredim serving and opposes compelling them.
    expect(b1.pos.HPP).toBe("A");
    expect(b15.pos.HPP).toBe("D");

    // People of Israel differs only by silence — it wants them drafted and has
    // said nothing about enforcement. That is not a second party separated.
    expect(b1.pos.AMY).toBe("A");
    expect(b15.pos.AMY).toBe("-");
  });

  it("suppresses People of Israel, the thinnest column in the bank", () => {
    const r = score(answerAs("LIK"));
    expect(r.lowCoverage.map((x) => x.code)).toContain("AMY");
    expect(r.ranked.map((x) => x.code)).not.toContain("AMY");
    expect(r.all.AMY.coverage).toBeLessThan(COVERAGE_FLOOR);
    // nine cells, and block C deliberately empty — a direction is not a mechanism
    expect(ITEMS.filter((x) => x.pos.AMY !== "-")).toHaveLength(9);
    expect(ITEMS.filter((x) => x.block === "C" && x.pos.AMY !== "-")).toHaveLength(0);
  });

  /**
   * D2 is the one cell in this column sourced twice over, and the pairing it
   * captures — Arab citizens in, Arab parties out — is the party's most
   * distinctive position. If it ever drifts, the column stops saying anything
   * the bank could not have guessed.
   */
  it("records People of Israel rejecting Arab parties while running an Arab candidate", () => {
    const d2 = ITEMS.find((x) => x.id === "D2")!;
    expect(d2.pos.AMY).toBe("D");
    const d7 = ITEMS.find((x) => x.id === "D7")!;
    expect(d7.pos.AMY).toBe("A");
  });

  it("keeps Joint List components out of the ballot ranking", () => {
    const r = score(answerAs("HTA"));
    expect(r.ranked.map((x) => x.code)).not.toContain("HTA");
    expect(r.ranked.map((x) => x.code)).not.toContain("BAL");
    expect(r.components.map((x) => x.code).sort()).toEqual(["BAL", "HTA"]);
  });
});

describe("axis position (§4.3)", () => {
  it("puts a user who agrees with everything hawkish at the hawk pole", () => {
    const a: Answers = {};
    for (const it of ITEMS_BY_BLOCK.A) a[it.id] = (it.sign === 1 ? 2 : -2) as 2 | -2;
    expect(userAxes(a).value.A).toBe(100);
  });

  it("ignores topic weights entirely", () => {
    const a = answerAs("RZ");
    const lopsided: Weights = { A: 60, B: 0, C: 20, D: 10, E: 10 };
    expect(score(a, lopsided).user.value).toEqual(score(a, DEFAULT_WEIGHTS).user.value);
  });

  it("reports thin axis coverage so a marker can be drawn as low-confidence", () => {
    // Ra'am is coded on only 3 of the 10 religion-and-state items (§7).
    expect(partyAxesFor("RAM").confidence.B).toBeLessThan(0.5);
    expect(partyAxesFor("LIK").confidence.B).toBe(1);
  });
});

describe("expected clustering smoke test (§4.6)", () => {
  const ax = (c: PartyCode) => partyAxesFor(c).value;

  it("places Otzma Yehudit and Religious Zionism in the top-right", () => {
    for (const c of ["OTZ", "RZ"] as PartyCode[]) {
      expect(ax(c).A, `${c} X`).toBeGreaterThan(40);
      expect(ax(c).B, `${c} Y`).toBeGreaterThan(40);
    }
  });

  it("places the haredi parties high on religion", () => {
    for (const c of ["SHS", "UTJ"] as PartyCode[]) expect(ax(c).B, c).toBeGreaterThan(60);
  });

  it("places Likud in the upper right, less religious than the haredi parties", () => {
    expect(ax("LIK").A).toBeGreaterThan(30);
    expect(ax("LIK").B).toBeGreaterThan(0);
    expect(ax("LIK").B).toBeLessThan(ax("SHS").B);
  });

  it("places Yisrael Beiteinu lower-right — hawkish and aggressively secular", () => {
    expect(ax("YB").A).toBeGreaterThan(20);
    expect(ax("YB").B).toBeLessThan(-50);
  });

  it("places Together lower-centre-right and Yashar nearer the origin", () => {
    expect(ax("TOG").B).toBeLessThan(-30);
    expect(Math.abs(ax("YSH").A)).toBeLessThan(Math.abs(ax("TOG").A) + 40);
    expect(Math.abs(ax("YSH").B)).toBeLessThan(Math.abs(ax("YB").B));
  });

  it("places The Democrats lower-left and the Joint List further left still", () => {
    expect(ax("DEM").A).toBeLessThan(-50);
    expect(ax("DEM").B).toBeLessThan(0);
    expect(ax("JL").A).toBeLessThan(ax("DEM").A);
    expect(ax("JL").B).toBeLessThan(ax("SHS").B);
  });

  it("places Ra'am on the dovish side, above the secular half", () => {
    expect(ax("RAM").A).toBeLessThan(-50);
    expect(ax("RAM").B).toBeGreaterThan(0);
  });

  /**
   * The first run of this check found DEM, RAM and JL identical on both grid axes,
   * because the bank had no item separating a Zionist dove from a non-Zionist one.
   * A13 and D7 were added for exactly this. Neither grid axis may pile up again.
   */
  it("leaves no three-way pile-up on either grid axis", () => {
    const piles = axisCollapses().filter((c) => c.parties.length > 2);
    expect(piles.filter((c) => c.block === "A" || c.block === "B")).toEqual([]);
  });

  it("fully separates The Democrats, Ra'am and the Joint List on identity", () => {
    const coords = (["DEM", "RAM", "JL"] as PartyCode[]).map((c) => ax(c).D);
    expect(new Set(coords).size).toBe(3);
  });

  /**
   * On security the added item lifts the Joint List clear of the other two but
   * leaves The Democrats and Ra'am together: they hold genuinely identical
   * operative positions on all thirteen items. That pair does not collide on
   * the grid, because they are 167 points apart on the vertical axis.
   */
  it("lifts the Joint List clear of The Democrats and Ra'am on security", () => {
    expect(ax("JL").A).toBeLessThan(ax("DEM").A);
    expect(ax("DEM").A).toBe(ax("RAM").A);
    expect(Math.abs(ax("DEM").B - ax("RAM").B)).toBeGreaterThan(100);
  });

  /**
   * Institutions is where three-way coincidence survives, and it looks real
   * rather than artefactual: those parties hold identical positions on judicial
   * review, the Attorney General, the 7 October commission and police
   * independence. Both are reported bars, not grid axes, so the cost is lower.
   */
  it("pins the remaining three-way pile-ups to the institutions bar", () => {
    const piles = axisCollapses().filter((c) => c.parties.length > 2);
    expect(piles.map((c) => `${c.block}:${[...c.parties].sort().join(",")}`).sort()).toEqual([
      "C:DEM,JL,RAM",
      "C:LIK,NOAM,OTZ,RZ",
    ]);
  });

  it("separates the two grid axes — no party sits at the exact origin", () => {
    for (const c of Object.keys(PARTIES) as PartyCode[]) {
      const v = ax(c);
      expect(Math.abs(v.A) + Math.abs(v.B), c).toBeGreaterThan(0);
    }
  });
});

describe("bloc readout (§4.5)", () => {
  it("gives a Likud-identical answer set a higher pro-bloc than anti-bloc affinity", () => {
    const b = score(answerAs("LIK")).blocs;
    expect(b.pro).toBeGreaterThan(b.anti);
    expect(b.pro).toBeGreaterThan(b.non);
  });

  it("gives a Joint List answer set the highest non-aligned affinity", () => {
    const b = score(answerAs("JL")).blocs;
    expect(b.non).toBeGreaterThan(b.anti);
    expect(b.non).toBeGreaterThan(b.pro);
  });

  it("leaves the unaligned Unity list out of every bloc average", () => {
    const r = score(answerAs("UNI"));
    expect(r.ranked.some((x) => x.code === "UNI")).toBe(false);
  });
});

describe("results helpers (§4.8)", () => {
  it("finds no flat opposition against a party the user answered identically", () => {
    expect(flatOpposition("SHS", answerAs("SHS"))).toHaveLength(0);
  });

  it("finds flat opposition where the user is on the other side", () => {
    const a = answerAs("SHS");
    a.B7 = -2; // Shas agrees that halakha takes precedence
    const ids = flatOpposition("SHS", a).map((i) => i.id);
    expect(ids).toEqual(["B7"]);
  });

  it("treats a neutral user answer against a coded party position as partial, not opposed", () => {
    const a = answerAs("SHS");
    a.B7 = 0;
    expect(flatOpposition("SHS", a)).toHaveLength(0);
  });
});

describe("empty and degenerate inputs", () => {
  it("does not divide by zero when nothing is answered", () => {
    const r = score({});
    expect(r.ranked.every((x) => Number.isFinite(x.weighted))).toBe(true);
    expect(BLOCK_IDS.every((b) => r.user.value[b] === 0)).toBe(true);
    expect(r.answeredCount).toBe(0);
  });

  it("survives every item being skipped", () => {
    const a: Answers = {};
    for (const it of ITEMS) a[it.id] = null;
    const r = score(a);
    expect(r.skippedCount).toBe(50);
    expect(r.ranked.every((x) => x.weighted === 0)).toBe(true);
  });

  it("survives a zero allocation on every topic", () => {
    const zero: Weights = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    const r = score(answerAs("YB"), zero);
    expect(Number.isFinite(r.all.YB.weighted)).toBe(true);
  });
});

describe("Joint List merge rule (§3.7)", () => {
  const merged = (id: string) => ITEMS.find((i) => i.id === id)!.pos.JL;
  const hta = (id: string) => ITEMS.find((i) => i.id === id)!.pos.HTA;
  const bal = (id: string) => ITEMS.find((i) => i.id === id)!.pos.BAL;

  it("never invents a consensus: divergence resolves to the less committal value", () => {
    for (const it of ITEMS) {
      const h = hta(it.id) as Position;
      const b = bal(it.id) as Position;
      const m = merged(it.id) as Position;
      if (h === "-" && b === "-") {
        expect(m, it.id).toBe("-");
      } else if (h === "-" || b === "-") {
        expect(m, it.id).toBe(h === "-" ? b : h);
      } else if (h === b) {
        expect(m, it.id).toBe(h);
      } else {
        expect(m, `${it.id} invented a consensus`).toBe("N");
      }
    }
  });

  /**
   * The spec reports that the components are identical on security, institutions
   * and national identity, and that every merge compromise therefore falls in
   * religion-and-state or economics. A13 breaks that: it is the first security
   * item to divide them, which means the unity was partly an artefact of what the
   * bank had not asked. Pinned exactly so any further drift is visible.
   */
  it("pins where the merge compromises fall", () => {
    const compromised = ITEMS.filter((it) => {
      const h = hta(it.id);
      const b = bal(it.id);
      return h !== b && !(h === "-" && b === "-");
    });
    expect(compromised.map((i) => i.id).sort()).toEqual(
      ["A13", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9", "B10", "B11", "B12", "B13", "B14",
       "E3", "E8"].sort(),
    );
    expect([...new Set(compromised.map((i) => i.block))].sort()).toEqual(["A", "B", "E"]);
  });

  it("flags every compromised cell in the published matrix", () => {
    for (const it of ITEMS) {
      const h = hta(it.id);
      const b = bal(it.id);
      const compromised = h !== b && !(h === "-" && b === "-");
      expect(!!JL_MERGE_FLAGS[it.id], `${it.id} flag`).toBe(compromised);
    }
  });
});

describe("item validation metrics (§4.7)", () => {
  it("credits the added items with the axis collapses they prevent", () => {
    const byId = Object.fromEntries(itemDiagnostics().map((d) => [d.id, d]));
    expect(byId.A13.collapsesPrevented).toBeGreaterThan(0);
    expect(byId.D7.collapsesPrevented).toBeGreaterThan(0);
  });

  it("shows that raw discrimination alone would have cut the item that fixed the axis", () => {
    const items = itemDiagnostics();
    const weakest = [...items].sort((a, b) => a.discrimination - b.discrimination)[0];
    expect(weakest.id).toBe("A13");
    expect(weakest.collapsesPrevented).toBeGreaterThan(0);
  });

  it("finds no two ballot parties with identical coding vectors", () => {
    expect(identicalColumns()).toEqual([]);
  });
});
