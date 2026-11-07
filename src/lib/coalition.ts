/* ============================================================
   Coalition builder. Pick parties from the 26th Knesset and see
   what they would agree on, where they would split, and what the
   codings say about who will sit with whom.

   Everything here is read from the coding matrix and the certified
   seat counts. Nothing is weighted by guesswork about bargaining:
   a split is a split whether it is 60 seats against 1 or 30 against
   30, and the list says how even it is rather than predicting who
   would give way.
   ============================================================ */

import { BLOCK_IDS, ITEMS, type BlockId, type Item } from "../data/items";
import { type PartyCode } from "../data/parties";
import { OUTCOMES } from "../data/results";
import { ELECTION } from "../data/editorial";

/** Parties that won seats, largest first. */
export const SEAT_PARTIES: PartyCode[] = (Object.keys(OUTCOMES) as PartyCode[])
  .filter((c) => OUTCOMES[c].kind === "seats")
  .sort((a, b) => seatsOf(b) - seatsOf(a));

export function seatsOf(code: PartyCode): number {
  const o = OUTCOMES[code];
  return o && o.kind === "seats" ? o.seats : 0;
}

export type StanceKind = "for" | "against" | "split" | "open";

export interface ItemStance {
  item: Item;
  kind: StanceKind;
  forParties: PartyCode[];
  againstParties: PartyCode[];
  neutralParties: PartyCode[];
  silentParties: PartyCode[];
  forSeats: number;
  againstSeats: number;
}

export interface RedLine {
  party: PartyCode;
  partners: PartyCode[];
  item: string;
}

export interface Coalition {
  parties: PartyCode[];
  seats: number;
  majority: boolean;
  stances: ItemStance[];
  /** Items where at least one member is for and one against, most even first. */
  splits: ItemStance[];
  /** Per block: how many items the coalition holds a single direction on, out of those any member codes. */
  byBlock: Record<BlockId, { united: number; split: number; coded: number }>;
  redLines: RedLine[];
}

const sum = (cs: PartyCode[]) => cs.reduce((n, c) => n + seatsOf(c), 0);

/** The item that codes whether Arab parties are legitimate coalition partners. */
export const ARAB_PARTNERS_ITEM = "D2";
const ARAB_PARTIES: PartyCode[] = ["JL", "RAM"];

export function stanceOn(item: Item, parties: PartyCode[]): ItemStance {
  const by = (p: string) => parties.filter((c) => item.pos[c] === p);
  const forParties = by("A");
  const againstParties = by("D");
  const kind: StanceKind =
    forParties.length && againstParties.length ? "split" : forParties.length ? "for" : againstParties.length ? "against" : "open";
  return {
    item,
    kind,
    forParties,
    againstParties,
    neutralParties: by("N"),
    silentParties: parties.filter((c) => item.pos[c] === "-" || item.pos[c] === undefined),
    forSeats: sum(forParties),
    againstSeats: sum(againstParties),
  };
}

export function buildCoalition(parties: PartyCode[]): Coalition {
  const members = SEAT_PARTIES.filter((c) => parties.includes(c));
  const seats = sum(members);
  const stances = ITEMS.map((i) => stanceOn(i, members));
  const splits = stances
    .filter((s) => s.kind === "split")
    .sort((a, b) => Math.min(b.forSeats, b.againstSeats) - Math.min(a.forSeats, a.againstSeats) || a.item.id.localeCompare(b.item.id));

  const byBlock = Object.fromEntries(BLOCK_IDS.map((b) => [b, { united: 0, split: 0, coded: 0 }])) as Coalition["byBlock"];
  for (const s of stances) {
    if (s.kind === "open") continue;
    const t = byBlock[s.item.block];
    t.coded++;
    if (s.kind === "split") t.split++;
    else t.united++;
  }

  // A member coded D on "Arab parties should be legitimate coalition partners"
  // sitting with an Arab party. Reported as a coding, not a prediction.
  const arab = members.filter((c) => ARAB_PARTIES.includes(c));
  const d2 = ITEMS.find((i) => i.id === ARAB_PARTNERS_ITEM);
  const redLines: RedLine[] =
    arab.length && d2
      ? members
          .filter((c) => !ARAB_PARTIES.includes(c) && d2.pos[c] === "D")
          .map((party) => ({ party, partners: arab, item: ARAB_PARTNERS_ITEM }))
      : [];

  return { parties: members, seats, majority: seats >= ELECTION.majority, stances, splits, byBlock, redLines };
}

