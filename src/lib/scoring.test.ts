import { describe, expect, it } from "vitest";
import {
  agreementPoints, COVERAGE_FLOOR, DEFAULT_WEIGHTS, flatOpposition,
  partyAxesFor, score, userAxes, type Answers, type Weights,
} from "./scoring";
import { A5_ROWS, BLOCK_IDS, ITEMS, ITEMS_BY_BLOCK, type Position } from "../data/items";
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
  it("holds 46 scored items across five blocks", () => {
    expect(ITEMS).toHaveLength(46);
    expect(BLOCK_IDS.map((b) => ITEMS_BY_BLOCK[b].length)).toEqual([12, 10, 10, 6, 8]);
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
    expect(r.scoredItems).toBe(45);
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

  it("places The Democrats lower-left and the Joint List no further right", () => {
    expect(ax("DEM").A).toBeLessThan(-50);
    expect(ax("DEM").B).toBeLessThan(0);
    expect(ax("JL").A).toBeLessThanOrEqual(ax("DEM").A);
    expect(ax("JL").B).toBeLessThan(ax("SHS").B);
  });

  it("places Ra'am on the dovish side, above the secular half", () => {
    expect(ax("RAM").A).toBeLessThan(-50);
    expect(ax("RAM").B).toBeGreaterThan(0);
  });

  /**
   * §4.6 expects the Joint List "far left" and The Democrats merely "lower-left",
   * i.e. separated on X. They are not: the security block codes DEM, JL, HTA, BAL
   * and Ra'am identically on all twelve items, so all five sit exactly on the dove
   * pole and the axis carries no information about the difference between them.
   *
   * This is the §4.6 failure mode — an item set that cannot discriminate — and the
   * spec's instruction is to fix it by adding items, not by nudging coordinates.
   * The test pins the current behaviour so the fix is visible when it lands.
   */
  it("documents the dove-pole pile-up the security block cannot resolve", () => {
    const piled = (["DEM", "JL", "HTA", "BAL", "RAM"] as PartyCode[]).filter(
      (c) => ax(c).A === -100,
    );
    expect(piled).toEqual(["DEM", "JL", "HTA", "BAL", "RAM"]);
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
    expect(r.skippedCount).toBe(46);
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

  it("confines every merge compromise to religion-and-state and economics", () => {
    for (const it of ITEMS) {
      const h = hta(it.id);
      const b = bal(it.id);
      const compromised = h !== b && !(h === "-" && b === "-");
      if (compromised) expect(["B", "E"], it.id).toContain(it.block);
    }
  });
});
