import { useMemo } from "react";
import { ELECTION } from "../data/editorial";
import { PARTIES, type PartyCode } from "../data/parties";
import { closestCoalitions, closestWithoutRedLines, seatsOf, type Closest } from "../lib/coalition";

const names = (cs: PartyCode[]) => {
  const n = cs.map((c) => PARTIES[c].name);
  return n.length < 2 ? n.join("") : `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`;
};

/** After the quiz: the majorities of the 26th Knesset closest to the respondent's answers. */
export function ClosestCoalition({
  matchOf,
  onOpen,
}: {
  matchOf: (c: PartyCode) => number;
  onOpen: (parties: PartyCode[]) => void;
}) {
  const { top, clean } = useMemo(() => {
    const top = closestCoalitions(matchOf, 3);
    const clean = top[0] && top[0].redLines.length ? closestWithoutRedLines(matchOf) : null;
    return { top, clean };
  }, [matchOf]);
  if (!top.length) return null;
  const [best, ...rest] = top;

  return (
    <section className="card closest" aria-labelledby="closest-title" style={{ marginTop: 14 }}>
      <span className="eyebrow">Your closest coalition</span>
      <h3 id="closest-title" style={{ margin: "10px 0 4px", fontSize: 19 }}>
        {names(best.parties)}
      </h3>
      <Summary c={best} />
      <Members c={best} matchOf={matchOf} />
      {best.redLines.length > 0 && (
        <p className="small" style={{ margin: "8px 0 0" }}>
          {names(best.redLines.map((r) => r.party))} {best.redLines.length === 1 ? "is" : "are"} coded as rejecting Arab
          parties as coalition partners, so this one crosses a stated red line.
        </p>
      )}
      <button className="btn-ghost" style={{ marginTop: 10 }} onClick={() => onOpen(best.parties)}>
        Open in the coalition builder
      </button>

      {clean && (
        <div className="closest-alt">
          <p className="small" style={{ margin: 0 }}>
            <strong>Closest without crossing a red line:</strong> {names(clean.parties)}.
          </p>
          <Summary c={clean} small />
          <button className="btn-ghost" style={{ marginTop: 6 }} onClick={() => onOpen(clean.parties)}>
            Open this one
          </button>
        </div>
      )}

      {rest.length > 0 && (
        <details className="closest-more">
          <summary>Next closest</summary>
          <ol>
            {rest.map((c) => (
              <li key={c.parties.join()}>
                <button className="profile-link" onClick={() => onOpen(c.parties)}>{names(c.parties)}</button>
                <Summary c={c} small />
              </li>
            ))}
          </ol>
        </details>
      )}

      <p className="small muted" style={{ marginTop: 12 }}>
        Every majority of {ELECTION.majority} or more from the parties that won seats, scored by each member's match
        with you, weighted by its seats. A coalition is left out if one of its members could leave, keep the majority
        and leave you closer. It describes your answers, not what is likely to form.
      </p>
    </section>
  );
}

function Summary({ c, small }: { c: Closest; small?: boolean }) {
  return (
    <p className={small ? "small muted" : "small"} style={{ margin: small ? "2px 0 0" : "0 0 8px" }}>
      <strong className="mono">{Math.round(c.match)}%</strong> your match · <span className="mono">{c.seats}</span> seats ·
      splits on <span className="mono">{c.splits}</span> statement{c.splits === 1 ? "" : "s"}
    </p>
  );
}

function Members({ c, matchOf }: { c: Closest; matchOf: (p: PartyCode) => number }) {
  return (
    <ul className="closest-members">
      {[...c.parties].sort((a, b) => matchOf(b) - matchOf(a)).map((p) => (
        <li key={p}>
          <span className="swatch" style={{ background: PARTIES[p].color }} aria-hidden="true" />
          {PARTIES[p].name} <span className="muted mono small">{seatsOf(p)} seats · {Math.round(matchOf(p))}%</span>
        </li>
      ))}
    </ul>
  );
}
