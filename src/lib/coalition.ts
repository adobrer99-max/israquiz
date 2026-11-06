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
