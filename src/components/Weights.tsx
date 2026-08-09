import { BLOCKS, BLOCK_IDS, F1, F2 } from "../data/items";
import { DEFAULT_WEIGHTS, type Weights as W } from "../lib/scoring";

const CHOICES: { v: -1 | 0 | 1; l: string }[] = [
  { v: 1, l: "Agree" },
  { v: 0, l: "Neutral" },
  { v: -1, l: "Disagree" },
];

function Diagnostic({
  text,
  value,
  onChange,
  note,
}: {
  text: string;
  value: -1 | 0 | 1 | null;
  onChange: (v: -1 | 0 | 1) => void;
  note: string;
}) {
  return (
    <div className="card">
      <p className="serif" style={{ fontSize: 18, lineHeight: 1.4, marginBottom: 14 }}>
        {text}
      </p>
      <div className="btn-row">
        {CHOICES.map((o) => (
          <button
            key={o.v}
            className="answer"
            style={{ justifyContent: "center" }}
            aria-pressed={value === o.v}
            onClick={() => onChange(o.v)}
          >
            {o.l}
          </button>
        ))}
      </div>
      <p className="small muted" style={{ marginTop: 10 }}>
        {note}
      </p>
    </div>
  );
}

/** §4.4 topic weighting, plus the two diagnostic items from §3F. */
export function Weights({
  weights,
  setWeights,
  f1,
  setF1,
  f2,
  setF2,
  onDone,
}: {
  weights: W;
  setWeights: (w: W) => void;
  f1: -1 | 0 | 1 | null;
  setF1: (v: -1 | 0 | 1) => void;
  f2: -1 | 0 | 1 | null;
  setF2: (v: -1 | 0 | 1) => void;
  onDone: () => void;
}) {
  const total = BLOCK_IDS.reduce((s, b) => s + weights[b], 0);
  const even = BLOCK_IDS.every((b) => weights[b] === DEFAULT_WEIGHTS[b]);

  return (
    <div>
      <span className="eyebrow">Last step</span>
      <h2 style={{ margin: "10px 0 8px" }}>Which of these decides your vote?</h2>
      <p className="muted" style={{ fontSize: 15 }}>
        Spend 100 points. Leave them even if no topic outweighs the others — the result is then identical to
        not weighting at all, which is the point: this step can never be blamed for a result you didn't ask
        for.
      </p>

      <div className="card">
        {BLOCK_IDS.map((b) => (
          <div key={b} style={{ marginBottom: 16 }}>
            <label htmlFor={`w-${b}`} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
              <span>{BLOCKS[b].label}</span>
              <span className="mono" style={{ fontWeight: 600 }}>
                {weights[b]}
              </span>
            </label>
            <input
              id={`w-${b}`}
              type="range"
              min={0}
              max={60}
              step={5}
              value={weights[b]}
              onChange={(e) => setWeights({ ...weights, [b]: Number(e.target.value) })}
            />
          </div>
        ))}
        <div className="row" style={{ borderBottom: "none", borderTop: "1px solid var(--rule)", paddingTop: 12 }}>
          <span className="muted">Allocated</span>
          <span className="mono" style={{ fontWeight: 600, color: total === 100 ? "var(--ink)" : "var(--bad)" }}>
            {total} / 100
          </span>
        </div>
        {total !== 100 && (
          <p className="small muted" style={{ marginTop: 8 }}>
            Only the ratios between topics matter, so any total scores correctly. The counter is here to show
            you how lopsided the allocation has become.
          </p>
        )}
        {!even && (
          <button className="chip" style={{ marginTop: 10 }} onClick={() => setWeights({ ...DEFAULT_WEIGHTS })}>
            Reset to even
          </button>
        )}
        <p className="small muted" style={{ marginTop: 10 }}>
          Any single topic caps at 60, so some cross-pressure always survives. Weighting changes which
          parties you match; it never moves you on the grid.
        </p>
      </div>

      <Diagnostic
        text={F1.text}
        value={f1}
        onChange={setF1}
        note="Reported separately. Pro- versus anti-Netanyahu is currently the strongest single predictor of Israeli vote choice, and it is not an ideological dimension — folding it into the grid would be smuggling."
      />
      <Diagnostic
        text={F2.text}
        value={f2}
        onChange={setF2}
        note="Not scored at all. It only changes how your result is framed if your closest match sits across the bloc line from where you expected."
      />

      <button className="btn" onClick={onDone}>
        See results
      </button>
    </div>
  );
}
