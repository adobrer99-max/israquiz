import { describe, expect, it } from "vitest";
import {
  flaggedCells, parseReplies, renderMarkdown, validationReport, type Reply,
} from "./validation";
import { DEFAULT_WEIGHTS, score, type Answers } from "./scoring";
import { ITEMS } from "../data/items";
import { PARTIES, type PartyCode } from "../data/parties";

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

/** A reply shaped exactly as the results page exports one. */
function reply(
  tester: string,
  declared: string,
  answers: Answers = {},
  version = "v0.2 — preview",
): Reply {
  const r = score(answers, DEFAULT_WEIGHTS);
  const ranking = [...r.ranked]
    .sort((a, b) => b.weighted - a.weighted)
    .map((x) => ({
      code: x.code,
      weighted: +x.weighted.toFixed(1),
      unweighted: +x.unweighted.toFixed(1),
      coverage: +x.coverage.toFixed(2),
    }));
  return {
    version,
    responses: {
      responseId: `id-${tester}-${declared}`,
      tester,
      declared,
      declaredRank: ranking.findIndex((x) => x.code === declared) + 1 || null,
      answers,
      weights: { ...DEFAULT_WEIGHTS },
      ranking,
    },
  };
}

describe("parsing replies", () => {
  it("rejects a non-validation export rather than counting it", () => {
    const ordinary = reply("AB", "LIK", answerAs("LIK"));
    delete (ordinary.responses as { declared?: string }).declared;
    const { replies, rejected } = parseReplies([{ source: "a.json", value: ordinary }]);
    expect(replies).toHaveLength(0);
    expect(rejected[0].reason).toContain("?validate=1");
  });

  it("rejects junk with a reason instead of dropping it silently", () => {
    const { replies, rejected } = parseReplies([
      { source: "broken.json", value: null },
      { source: "notours.json", value: { hello: "world" } },
    ]);
    expect(replies).toHaveLength(0);
    expect(rejected).toHaveLength(2);
    expect(rejected.every((r) => r.reason.length > 0)).toBe(true);
  });

  it("counts the same reply once when it arrives twice", () => {
    const r = reply("AB", "LIK", answerAs("LIK"));
    const { replies, rejected } = parseReplies([
      { source: "a.json", value: r },
      { source: "a-again.json", value: r },
    ]);
    expect(replies).toHaveLength(1);
    expect(rejected[0].reason).toContain("duplicate");
  });
});

describe("recovery", () => {
  it("recovers a tester who answers exactly as their party does", () => {
    const r = validationReport([reply("AB", "LIK", answerAs("LIK"))]);
    expect(r.eligible).toBe(1);
    expect(r.recovered).toBe(1);
    expect(r.recoveryRate).toBe(1);
    expect(r.medianRank).toBe(1);
    expect(r.medianMargin).toBe(0);
  });

  it("computes the rate over eligible testers only", () => {
    const r = validationReport([
      reply("A", "LIK", answerAs("LIK")),
      reply("B", "SHS", answerAs("SHS")),
      reply("C", "DEM", answerAs("LIK")), // declared one party, answered as another
    ]);
    expect(r.eligible).toBe(3);
    expect(r.recovered).toBe(2);
    expect(r.recoveryRate).toBeCloseTo(2 / 3);
  });

  /**
   * The distinction the whole report hangs on: a party the coverage floor
   * suppressed was never in the ranking to be found, so counting it as a miss
   * would report the floor working as the instrument failing.
   */
  it("separates a suppressed party from a miss", () => {
    const r = validationReport([
      reply("A", "LIK", answerAs("LIK")),
      reply("B", "HPP", answerAs("HPP")),
    ]);
    expect(r.suppressed.map((s) => s.tester)).toEqual(["B"]);
    expect(r.eligible).toBe(1);
    expect(r.recoveryRate).toBe(1);
  });

  it("counts undecided testers without letting them touch the rate", () => {
    const r = validationReport([
      reply("A", "LIK", answerAs("LIK")),
      reply("B", "UNDECIDED", answerAs("DEM")),
      reply("C", "NOVOTE", answerAs("DEM")),
    ]);
    expect(r.n).toBe(3);
    expect(r.nonParty).toHaveLength(2);
    expect(r.eligible).toBe(1);
    expect(r.recoveryRate).toBe(1);
  });
});

