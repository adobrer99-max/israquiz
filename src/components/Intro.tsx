import { ELECTION, VERSION, VERSION_DATE } from "../data/editorial";
import { ITEMS } from "../data/items";
import { BALLOT_PARTIES, PARTIES } from "../data/parties";

export function Intro({
  onStart,
  onResume,
  hasSaved,
  savedCount,
  validation,
  declared,
  setDeclared,
  tester,
  setTester,
}: {
  onStart: () => void;
  onResume: () => void;
  hasSaved: boolean;
  savedCount: number;
  validation: boolean;
  declared: string;
  setDeclared: (v: string) => void;
  tester: string;
  setTester: (v: string) => void;
}) {
  return (
    <div>
      <div className="rule-left">
        <span className="eyebrow">
          {VERSION} · {VERSION_DATE}
        </span>
        <h1 style={{ margin: "12px 0 10px" }}>Israel 2026 Election Compass</h1>
        <p className="muted" style={{ fontSize: 15 }}>
          {ITEMS.length} statements, then five sliders. Roughly eight minutes. Built for the{" "}
          {ELECTION.knesset}th Knesset, {ELECTION.date}.
        </p>
      </div>

      {hasSaved && (
        <div className="card">
          <p style={{ fontSize: 15 }}>
            You have {savedCount} answer{savedCount === 1 ? "" : "s"} saved on this device.
          </p>
          <button className="btn" onClick={onResume}>
            Pick up where you left off
          </button>
        </div>
      )}

      {validation && (
        <div className="card">
          <span className="eyebrow">Validation mode</span>
          <p style={{ fontSize: 15, marginTop: 10 }}>
            You're testing whether this instrument can find a party you have already chosen. Tell it your
            intended vote first, so the result can't quietly talk you into agreeing with it.
          </p>
          <label className="mono small muted" htmlFor="declared" style={{ marginBottom: 6 }}>
            WHO YOU PLAN TO VOTE FOR
          </label>
          <select
            id="declared"
            value={declared}
            onChange={(e) => setDeclared(e.target.value)}
            style={{ marginBottom: 14 }}
          >
            <option value="">Select a party…</option>
            {BALLOT_PARTIES.map((c) => (
              <option key={c} value={c}>
                {PARTIES[c].name}
              </option>
            ))}
            <option value="UNDECIDED">Undecided</option>
            <option value="NOVOTE">Not voting / not eligible</option>
          </select>
          <label className="mono small muted" htmlFor="tester" style={{ marginBottom: 6 }}>
            YOUR INITIALS (SO RESULTS CAN BE MATCHED UP LATER)
          </label>
          <input id="tester" type="text" value={tester} onChange={(e) => setTester(e.target.value)} placeholder="e.g. YS" />
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: 8 }}>Before you start</h3>
        <p className="small">
          Five 5-point answers, plus a separate <em>no opinion</em> button. Use it. A skipped statement is
          left out of every calculation, which is a different and more useful signal than a neutral one.
        </p>
        <p className="small">
          A match percentage measures agreement on issues. It is not coalition arithmetic, not leadership,
          not electoral viability, and not advice about how to vote.
        </p>
        <p className="small">
          Party codings are a working draft and will be re-verified against the lists actually filed in
          September. The full matrix is published — you can check every cell the scoring uses.
        </p>
        <p className="small">
          Nothing leaves your browser. Progress saves to this device so you can close the tab and come back.
        </p>
      </div>

      <button className="btn" onClick={onStart} disabled={validation && !declared}>
        {hasSaved ? "Start over" : "Start"}
      </button>
    </div>
  );
}
