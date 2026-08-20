/* ============================================================
   Party registry — spec §2
   Parties live here as data. Mergers, splits and threshold
   failures are absorbed by editing this file and the coding
   columns in items.ts; scoring logic never changes.
   ============================================================ */

export type PartyCode =
  | "LIK" | "TOG" | "YSH" | "SHS" | "UTJ" | "OTZ" | "RZ"
  | "YB"  | "DEM" | "BW"  | "RAM" | "JL"  | "ERD"
  | "NOAM"
  | "HTA" | "BAL";

/** §4.5 bloc readout. `unaligned` parties are reported in no bloc average. */
export type Bloc = "pro" | "anti" | "non" | "unaligned";

export interface Party {
  name: string;
  lead: string;
  color: string;
  bloc: Bloc;
  /** false = a component of a ballot entity, not votable on its own (§3.7) */
  ballot: boolean;
  /** §4.8.1 — threshold context shown next to the match */
  belowThreshold?: boolean;
  /** how to phrase that context; polling and never-run-alone are different claims */
  thresholdNote?: string;
  /** shown in the coding matrix and editorial notes */
  note?: string;
}

/**
 * Column order of the 13-character coding strings in items.ts.
 * JL and ERD are held as separate overlays because they were coded
 * after the matrix was drawn (§3.6, §3.7).
 */
export const MATRIX_ORDER: PartyCode[] = [
  "LIK", "TOG", "YSH", "SHS", "UTJ", "OTZ", "RZ",
  "YB", "DEM", "BW", "RAM", "HTA", "BAL",
];

export const PARTIES: Record<PartyCode, Party> = {
  LIK: {
    name: "Likud", lead: "Netanyahu", color: "#1B4F9C", bloc: "pro", ballot: true,
    note: "Platform and operative policy diverge on annexation and Gaza resettlement; coded to the stated party position.",
  },
  TOG: {
    name: "Together", lead: "Bennett (Lapid #2)", color: "#0E8A7D", bloc: "anti", ballot: true,
    note: "Yesh Atid + Bennett merger, April 2026. No published platform — the highest-risk column in the bank.",
  },
  YSH: {
    name: "Yashar", lead: "Eisenkot", color: "#6E7B8B", bloc: "anti", ballot: true,
    note: "Deliberately undefined platform. Many N codings mean 'genuinely unstated' rather than 'centrist'.",
  },
  SHS: { name: "Shas", lead: "Deri", color: "#5B3E96", bloc: "pro", ballot: true },
  UTJ: {
    name: "United Torah Judaism", lead: "Goldknopf", color: "#2E2E2E", bloc: "pro", ballot: true,
    note: "Degel HaTorah + Agudat Yisrael.",
  },
  OTZ: { name: "Otzma Yehudit", lead: "Ben Gvir", color: "#6E1F16", bloc: "pro", ballot: true },
  RZ: { name: "Religious Zionism", lead: "Smotrich", color: "#C07C13", bloc: "pro", ballot: true },
  YB: { name: "Yisrael Beiteinu", lead: "Liberman", color: "#3B8FC4", bloc: "anti", ballot: true },
  DEM: {
    name: "The Democrats", lead: "Golan", color: "#D8456B", bloc: "anti", ballot: true,
    note: "Labor + Meretz merger.",
  },
  BW: {
    name: "Blue & White", lead: "Gantz", color: "#7E8B99", bloc: "anti", ballot: true,
    belowThreshold: true,
    thresholdNote: "polling below the 3.25% threshold",
    note: "Currently polling below the 3.25% electoral threshold.",
  },
  NOAM: {
    name: "Noam For Israel", lead: "Maoz", color: "#4A1D6B", bloc: "pro", ballot: true,
    belowThreshold: true,
    // Not a polling claim — it has never contested an election on its own.
    thresholdNote: "has never run alone; at threshold risk",
    note: "Running separately for the first time in 2026. Its single seat in 2021 and 2022 came inside the Religious Zionism list. Coded from a narrow platform: complete on religion-and-state and national identity, thin on security, and silent on economics, which is an accurate description of the party rather than a gap in the research.",
  },
  RAM: {
    name: "Ra'am", lead: "Abbas", color: "#2E7D32", bloc: "non", ballot: true,
    note: "Declined to join the revived Joint List and runs separately, now confirmed by the joint slate going ahead without it. Its own positions remain in flux — see the editorial notes on D1, D7 and C9.",
  },
  JL: {
    name: "The Joint List", lead: "Hadash · Ta'al · Balad", color: "#C0392B", bloc: "non", ballot: true,
    note: "Revived June 2026 without Ra'am, and now confirmed: Hadash–Ta'al and Balad are running together. That settles a structural question this registry was holding open — had the alliance collapsed, both would have become ballot entities in their own right and this column would not exist. Still a technical electoral arrangement rather than a shared platform, so the merged column continues to overstate unity on religion-and-state and economics.",
  },
  ERD: {
    name: "Erdan–Edelstein list (unnamed)", lead: "Erdan (Edelstein #2)", color: "#A0522D",
    bloc: "unaligned", ballot: true,
    note: "Launched 6 August 2026. Only 16 of 48 items codeable and a third of those inferred. Suppressed from the headline ranking and from the grid by the coverage rule.",
  },
  HTA: {
    name: "Hadash–Ta'al", lead: "Jabareen", color: "#B03A2E", bloc: "non", ballot: false,
    note: "Component of the Joint List. Not separately votable — settled now that the joint slate is confirmed, where before it was the expected case rather than the certain one.",
  },
  BAL: {
    name: "Balad", lead: "Shehadeh", color: "#7D6608", bloc: "non", ballot: false,
    note: "Component of the Joint List, settled now that the joint slate is confirmed. Takes no position on intra-Jewish religion-and-state questions, and with the alliance fixed that silence is permanently absorbed into the merged column rather than provisionally so.",
  },
};

export const BALLOT_PARTIES = (Object.keys(PARTIES) as PartyCode[]).filter((c) => PARTIES[c].ballot);
export const COMPONENT_PARTIES = (Object.keys(PARTIES) as PartyCode[]).filter((c) => !PARTIES[c].ballot);

export const BLOC_LABEL: Record<Bloc, string> = {
  pro: "Pro-Netanyahu bloc",
  anti: "Anti-Netanyahu Zionist bloc",
  non: "Non-aligned",
  unaligned: "Unaligned",
};
