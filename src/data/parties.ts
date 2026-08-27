/* ============================================================
   Party registry — spec §2
   Parties live here as data. Mergers, splits and threshold
   failures are absorbed by editing this file and the coding
   columns in items.ts; scoring logic never changes.
   ============================================================ */

export type PartyCode =
  | "LIK" | "TOG" | "YSH" | "SHS" | "UTJ" | "OTZ" | "RZ"
  | "YB"  | "DEM" | "BW"  | "RAM" | "JL"  | "UNI"
  | "NOAM" | "HPP" | "AMY"
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
 * JL and UNI are held as separate overlays because they were coded
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
    note: "Yesh Atid + Bennett merger, April 2026. A platform has since been published at be-yahad.org.il/en/plans. Its education and ageing sections have been read in and confirm B3; every other cell still rests on Yesh Atid's prior platform and Bennett's public statements. The highest-risk column in the bank, and now the most fixable.",
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
  RZ: {
    name: "Religious Zionism", lead: "Smotrich", color: "#C07C13", bloc: "pro", ballot: true,
    belowThreshold: true,
    thresholdNote: "polling below the 3.25% threshold",
    note: "Reported in August as repeatedly failing to cross the threshold in polling, which is a change in this registry and not in the party: it holds the finance ministry and sweeping West Bank powers, and a governing party polling itself out of the next Knesset is the sort of thing a results page should say plainly rather than leave a user to discover on election night.",
  },
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
  UNI: {
    name: "Unity (HaAchdut)", lead: "Erdan (Edelstein #2)", color: "#A0522D",
    bloc: "unaligned", ballot: true,
    note: "Launched 6 August 2026 and named in August. The English name is carried with the Hebrew because 'Unity' alone collides with National Unity, Gantz's 2022 list, which appears under that name in the recalled-vote question and whose successor sits in this bank as Blue & White. Only 17 of 50 items codeable. Suppressed from the headline ranking and from the grid by the coverage rule.",
  },
  HPP: {
    name: "The Haredi Public Party", lead: "Leitner", color: "#4F6D7A",
    bloc: "unaligned", ballot: true,
    belowThreshold: true,
    // Not a polling claim: it is new enough that no polling exists to cite.
    thresholdNote: "a new faction with no polling on record",
    note: "Confirmed running, which settles whether the column belongs in the bank and nothing else — it is not polling, so the threshold risk stands, and the codings still rest on press reporting rather than a published platform. Moti Leitner, former Mayor of Beit Shemesh. An ultra-Orthodox faction campaigning for conscription, core-curriculum education and economic reform within haredi society — the first haredi column in the bank on the pro-conscription side. Its distinctive position is enlistment by incentive rather than by sanction: it wants state funding restructured to reward service and workforce participation, and argues that external coercion fails where communal reform can work. Coded on three stated planks plus the religion-and-state positions its own framing makes near-certain; security, institutions and identity are left unstated. 31% coverage, so it is suppressed from the ranking and the grid. Running is settled; coalition posture is not, hence unaligned.",
  },
  AMY: {
    name: "People of Israel", lead: "Winter", color: "#8C5A2B",
    bloc: "unaligned", ballot: true,
    belowThreshold: true,
    // Not a polling claim: launched days ago, no polling exists to cite.
    thresholdNote: "launched in August; no polling on record",
    note: "Amcha Yisrael, launched in Jerusalem on 25 August 2026 by Ofer Winter, the former Givati Brigade commander released from the military in 2024. Yoseph Haddad, the Arab-Israeli activist, is announced as its candidate for public diplomacy minister. Coded from launch-speech reporting rather than a platform, and thinly: ten of 50 items, 20% coverage, so it is suppressed from the ranking and the grid. Unaligned rather than pro-Netanyahu — Winter promises the broadest possible right-wing government with as many Zionist partners as possible, which is a bloc shape and not an endorsement, and in the same speech he attacks the incumbent political class. Revisit if he endorses.",
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
