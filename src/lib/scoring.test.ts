import { describe, expect, it } from "vitest";
import {
  agreementPoints, COVERAGE_FLOOR, DEFAULT_WEIGHTS, diagnosticSides, flatOpposition,
  partyAxesFor, score, spansBlocs, unlikelyBedfellows, userAxes, type Answers, type Weights,
} from "./scoring";
import {
  A5_ROWS, BLOCK_IDS, CROSS_CUTTING, F1, F2, G1, G2, G3, ITEMS, ITEMS_BY_BLOCK, JL_MERGE_FLAGS, RETIRED,
  type Position,
} from "../data/items";
import { axisCollapses, identicalColumns, itemDiagnostics } from "./diagnostics";
import { orderedBlocks, orderedItems } from "./shuffle";
import { MATRIX_ORDER, PARTIES, type PartyCode } from "../data/parties";

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
  it("holds 47 scored items across five blocks", () => {
    expect(ITEMS).toHaveLength(47);
    expect(BLOCK_IDS.map((b) => ITEMS_BY_BLOCK[b].length)).toEqual([13, 14, 6, 6, 8]);
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
    for (const code of Object.keys(PARTIES) as PartyCode[]) {
      expect(after.all[code].weighted, code).toBe(before.all[code].weighted);
      expect(after.all[code].scoredItems, code).toBe(before.all[code].scoredItems);
    }
    expect(after.user.value).toEqual(before.user.value);
    expect(after.answeredCount).toBe(before.answeredCount);
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
    const canon = (it: { pos: Record<string, string> }) => {
      const raw = MATRIX_ORDER.map((c) => it.pos[c]).join("");
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
    for (const code of Object.keys(PARTIES) as PartyCode[]) {
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
    expect(r.scoredItems).toBe(46);
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

  it("suppresses the Erdan–Edelstein list for low coverage and keeps the Joint List in", () => {
    const r = score(answerAs("LIK"));
    expect(r.lowCoverage.map((x) => x.code)).toContain("ERD");
    expect(r.ranked.map((x) => x.code)).toContain("JL");
    expect(r.all.ERD.coverage).toBeLessThan(COVERAGE_FLOOR);
    expect(r.all.JL.coverage).toBeGreaterThanOrEqual(0.95);
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
      "C:LIK,OTZ,RZ",
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

  it("leaves the unaligned Erdan–Edelstein list out of every bloc average", () => {
    const r = score(answerAs("ERD"));
    expect(r.ranked.some((x) => x.code === "ERD")).toBe(false);
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
    expect(r.skippedCount).toBe(47);
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
