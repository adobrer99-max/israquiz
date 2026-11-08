// Bundled by export-search.mjs. Prints dist/pages.json: everything adamdobrer.ca needs to
// build plain, crawlable pages for the compass (one per party, and how the coding works),
// taken from the same data as the quiz so the pages can never disagree with it.
import { ITEMS, BLOCKS, BLOCK_IDS, INFERRED, JL_MERGE_FLAGS } from "../src/data/items";
import { PARTIES, BALLOT_PARTIES, COMPONENT_PARTIES, MATRIX_ORDER, BLOC_LABEL, type PartyCode } from "../src/data/parties";
import { OUTCOMES, RESULT, STATUS, SOURCES, outcomeLine } from "../src/data/results";
import { ELECTION, VERSION, VERSION_DATE, UPDATES, CODING_NOTES, INSTRUMENT_NOTES, LIMITS } from "../src/data/editorial";

const codes: PartyCode[] = [...BALLOT_PARTIES, ...COMPONENT_PARTIES];
const parties = codes.map((c) => {
  const p = PARTIES[c], o = OUTCOMES[c];
  return {
    code: c, name: p.name, lead: p.lead, color: p.color, bloc: BLOC_LABEL[p.bloc], ballot: p.ballot,
    componentOf: o?.kind === "component" ? o.of : null,
    outcome: o ? { ...o, line: outcomeLine(c, ELECTION.threshold) } : null,
    note: p.note ?? null,
    thresholdNote: p.thresholdNote ?? null,
    inferred: INFERRED[c] ?? [],
    pos: Object.fromEntries(ITEMS.map((i) => [i.id, i.pos[c] ?? "-"])),
  };
});

console.log(JSON.stringify({
  version: VERSION, versionDate: VERSION_DATE, updates: UPDATES,
  election: ELECTION, result: RESULT, status: STATUS, sources: SOURCES,
  blocks: BLOCK_IDS.map((b) => BLOCKS[b]),
  items: ITEMS.map((i) => ({ id: i.id, block: i.block, sign: i.sign, text: i.text })),
  parties, matrixOrder: MATRIX_ORDER, mergeFlags: JL_MERGE_FLAGS,
  limits: LIMITS, codingNotes: CODING_NOTES, instrumentNotes: INSTRUMENT_NOTES,
}));
