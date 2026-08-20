/* ============================================================
   §4.7 validation round — the analysis half

   `?validate=1` produces one JSON blob per tester: their declared
   vote, their answers, and the ranking the instrument gave them.
   This turns a pile of those into findings.

   The number everyone will quote is the recovery rate. The number
   that is actually worth having is the miscoding table: the cells
   where several people who know their own party flatly disagree
   with what the matrix says that party thinks. A compass cannot
   check its own codings, and this is the only mechanism in the
   project that can.

   Pure — no filesystem, no process, no DOM. The CLI in
   scripts/validation-report.ts is a thin shell around it, so all
   of the judgement here is unit-testable.
   ============================================================ */

import { CODING_NOTES, INSTRUMENT_NOTES } from "../data/editorial";
import { PARTIES, type PartyCode } from "../data/parties";
import { flatOpposition, score, type Answers, type Weights } from "./scoring";

/** Not a vote for a party; excluded from every rate but still counted. */
export const NON_PARTY = ["UNDECIDED", "NOVOTE"];

export interface ReplyBody {
  responseId: string;
  tester?: string;
  declared?: string;
  declaredRank?: number | null;
  answers: Answers;
  weights: Weights;
  ranking: { code: string; weighted: number; unweighted: number; coverage: number }[];
}

export interface Reply {
  version: string;
  responses: ReplyBody;
}

export interface Rejection {
  source: string;
  reason: string;
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);

/**
 * Accepts what the results page actually exports. Anything malformed is
 * rejected with a reason rather than dropped, because a silently discarded
 * reply is a tester whose time you wasted without noticing.
 */
export function parseReplies(
  raw: { source: string; value: unknown }[],
): { replies: Reply[]; rejected: Rejection[] } {
  const replies: Reply[] = [];
  const rejected: Rejection[] = [];
  const seen = new Set<string>();

  for (const { source, value } of raw) {
    if (!isObj(value) || !isObj(value.responses)) {
      rejected.push({ source, reason: "not an export from the results page" });
      continue;
    }
    const r = value.responses as Record<string, unknown>;
    if (typeof r.declared !== "string" || r.declared === "") {
      rejected.push({ source, reason: "no declared vote — not a validation run (needs ?validate=1)" });
      continue;
    }
    if (!isObj(r.answers) || !Array.isArray(r.ranking)) {
      rejected.push({ source, reason: "missing answers or ranking" });
      continue;
    }
    const id = typeof r.responseId === "string" ? r.responseId : source;
    if (seen.has(id)) {
      rejected.push({ source, reason: "duplicate responseId — the same reply sent twice" });
      continue;
    }
    seen.add(id);
    replies.push({
      version: typeof value.version === "string" ? value.version : "(unstamped)",
      responses: r as unknown as ReplyBody,
    });
  }
  return { replies, rejected };
}

/* --- cells the editorial notes already flag ------------------------------ */

/**
 * The notes name their subject in prose, so this is a regex over English and
 * not a data structure. It annotates rows and never filters them: a false
 * negative costs a highlight, and a false positive is visible on inspection.
 * NOAM needs an alias because the notes call it Noam, not Noam For Israel.
 */
const ALIASES: Partial<Record<PartyCode, string[]>> = {
  NOAM: ["Noam"],
  OTZ: ["Otzma"],
  UTJ: ["UTJ"],
};

function aliasesFor(code: PartyCode): string[] {
  return [PARTIES[code].name, code, ...(ALIASES[code] ?? [])];
}

export function flaggedCells(): Set<string> {
  const out = new Set<string>();
  for (const note of [...CODING_NOTES, ...INSTRUMENT_NOTES]) {
    const ids = note.items.match(/\b[A-E]\d{1,2}\b/g);
    if (!ids) continue;
    for (const code of Object.keys(PARTIES) as PartyCode[]) {
      if (!aliasesFor(code).some((a) => note.items.includes(a))) continue;
      for (const id of ids) out.add(`${code}:${id}`);
    }
  }
  return out;
}

/* --- the report ---------------------------------------------------------- */

export interface Candidate {
  party: PartyCode;
  partyName: string;
  itemId: string;
  itemText: string;
  coded: string;
  count: number;
  testers: string[];
  /** the editorial notes already call this cell out */
  flagged: boolean;
}

export interface PartyRow {
  code: PartyCode;
  name: string;
  n: number;
  recovered: number;
  ranks: number[];
}

export interface Report {
  n: number;
  versions: string[];
  eligible: number;
  recovered: number;
  topThree: number;
  recoveryRate: number | null;
  topThreeRate: number | null;
  medianRank: number | null;
  medianMargin: number | null;
  suppressed: { tester: string; declared: string }[];
  nonParty: { tester: string; declared: string }[];
  perParty: PartyRow[];
  candidates: Candidate[];
  gaps: { code: PartyCode; name: string; severe: boolean }[];
  warnings: string[];
}

