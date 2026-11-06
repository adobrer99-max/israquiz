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