/** The two sets of recommendations made to the President, as reported. */
export const PRESETS: { key: string; label: string; parties: PartyCode[] }[] = [
  { key: "eisenkot", label: "Recommended Eisenkot", parties: ["YSH", "TOG", "YB", "DEM", "JL", "RAM"] },
  { key: "netanyahu", label: "Recommended Netanyahu", parties: ["LIK", "OTZ", "RZ", "SHS"] },
  { key: "bloc", label: "Netanyahu bloc", parties: ["LIK", "OTZ", "UTJ", "SHS", "RZ"] },
];

/* --- share links: ?coalition=LIK,SHS --- */
export function parseCoalitionParam(search: string): PartyCode[] | null {
  const raw = new URLSearchParams(search).get("coalition");
  if (raw === null) return null;
  return raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((c): c is PartyCode => (SEAT_PARTIES as string[]).includes(c));
}

export function coalitionParam(parties: PartyCode[]): string {
  return SEAT_PARTIES.filter((c) => parties.includes(c)).join(",");
}

/* --- closest coalition to a respondent --- */

export interface Closest {
  parties: PartyCode[];
  seats: number;
  /** seat-weighted mean of each member's match with the respondent, 0–100 */
  match: number;
  redLines: RedLine[];
  splits: number;
}

/**
 * Every majority of the seated parties, scored by how closely it matches the respondent:
 * each member's match weighted by its seats, the same figure the builder shows.
 *
 * Under a seat-weighted mean, adding a party that matches you less than the coalition
 * already does always lowers the score, and dropping one always raises it, so most
 * majorities are beaten by a smaller one inside them. Those are left out: a majority is
 * listed only if no member could leave, keeping 61, and raise the match. That leaves the
 * coalitions worth talking about, not 67-seat versions of a better 61-seat one.
 */
export function closestCoalitions(matchOf: (c: PartyCode) => number, limit = 3): Closest[] {
  const n = SEAT_PARTIES.length;
  const seats = SEAT_PARTIES.map(seatsOf);
  const m = SEAT_PARTIES.map(matchOf);
  const score = (mask: number) => {
    let s = 0, w = 0;
    for (let i = 0; i < n; i++) if (mask & (1 << i)) { s += m[i] * seats[i]; w += seats[i]; }
    return { s: w ? s / w : 0, w };
  };
  const out: { mask: number; s: number; w: number }[] = [];
  for (let mask = 1; mask < 1 << n; mask++) {
    const { s, w } = score(mask);
    if (w < ELECTION.majority) continue;
    let dominated = false;
    for (let i = 0; i < n && !dominated; i++) {
      if (!(mask & (1 << i))) continue;
      const sub = score(mask & ~(1 << i));
      if (sub.w >= ELECTION.majority && sub.s > s + 1e-9) dominated = true;
    }
    if (!dominated) out.push({ mask, s, w });
  }
  out.sort((a, b) => b.s - a.s || a.w - b.w);
  return out.slice(0, limit).map(({ mask, s, w }) => {
    const parties = SEAT_PARTIES.filter((_, i) => mask & (1 << i));
    const c = buildCoalition(parties);
    return { parties, seats: w, match: s, redLines: c.redLines, splits: c.splits.length };
  });
}

/** The closest majority that crosses no stated red line, if the very closest does. */
export function closestWithoutRedLines(matchOf: (c: PartyCode) => number): Closest | null {
  return closestCoalitions(matchOf, 2048).find((c) => c.redLines.length === 0) ?? null;
}