const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const isPartyCode = (v: string): v is PartyCode => v in PARTIES;

/** Columns the notes mark as high risk, used to order the panel gaps. */
function severeColumns(): Set<PartyCode> {
  const out = new Set<PartyCode>();
  for (const note of [...CODING_NOTES, ...INSTRUMENT_NOTES]) {
    if (!note.severe) continue;
    for (const code of Object.keys(PARTIES) as PartyCode[]) {
      if (aliasesFor(code).some((a) => note.items.includes(a))) out.add(code);
    }
  }
  return out;
}

export function validationReport(replies: Reply[]): Report {
  const warnings: string[] = [];
  const versions = [...new Set(replies.map((r) => r.version))].sort();
  if (versions.length > 1) {
    warnings.push(
      `Replies span ${versions.length} instrument versions (${versions.join(", ")}). ` +
        "Different banks are not comparable; split them before reading any rate below.",
    );
  }

  const flagged = flaggedCells();
  const severe = severeColumns();

  const ranks: number[] = [];
  const margins: number[] = [];
  const suppressed: Report["suppressed"] = [];
  const nonParty: Report["nonParty"] = [];
  const byParty = new Map<PartyCode, PartyRow>();
  const cells = new Map<string, Candidate>();
  const declaredCodes = new Set<PartyCode>();

  let eligible = 0;
  let recovered = 0;
  let topThree = 0;

  for (const reply of replies) {
    const b = reply.responses;
    const who = b.tester?.trim() || "(no initials)";

    if (NON_PARTY.includes(b.declared!)) {
      nonParty.push({ tester: who, declared: b.declared! });
      continue;
    }
    if (!isPartyCode(b.declared!)) {
      warnings.push(`${who} declared "${b.declared}", which is not a party in this bank.`);
      continue;
    }
    const code = b.declared;
    declaredCodes.add(code);

    // Rank is derived from the ranking the reply carries, not from the
    // declaredRank field beside it — one is data, the other is a conclusion.
    const idx = b.ranking.findIndex((r) => r.code === code);
    const rank = idx >= 0 ? idx + 1 : null;
    if (b.declaredRank != null && rank !== b.declaredRank) {
      warnings.push(
        `${who}: stored declaredRank ${b.declaredRank} disagrees with the ranking in the same reply (${rank}).`,
      );
    }

    // A reply that re-scores differently was produced by a bank this repo no
    // longer has. Everything downstream of it would be comparing two banks.
    const rescored = score(b.answers, b.weights);
    const freshTop = [...rescored.ranked].sort((a, b2) => b2.weighted - a.weighted)[0];
    if (freshTop && b.ranking[0] && freshTop.code !== b.ranking[0].code) {
      warnings.push(
        `${who}: re-scoring against the current bank gives ${freshTop.code}, but the reply shipped with ` +
          `${b.ranking[0].code}. That reply came from a different item bank.`,
      );
    }

    if (rank === null) {
      // The coverage floor suppressed their party. Not a miss — the instrument
      // declining to rank a thinly-coded column is the floor working.
      suppressed.push({ tester: who, declared: PARTIES[code].name });
    } else {
      eligible += 1;
      ranks.push(rank);
      if (rank === 1) recovered += 1;
      if (rank <= 3) topThree += 1;
      margins.push(+(b.ranking[0].weighted - b.ranking[idx].weighted).toFixed(1));

      const row = byParty.get(code) ?? { code, name: PARTIES[code].name, n: 0, recovered: 0, ranks: [] };
      row.n += 1;
      if (rank === 1) row.recovered += 1;
      row.ranks.push(rank);
      byParty.set(code, row);
    }

    // The miscoding signal, collected for suppressed parties too — a thin
    // column is exactly where a wrong cell is most likely to hide.
    for (const item of flatOpposition(code, b.answers)) {
      const key = `${code}:${item.id}`;
      const c = cells.get(key) ?? {
        party: code,
        partyName: PARTIES[code].name,
        itemId: item.id,
        itemText: item.text,
        coded: item.pos[code],
        count: 0,
        testers: [],
        flagged: flagged.has(key),
      };
      c.count += 1;
      c.testers.push(who);
      cells.set(key, c);
    }
  }

  const gaps = (Object.keys(PARTIES) as PartyCode[])
    .filter((c) => PARTIES[c].ballot && !declaredCodes.has(c))
    .map((c) => ({ code: c, name: PARTIES[c].name, severe: severe.has(c) }))
    .sort((a, b) => Number(b.severe) - Number(a.severe) || a.name.localeCompare(b.name));

  return {
    n: replies.length,
    versions,
    eligible,
    recovered,
    topThree,
    recoveryRate: eligible ? recovered / eligible : null,
    topThreeRate: eligible ? topThree / eligible : null,
    medianRank: median(ranks),
    medianMargin: median(margins),
    suppressed,
    nonParty,
    perParty: [...byParty.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name)),
    candidates: [...cells.values()].sort(
      (a, b) => b.count - a.count || Number(b.flagged) - Number(a.flagged) || a.itemId.localeCompare(b.itemId),
    ),
    gaps,
    warnings,
  };
}

