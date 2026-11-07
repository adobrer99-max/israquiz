import { BLOCKS, BLOCK_IDS, ITEMS, type Item } from "../data/items";
import { CODING_NOTES } from "../data/editorial";
import { BALLOT_PARTIES, PARTIES, type PartyCode } from "../data/parties";
import { OUTCOMES, outcomeLine } from "../data/results";
import { ELECTION } from "../data/editorial";

const CODE_LABEL: Record<string, string> = { A: "Agrees", D: "Disagrees", N: "Neutral", "-": "No position" };
const CODE_CLASS: Record<string, string> = { A: "cell-A", D: "cell-D", N: "cell-N", "-": "cell-X" };
const codeOf = (item: Item, c: PartyCode) => (item.pos[c] ?? "-") as string;

/** Notes whose heading names this item, e.g. "A3" or "A3, A5". */
const notesFor = (id: string) => CODING_NOTES.filter((n) => new RegExp(`(^|[^A-Z0-9])${id}([^0-9]|$)`).test(n.items));

function Code({ code }: { code: string }) {
  return <span className={`profile-code ${CODE_CLASS[code] ?? "cell-X"}`}>{CODE_LABEL[code] ?? "No position"}</span>;
}

/** One party: its result, the coding note, and its position on every statement. */
export function PartyProfile({ code, onItem, onCoalition }: { code: PartyCode; onItem: (id: string) => void; onCoalition?: (c: PartyCode) => void }) {
  const p = PARTIES[code];
  const o = OUTCOMES[code];
  const won = o && o.kind === "seats";
  const coded = ITEMS.filter((i) => codeOf(i, code) !== "-").length;
  return (
    <div className="profile">
      <p className="profile-head">
        <span className="swatch" style={{ background: p.color }} aria-hidden="true" />
        <span>
          Led by {p.lead}
          {o ? <> · {outcomeLine(code, ELECTION.threshold) || (o.kind === "component" ? `part of ${PARTIES[o.of].name}` : o.kind === "notRunning" ? "did not run" : "")}</> : null}
        </span>
      </p>
      {p.note && <p className="small">{p.note}</p>}
      <p className="small muted">
        A position on {coded} of {ITEMS.length} statements. Codes are the party's stated positions before the vote; the
        editorial notes give the sources.
      </p>
      {won && onCoalition && (
        <button className="btn-ghost" onClick={() => onCoalition(code)} style={{ marginBottom: 8 }}>
          Build a coalition starting with {p.name}
        </button>
      )}
      {BLOCK_IDS.map((b) => (
        <section key={b} aria-labelledby={`pp-${b}`}>
          <h3 id={`pp-${b}`} className="profile-block">{BLOCKS[b].label}</h3>
          <ul className="profile-list">
            {ITEMS.filter((i) => i.block === b).map((i) => (
              <li key={i.id}>
                <Code code={codeOf(i, code)} />
                <button className="profile-link" onClick={() => onItem(i.id)}>
                  {i.text} <span className="muted mono small">{i.id}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** One statement: where every party on the ballot stands, and the notes behind the codes. */
export function ItemProfile({ id, onParty }: { id: string; onParty: (c: PartyCode) => void }) {
  const item = ITEMS.find((i) => i.id === id)!;
  const groups = ["A", "D", "N", "-"].map((k) => ({ k, parties: BALLOT_PARTIES.filter((c) => codeOf(item, c) === k) }));
  const notes = notesFor(id);
  return (
    <div className="profile">
      <p className="eyebrow">{BLOCKS[item.block].label} · {item.id}</p>
      <p className="profile-statement">{item.text}</p>
      {groups.map(({ k, parties }) => parties.length > 0 && (
        <section key={k} aria-labelledby={`ip-${k}`}>
          <h3 id={`ip-${k}`} className="profile-block">
            <Code code={k} /> <span className="muted mono small">{parties.length}</span>
          </h3>
          <ul className="profile-parties">
            {parties.map((c) => (
              <li key={c}>
                <button className="profile-link" onClick={() => onParty(c)}>
                  <span className="swatch" style={{ background: PARTIES[c].color }} aria-hidden="true" /> {PARTIES[c].name}
                  {OUTCOMES[c]?.kind === "seats" && <span className="muted small"> · {(OUTCOMES[c] as { seats: number }).seats} seats</span>}
                  {OUTCOMES[c]?.kind === "below" && <span className="muted small"> · missed the threshold</span>}
                  {OUTCOMES[c]?.kind === "withdrew" && <span className="muted small"> · withdrew</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {notes.length > 0 && (
        <section aria-labelledby="ip-notes">
          <h3 id="ip-notes" className="profile-block">Editorial notes on this statement</h3>
          {notes.map((n, i) => (
            <details key={i} className="profile-note">
              <summary>{n.items}</summary>
              <p className="small">{n.issue}</p>
            </details>
          ))}
        </section>
      )}
    </div>
  );
}
