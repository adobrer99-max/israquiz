import { ELECTION } from "../data/editorial";
import { PARTIES } from "../data/parties";
import { OUTCOMES, RESULT, SOURCES, STATUS } from "../data/results";

/** The 26th Knesset: seats by bloc and party, with the majority line, and where coalition talks stand. */
export function Knesset({ compact = false, onCoalition }: { compact?: boolean; onCoalition?: () => void }) {
  const seatsOf = (c: keyof typeof OUTCOMES) => { const o = OUTCOMES[c]; return o && o.kind === "seats" ? o.seats : 0; };
  const pct = (n: number) => `${(n / ELECTION.seats) * 100}%`;
  return (
    <section className="card" aria-labelledby="knesset-title">
      <span className="eyebrow">The result</span>
      <h2 id="knesset-title" style={{ margin: "10px 0 6px", fontSize: 22 }}>The vote is in</h2>
      <p className="small muted" style={{ marginTop: 0 }}>
        Certified {RESULT.certified} · turnout {RESULT.turnout}% · {ELECTION.majority} seats for a majority
      </p>

      <div className="knesset-bar" role="img" aria-label={RESULT.blocs.map((b) => `${b.label} ${b.seats}`).join(", ") + ` of ${ELECTION.seats} seats`}>
        {RESULT.blocs.flatMap((b) => b.parties.map((c) => (
          <span key={c} title={`${PARTIES[c].name}: ${seatsOf(c)}`} style={{ width: pct(seatsOf(c)), background: PARTIES[c].color }} />
        )))}
        <i className="knesset-majority" style={{ left: pct(ELECTION.majority) }} aria-hidden="true" />
      </div>

      <div className="knesset-blocs">
        {RESULT.blocs.map((b) => (
          <div key={b.key}>
            <div className="knesset-bloc-head"><strong>{b.label}</strong><span className="mono">{b.seats}</span></div>
            {!compact && b.parties.map((c) => {
              const o = OUTCOMES[c];
              return (
                <div className="row" key={c}>
                  <span><span className="swatch" style={{ background: PARTIES[c].color, display: "inline-block", width: 10, height: 10, marginRight: 8, borderRadius: 2 }} />
                    {PARTIES[c].name}{o.kind === "seats" && o.ballotName ? <span className="muted"> ({o.ballotName})</span> : null}</span>
                  <span className="mono">{seatsOf(c)}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {!compact && (
        <p className="small muted" style={{ marginTop: 12 }}>
          Missed the {ELECTION.threshold}% threshold: the Reservists (2.72%), People of Israel (1.68%), the Haredi Public
          Party (about 0.2%), Noam and Israel First. Blue &amp; White withdrew on 19 October.
        </p>
      )}

      <h3 style={{ margin: "16px 0 6px", fontSize: 16 }}>Forming a government</h3>
      <p className="small" style={{ margin: 0 }}>{STATUS.text} <span className="muted">As of {STATUS.asOf}.</span></p>
      {onCoalition && (
        <button className="btn-ghost" style={{ marginTop: 12 }} onClick={onCoalition}>
          Build your own coalition
        </button>
      )}

      {!compact && (
        <p className="small muted" style={{ marginTop: 10 }}>
          Sources: {SOURCES.map(([label, url], i) => (
            <span key={url}>{i > 0 && " · "}<a href={url} target="_blank" rel="noopener noreferrer">{label}</a></span>
          ))}
        </p>
      )}
    </section>
  );
}
