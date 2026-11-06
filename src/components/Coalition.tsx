import { useMemo, useState } from "react";
import { BLOCKS, BLOCK_IDS } from "../data/items";
import { ELECTION } from "../data/editorial";
import { PARTIES, type PartyCode } from "../data/parties";
import { buildCoalition, coalitionParam, PRESETS, SEAT_PARTIES, seatsOf, type ItemStance } from "../lib/coalition";
import type { ScoreResult } from "../lib/scoring";

const names = (cs: PartyCode[]) => {
  const n = cs.map((c) => PARTIES[c].name);
  return n.length < 2 ? n.join("") : `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`;
};
const pct = (n: number) => `${(n / ELECTION.seats) * 100}%`;

/** Pick parties from the 26th Knesset and see what they would agree on. */
export function Coalition({
  initial,
  result,
  answered,
}: {
  initial: PartyCode[];
  result: ScoreResult;
  answered: number;
}) {
  const [picked, setPicked] = useState<PartyCode[]>(initial);
  const [copied, setCopied] = useState(false);
  const c = useMemo(() => buildCoalition(picked), [picked]);

  const toggle = (code: PartyCode) =>
    setPicked((p) => (p.includes(code) ? p.filter((x) => x !== code) : [...p, code]));

  // Your match: each member's match with you, weighted by its seats.
  const yourMatch =
    answered > 0 && c.seats > 0
      ? Math.round(c.parties.reduce((n, p) => n + (result.all[p]?.weighted ?? 0) * seatsOf(p), 0) / c.seats)
      : null;

  const share = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("coalition", coalitionParam(c.parties));
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    try {
      navigator.clipboard.writeText(url.toString()).then(done, done);
    } catch {
      done();
    }
  };

  const short = ELECTION.majority - c.seats;

  return (
    <div className="coalition">
      <p className="small">
        Pick parties from the {ELECTION.knesset}th Knesset. The builder reads the same coding matrix the quiz uses, so it
        shows where your coalition would agree and where it would split. It does not predict who would give way.
      </p>

      <div className="btn-row coalition-presets" role="group" aria-label="Start from">
        {PRESETS.map((p) => (
          <button key={p.key} className="chip" onClick={() => setPicked(p.parties)}>
            {p.label}
          </button>
        ))}
        <button className="chip" onClick={() => setPicked([])} disabled={!picked.length}>
          Clear
        </button>
      </div>

      <div className="card coalition-summary" aria-live="polite">
        <div className="knesset-bar" role="img" aria-label={`${c.seats} of ${ELECTION.seats} seats`}>
          {c.parties.map((p) => (
            <span key={p} title={`${PARTIES[p].name}: ${seatsOf(p)}`} style={{ width: pct(seatsOf(p)), background: PARTIES[p].color }} />
          ))}
          <i className="knesset-majority" style={{ left: pct(ELECTION.majority) }} aria-hidden="true" />
        </div>
        <p style={{ margin: "0 0 4px", fontSize: 18 }}>
          <strong className="mono">{c.seats}</strong> seats{" "}
          {!c.parties.length ? (
            <span className="muted">· pick at least one party</span>
          ) : c.majority ? (
            <span className="coalition-ok">· a majority ({c.seats > ELECTION.majority ? `${c.seats - ELECTION.majority} to spare` : "none to spare"})</span>
          ) : (
            <span className="coalition-short">· {short} short of {ELECTION.majority}</span>
          )}
        </p>
        {yourMatch !== null && (
          <p className="small" style={{ margin: 0 }}>
            Your match with this coalition: <strong className="mono">{yourMatch}%</strong>{" "}
            <span className="muted">(each party's match with you, weighted by its seats)</span>
          </p>
        )}
      </div>

      <div className="coalition-parties" role="group" aria-label="Parties">
        {SEAT_PARTIES.map((code) => {
          const on = picked.includes(code);
          return (
            <button key={code} className="coalition-party" aria-pressed={on} onClick={() => toggle(code)}>
              <span className="swatch" style={{ background: PARTIES[code].color }} aria-hidden="true" />
              <span className="coalition-party-name">{PARTIES[code].name}</span>
              <span className="mono">{seatsOf(code)}</span>
            </button>
          );
        })}
      </div>

      {c.parties.length > 0 && (
        <button className="btn-ghost coalition-share" onClick={share}>
          {copied ? "Link copied" : "Copy a link to this coalition"}
        </button>
      )}

      {c.redLines.length > 0 && (
        <div className="card coalition-warn" role="note">
          <h3 style={{ margin: "0 0 6px", fontSize: 16 }}>Will they sit together?</h3>
          <p className="small" style={{ margin: 0 }}>
            {names(c.redLines.map((r) => r.party))} {c.redLines.length === 1 ? "is" : "are"} coded as rejecting Arab parties
            as coalition partners ({c.redLines[0].item}), and this coalition includes {names(c.redLines[0].partners)}. That is
            a coding of stated positions, not a forecast. Coalitions have been formed across lines like this before.
          </p>
        </div>
      )}

      {c.parties.length > 1 && (
        <>
          <h3 style={{ margin: "22px 0 6px", fontSize: 18 }}>By area</h3>
          <div className="coalition-blocks">
            {BLOCK_IDS.map((b) => {
              const t = c.byBlock[b];
              return (
                <div key={b} className="coalition-block">
                  <span>{BLOCKS[b].label}</span>
                  <span className="mono small">
                    {t.coded ? `${t.split} split · ${t.united} united` : "nothing coded"}
                  </span>
                </div>
              );
            })}
          </div>

          <h3 style={{ margin: "22px 0 4px", fontSize: 18 }}>
            Where it splits <span className="muted mono small">{c.splits.length}</span>
          </h3>
          {c.splits.length === 0 ? (
            <p className="small muted">No item has one member for it and another against.</p>
          ) : (
            <>
              <p className="small muted" style={{ marginTop: 0 }}>Most even splits first.</p>
              <ol className="coalition-list">
                {c.splits.map((s) => (
                  <Split key={s.item.id} s={s} />
                ))}
              </ol>
            </>
          )}

          <details className="coalition-united">
            <summary>
              Where it agrees <span className="muted mono small">{c.stances.filter((s) => s.kind === "for" || s.kind === "against").length}</span>
            </summary>
            <ul className="coalition-list">
              {c.stances
                .filter((s) => s.kind === "for" || s.kind === "against")
                .map((s) => (
                  <li key={s.item.id}>
                    <span className={s.kind === "for" ? "cell-A" : "cell-D"}>{s.kind === "for" ? "For" : "Against"}</span>{" "}
                    {s.item.text}{" "}
                    <span className="muted small">
                      ({s.item.id}
                      {s.neutralParties.length ? `; neutral: ${names(s.neutralParties)}` : ""}
                      {s.silentParties.length ? `; no position: ${names(s.silentParties)}` : ""})
                    </span>
                  </li>
                ))}
            </ul>
          </details>
        </>
      )}
    </div>
  );
}

function Split({ s }: { s: ItemStance }) {
  return (
    <li>
      <div>{s.item.text} <span className="muted small">({s.item.id})</span></div>
      <div className="small coalition-sides">
        <span><span className="cell-A">For</span> {s.forSeats}: {names(s.forParties)}</span>
        <span><span className="cell-D">Against</span> {s.againstSeats}: {names(s.againstParties)}</span>
        {s.neutralParties.length > 0 && <span className="muted">Neutral: {names(s.neutralParties)}</span>}
      </div>
    </li>
  );
}
