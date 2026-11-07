import { describe, expect, it } from "vitest";
import { ELECTION } from "../data/editorial";
import { ITEMS } from "../data/items";
import { buildCoalition, coalitionParam, parseCoalitionParam, PRESETS, SEAT_PARTIES, seatsOf } from "./coalition";

describe("coalition builder", () => {
  it("covers every party that won seats, and they add up to the Knesset", () => {
    expect(SEAT_PARTIES).toHaveLength(11);
    expect(SEAT_PARTIES.reduce((n, c) => n + seatsOf(c), 0)).toBe(ELECTION.seats);
    expect(SEAT_PARTIES[0]).toBe("LIK");
  });

  it("matches the seat totals reported for each set of recommendations", () => {
    const seats = Object.fromEntries(PRESETS.map((p) => [p.key, buildCoalition(p.parties).seats]));
    expect(seats).toEqual({ eisenkot: 67, netanyahu: 46, bloc: 53 });
    expect(buildCoalition(PRESETS[0].parties).majority).toBe(true);
    expect(buildCoalition(PRESETS[2].parties).majority).toBe(false);
  });

  it("classifies every item, and a split always has a member on each side", () => {
    const c = buildCoalition(PRESETS[0].parties);
    expect(c.stances).toHaveLength(ITEMS.length);
    for (const s of c.splits) {
      expect(s.forParties.length).toBeGreaterThan(0);
      expect(s.againstParties.length).toBeGreaterThan(0);
    }
    // most even split first
    const evenness = c.splits.map((s) => Math.min(s.forSeats, s.againstSeats));
    expect([...evenness].sort((a, b) => b - a)).toEqual(evenness);
  });

  it("flags members coded against Arab coalition partners only when an Arab party is in", () => {
    const eisenkot = buildCoalition(PRESETS[0].parties);
    expect(eisenkot.redLines.map((r) => r.party).sort()).toEqual(["TOG", "YB", "YSH"]);
    expect(buildCoalition(["LIK", "YSH", "TOG"]).redLines).toEqual([]);
    // the Democrats are coded A on D2, so they raise no flag
    expect(buildCoalition(["DEM", "RAM"]).redLines).toEqual([]);
  });

  it("a single party never splits with itself", () => {
    for (const c of SEAT_PARTIES) expect(buildCoalition([c]).splits).toEqual([]);
  });

  it("round-trips share links and drops anything that is not a seated party", () => {
    expect(parseCoalitionParam("?coalition=shs,LIK,NOPE,BW")).toEqual(["SHS", "LIK"]);
    expect(coalitionParam(["SHS", "LIK"])).toBe("LIK,SHS");
    expect(parseCoalitionParam("?x=1")).toBeNull();
    expect(parseCoalitionParam("?coalition=")).toEqual([]);
  });
});

import { closestCoalitions, closestWithoutRedLines } from "./coalition";
import type { PartyCode } from "../data/parties";

describe("closest coalition", () => {
  const like = (fav: Partial<Record<PartyCode, number>>, base = 20) => (c: PartyCode) => fav[c] ?? base;

  it("only returns majorities, best first", () => {
    const r = closestCoalitions(like({ LIK: 90, SHS: 80, UTJ: 75, OTZ: 70, RZ: 70, YB: 60 }));
    expect(r.length).toBe(3);
    for (const c of r) expect(c.seats).toBeGreaterThanOrEqual(ELECTION.majority);
    expect(r.map((c) => c.match)).toEqual([...r.map((c) => c.match)].sort((a, b) => b - a));
  });

  it("finds the obvious right-wing majority for someone who likes only the right", () => {
    const [best] = closestCoalitions(like({ LIK: 90, SHS: 80, UTJ: 80, OTZ: 85, RZ: 85, YB: 60 }, 5));
    expect(best.parties).toEqual(expect.arrayContaining(["LIK", "OTZ", "RZ", "SHS", "UTJ"]));
    // 53 seats is short, and YB's 7 still only make 60, so the best majority adds whichever
    // single party gets past 61 for the least loss of match.
    expect(best.seats).toBeGreaterThanOrEqual(61);
  });

  it("agrees with a brute-force search over every majority", () => {
    const m = like({ LIK: 64, TOG: 58, YSH: 71, SHS: 40, UTJ: 35, OTZ: 30, RZ: 33, YB: 66, DEM: 52, RAM: 44, JL: 38 });
    const [best] = closestCoalitions(m);
    let top = -1;
    for (let mask = 1; mask < 1 << SEAT_PARTIES.length; mask++) {
      const ps = SEAT_PARTIES.filter((_, i) => mask & (1 << i));
      const w = ps.reduce((n, c) => n + seatsOf(c), 0);
      if (w < ELECTION.majority) continue;
      top = Math.max(top, ps.reduce((n, c) => n + m(c) * seatsOf(c), 0) / w);
    }
    expect(best.match).toBeCloseTo(top, 9);
  });

  it("never pads a coalition with a member that drags the match down", () => {
    const r = closestCoalitions(like({ YSH: 90, TOG: 85, DEM: 80, YB: 70, LIK: 60 }, 10), 50);
    for (const c of r)
      for (const p of c.parties) {
        const rest = c.parties.filter((x) => x !== p);
        if (rest.reduce((n, x) => n + seatsOf(x), 0) < ELECTION.majority) continue;
        // p could leave and keep a majority, so it must be pulling the match up, not down
        expect(like({ YSH: 90, TOG: 85, DEM: 80, YB: 70, LIK: 60 }, 10)(p)).toBeGreaterThanOrEqual(c.match - 1e-9);
      }
  });

  it("offers a red-line-free alternative when the closest crosses one", () => {
    const m = like({ YSH: 90, TOG: 85, DEM: 85, YB: 80, JL: 75, RAM: 75 }, 10);
    const [best] = closestCoalitions(m);
    expect(best.redLines.length).toBeGreaterThan(0);
    const alt = closestWithoutRedLines(m)!;
    expect(alt.redLines).toEqual([]);
    expect(alt.parties).not.toContain("JL");
    expect(alt.parties).not.toContain("RAM");
  });
});
