/* ============================================================
   Results of the 27 October 2026 election to the 26th Knesset.
   Certified seat counts from the Central Elections Committee, as
   reported 30 October 2026; below-threshold shares as reported with
   all votes counted. Coalition status is dated and will go stale:
   update STATUS (and its date) as the government forms.

   Results describe what happened; they never touch the coding
   matrix or the scoring. A party's positions are no more or less
   true for having won or lost.
   ============================================================ */

import type { PartyCode } from "./parties";

export type Outcome =
  | { kind: "seats"; seats: number; ballotName?: string }
  | { kind: "below"; pct?: number; votes?: number }
  | { kind: "withdrew"; when: string }
  | { kind: "component"; of: PartyCode }
  | { kind: "notRunning" };

export const OUTCOMES: Record<PartyCode, Outcome> = {
  LIK: { kind: "seats", seats: 27 },
  YSH: { kind: "seats", seats: 21 },
  TOG: { kind: "seats", seats: 12, ballotName: "B'Yachad" },
  JL: { kind: "seats", seats: 11 },
  DEM: { kind: "seats", seats: 8 },
  RAM: { kind: "seats", seats: 8 },
  YB: { kind: "seats", seats: 7 },
  UTJ: { kind: "seats", seats: 7 },
  OTZ: { kind: "seats", seats: 7 },
  SHS: { kind: "seats", seats: 6 },
  RZ: { kind: "seats", seats: 6, ballotName: "Religious Zionism" },
  RES: { kind: "below", pct: 2.72 },
  AMY: { kind: "below", pct: 1.68 },
  HPP: { kind: "below", pct: 0.2 },
  NOAM: { kind: "below", votes: 9923 },
  IFT: { kind: "below", votes: 955 },
  BW: { kind: "withdrew", when: "19 October 2026" },
  UNI: { kind: "notRunning" },
  HTA: { kind: "component", of: "JL" },
  BAL: { kind: "component", of: "JL" },
};

export const RESULT = {
  turnout: 77.9,
  certified: "30 October 2026",
  blocs: [
    { key: "pro", label: "Netanyahu bloc", seats: 53, parties: ["LIK", "OTZ", "UTJ", "SHS", "RZ"] as PartyCode[] },
    { key: "anti", label: "Anti-Netanyahu bloc", seats: 48, parties: ["YSH", "TOG", "DEM", "YB"] as PartyCode[] },
    { key: "non", label: "Arab parties", seats: 19, parties: ["JL", "RAM"] as PartyCode[] },
  ],
};

/** Where coalition talks stand. Dated, because it changes. */
export const STATUS = {
  asOf: "9 November 2026",
  text:
    "President Herzog gave Gadi Eisenkot the first mandate to form a government on 8 November, after parties holding " +
    "67 seats recommended him and parties holding 46 recommended Benjamin Netanyahu. Eisenkot has 28 days, with a " +
    "possible 14-day extension. If he fails, Herzog can give another member, most likely Netanyahu, 28 days; if both " +
    "fail, a majority of 61 can agree on a third candidate within 21 days before a new election is called. Eisenkot " +
    "is seeking a \"national emergency government\" and has invited Likud and Religious Zionism members to join. His 67 " +
    "includes 19 seats from the Arab-led parties, which have said they would back him or not vote against him, but his " +
    "Jewish-led partners have said they will not join a government that relies on them. Netanyahu has called for a " +
    "unity government built around his outgoing coalition. No coalition agreements had been signed by 9 November.",
};

export const SOURCES: [string, string][] = [
  ["Central Elections Committee final results (Times of Israel)", "https://www.timesofisrael.com/liveblog_entry/central-elections-committee-publishes-final-election-results-knesset-to-be-sworn-in-nov-10/"],
  ["Votes below the threshold (Ynet)", "https://www.ynetnews.com/article/sjjh87gtmg"],
  ["Gantz withdraws (Times of Israel)", "https://www.timesofisrael.com/liveblog_entry/gantz-pulls-out-of-election-race-eight-days-ahead-of-vote/"],
  ["Coalition consultations (ABC News)", "https://www.abc.net.au/news/2026-11-06/israel-president-coalition-talks/107353572"],
  ["Eisenkot tasked with forming government (Times of Israel)", "https://www.timesofisrael.com/eisenkot-gets-nod-to-form-government-vows-unconventional-acts-in-time-of-emergency/"],
];

export function outcomeLine(code: PartyCode, threshold: number): string {
  const o = OUTCOMES[code];
  if (!o) return "";
  if (o.kind === "seats") return `won ${o.seats} seat${o.seats === 1 ? "" : "s"}${o.ballotName ? ` (as ${o.ballotName})` : ""}`;
  if (o.kind === "below") return `missed the ${threshold}% threshold${o.pct != null ? ` (${o.pct}%)` : o.votes != null ? ` (${o.votes.toLocaleString("en-CA")} votes)` : ""}`;
  if (o.kind === "withdrew") return `withdrew before the vote (${o.when})`;
  return "";
}
export const wonSeats = (code: PartyCode) => OUTCOMES[code]?.kind === "seats";
