// Bundled by export-search.mjs. Prints the compass's linkable views for the
// site-wide search on adamdobrer.ca: every party, statement and glossary term.
import { ITEMS, BLOCKS } from "../src/data/items";
import { PARTIES, BALLOT_PARTIES, COMPONENT_PARTIES, type PartyCode } from "../src/data/parties";
import { GLOSSARY } from "../src/data/glossary";
import { OUTCOMES, outcomeLine } from "../src/data/results";
import { ELECTION } from "../src/data/editorial";

const parties = [...BALLOT_PARTIES, ...COMPONENT_PARTIES].map((c: PartyCode) => {
  const p = PARTIES[c], o = OUTCOMES[c];
  const result = outcomeLine(c, ELECTION.threshold) || (o?.kind === "component" ? `part of ${PARTIES[o.of].name}` : "");
  return { k: "Party", t: p.name, d: `Led by ${p.lead}${result ? ` · ${result}` : ""}. Its position on every statement in the Israel compass.`, q: `party=${c}`, w: `${p.lead} ${c} knesset israel party` };
});
const items = ITEMS.map((i) => ({ k: "Statement", t: i.text, d: `${BLOCKS[i.block].label} · ${i.id}. Where every party stands.`, q: `item=${i.id}`, w: `${i.id} ${BLOCKS[i.block].label} israel compass` }));
const terms = GLOSSARY.map((g) => ({ k: "Compass glossary", t: g.title, d: g.body, q: `term=${g.key}`, w: (g.match || []).join(" ") + " israel" }));
console.log(JSON.stringify([...parties, ...items, ...terms]));