describe("miscoding candidates", () => {
  /**
   * The report's reason for existing. A cell several testers of one party
   * disagree with is the only evidence this project can generate that a coding
   * is wrong, so it has to sort above a cell one tester disagreed with.
   */
  it("ranks a cell three testers hit above one that only one hit", () => {
    const flip = (code: PartyCode, id: string): Answers => {
      const a = answerAs(code);
      const item = ITEMS.find((i) => i.id === id)!;
      a[id] = item.pos[code] === "A" ? -2 : 2;
      return a;
    };
    const r = validationReport([
      reply("A", "LIK", flip("LIK", "A1")),
      reply("B", "LIK", flip("LIK", "A1")),
      reply("C", "LIK", flip("LIK", "A1")),
      reply("D", "SHS", flip("SHS", "B5")),
    ]);
    expect(r.candidates[0].itemId).toBe("A1");
    expect(r.candidates[0].party).toBe("LIK");
    expect(r.candidates[0].count).toBe(3);
    expect(r.candidates[0].testers).toEqual(["A", "B", "C"]);
    expect(r.candidates.find((c) => c.itemId === "B5")!.count).toBe(1);
  });

  it("collects candidates for suppressed parties too, where thin columns hide errors", () => {
    const a = answerAs("HPP");
    a.B1 = -2; // HPP is coded A on B1
    const r = validationReport([reply("A", "HPP", a)]);
    expect(r.candidates.some((c) => c.party === "HPP" && c.itemId === "B1")).toBe(true);
  });

  it("marks cells the editorial notes already flag", () => {
    const flagged = flaggedCells();
    // Noam's A14 is the note that says "verify against the filed list before launch"
    expect(flagged.has("NOAM:A14")).toBe(true);
    expect(flagged.has("RAM:D7")).toBe(true);

    const a = answerAs("NOAM");
    a.A14 = a.A14 === 2 ? -2 : 2;
    const r = validationReport([reply("A", "NOAM", a)]);
    expect(r.candidates.find((c) => c.itemId === "A14")!.flagged).toBe(true);
  });

  it("does not flag a cell no note mentions", () => {
    expect(flaggedCells().has("LIK:E6")).toBe(false);
  });
});

describe("integrity warnings", () => {
  it("warns when replies span instrument versions", () => {
    const r = validationReport([
      reply("A", "LIK", answerAs("LIK"), "v0.2 — preview"),
      reply("B", "SHS", answerAs("SHS"), "v0.1 — preview"),
    ]);
    expect(r.warnings.join(" ")).toContain("instrument versions");
  });

  it("warns when a reply's own ranking disagrees with the current bank", () => {
    const stale = reply("A", "LIK", answerAs("LIK"));
    stale.responses.ranking = [
      { code: "SHS", weighted: 99, unweighted: 99, coverage: 1 },
      ...stale.responses.ranking,
    ];
    const r = validationReport([stale]);
    expect(r.warnings.join(" ")).toContain("different item bank");
  });

  it("warns rather than throwing on a party code the bank does not have", () => {
    const r = validationReport([reply("A", "GONE", answerAs("LIK"))]);
    expect(r.warnings.join(" ")).toContain("not a party in this bank");
    expect(r.eligible).toBe(0);
  });
});

describe("panel gaps", () => {
  it("lists ballot parties nobody declared, high-risk columns first", () => {
    const r = validationReport([reply("A", "LIK", answerAs("LIK"))]);
    const names = r.gaps.map((g) => g.name);
    expect(names).not.toContain("Likud");
    expect(names).toContain("Together");
    expect(r.gaps.findIndex((g) => g.name === "Together")).toBeLessThan(
      r.gaps.findIndex((g) => !g.severe),
    );
    // components are not on the ballot, so they cannot be declared or missing
    expect(names).not.toContain(PARTIES.HTA.name);
  });
});

describe("rendering", () => {
  it("produces markdown that leads with the non-publication warning", () => {
    const md = renderMarkdown(validationReport([reply("AB", "LIK", answerAs("LIK"))]));
    expect(md).toContain("# Validation round");
    expect(md).toContain("Not for publication");
    expect(md).toContain("§6.5.1");
  });

  it("says something useful when no tester opposed their own party", () => {
    const md = renderMarkdown(validationReport([reply("AB", "LIK", answerAs("LIK"))]));
    expect(md).toContain("too small or too agreeable");
  });

  it("lists rejected replies so a lost tester is visible", () => {
    const md = renderMarkdown(validationReport([]), [{ source: "x.json", value: "" } as never]);
    expect(md).toContain("Replies not counted");
  });
});