/* --- rendering ----------------------------------------------------------- */

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);

export function renderMarkdown(r: Report, rejected: Rejection[] = []): string {
  const L: string[] = [];
  L.push("# Validation round — §4.7");
  L.push("");
  L.push(`${r.n} replies · instrument ${r.versions.join(", ") || "(none)"}`);
  L.push("");
  L.push("**Not for publication as it stands.** It names testers and joins a declared vote to a");
  L.push("full answer vector, which is the join §6.5.1 keeps apart everywhere else.");
  L.push("");

  if (r.warnings.length) {
    L.push("## Read these first");
    L.push("");
    for (const w of r.warnings) L.push(`- ${w}`);
    L.push("");
  }

  L.push("## Recovery");
  L.push("");
  L.push(`- **Recovered at rank 1:** ${r.recovered} of ${r.eligible} (${pct(r.recoveryRate)})`);
  L.push(`- **In the top three:** ${r.topThree} of ${r.eligible} (${pct(r.topThreeRate)})`);
  L.push(`- Median rank of the declared party: ${r.medianRank ?? "—"}`);
  L.push(`- Median gap between the top match and the declared party: ${r.medianMargin ?? "—"} pts`);
  L.push("");
  if (r.suppressed.length) {
    L.push(
      `${r.suppressed.length} tester(s) declared a party the coverage floor suppresses, so it could not be ` +
        "ranked. That is the floor working, not a miss, and they are excluded from the rates above:",
    );
    L.push("");
    for (const s of r.suppressed) L.push(`- ${s.tester} — ${s.declared}`);
    L.push("");
  }
  if (r.nonParty.length) {
    L.push(`${r.nonParty.length} undecided or not voting, counted and excluded from every rate.`);
    L.push("");
  }

  if (r.perParty.length) {
    L.push("## By declared party");
    L.push("");
    L.push("| Party | Testers | Recovered | Ranks |");
    L.push("|---|---|---|---|");
    for (const p of r.perParty) {
      L.push(`| ${p.name} | ${p.n} | ${p.recovered} | ${p.ranks.sort((a, b) => a - b).join(", ")} |`);
    }
    L.push("");
    L.push("Cell counts are tiny by construction. Read them as anecdotes with names attached, not as rates.");
    L.push("");
  }

  L.push("## Cells to re-check");
  L.push("");
  if (!r.candidates.length) {
    L.push("No tester flatly opposed their own party on any statement. On a round this size that is more");
    L.push("likely to mean the panel was too small or too agreeable than that the matrix is right.");
  } else {
    L.push("Statements where a tester's answer is on the opposite side from their own declared party.");
    L.push("Several testers of the same party landing on one cell is the strongest evidence of a coding");
    L.push("error this project can generate. **‡** marks cells the editorial notes already flag — an");
    L.push("independent hit on one of those is worth acting on immediately.");
    L.push("");
    L.push("| Party | Item | Coded | Testers | Statement |");
    L.push("|---|---|---|---|---|");
    for (const c of r.candidates) {
      const mark = c.flagged ? " ‡" : "";
      L.push(
        `| ${c.partyName}${mark} | ${c.itemId} | ${c.coded} | ${c.count} (${c.testers.join(", ")}) | ${c.itemText} |`,
      );
    }
    L.push("");
    L.push("The ‡ match is a regex over the editorial notes' prose, so it under-reports rather than over-reports.");
  }
  L.push("");

  if (r.gaps.length) {
    L.push("## Columns no tester validated");
    L.push("");
    L.push("Nobody in this round declared these, so their codings are exactly as unverified as before it.");
    L.push("Marked **high risk** where the editorial notes already flag the column. This is the recruiting");
    L.push("list for the next round.");
    L.push("");
    for (const g of r.gaps) L.push(`- ${g.name}${g.severe ? " — **high risk**" : ""}`);
    L.push("");
  }

  if (rejected.length) {
    L.push("## Replies not counted");
    L.push("");
    for (const x of rejected) L.push(`- \`${x.source}\` — ${x.reason}`);
    L.push("");
  }

  return L.join("\n");
}
