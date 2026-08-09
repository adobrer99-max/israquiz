import { BALLOT_PARTIES, PARTIES, type PartyCode } from "../data/parties";
import {
  AXIS_CONFIDENCE_FLOOR, COVERAGE_FLOOR, gridDistance, quadrantLabel,
  type ScoreResult,
} from "../lib/scoring";

const W = 360;
const H = 360;
/** Wide enough that the four pole labels live in the margin, clear of any marker. */
const PAD = 34;

const px = (v: number) => PAD + ((v + 100) / 200) * (W - 2 * PAD);
const py = (v: number) => PAD + ((100 - v) / 200) * (H - 2 * PAD);

interface Marker {
  code: PartyCode;
  x: number;
  y: number;
  low: boolean;
  dy: number;
}

/**
 * §4.6 grid. Parties whose coordinate rests on too few coded items are drawn
 * hollow rather than suppressed outright, and parties below the coverage floor
 * are left off entirely — a two-day-old party should not get a dot.
 */
function layout(result: ScoreResult): Marker[] {
  const markers: Marker[] = [];
  for (const code of BALLOT_PARTIES) {
    if (result.all[code].coverage < COVERAGE_FLOOR) continue;
    const ax = result.partyAxes[code];
    const low =
      ax.confidence.A < AXIS_CONFIDENCE_FLOOR || ax.confidence.B < AXIS_CONFIDENCE_FLOOR;
    markers.push({ code, x: px(ax.value.A), y: py(ax.value.B), low, dy: -9 });
  }
  // Nudge labels apart where dots coincide, so a pile-up stays readable.
  markers.forEach((m, i) => {
    const clashes = markers
      .slice(0, i)
      .filter((o) => Math.abs(o.x - m.x) < 26 && Math.abs(o.y - m.y) < 12);
    if (clashes.length) m.dy = clashes.length % 2 === 1 ? 17 : -9 - 11 * Math.ceil(clashes.length / 2);
  });
  return markers;
}

export function Grid({ result }: { result: ScoreResult }) {
  const markers = layout(result);
  const ux = px(result.user.value.A);
  const uy = py(result.user.value.B);
  const low = uy > H - PAD - 26;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto", background: "var(--slip)", border: "1px solid var(--rule)" }}
      role="img"
      aria-label={`Two-axis grid. You are at ${Math.round(result.user.value.A)} on the dove-to-hawk axis and ${Math.round(result.user.value.B)} on the secular-to-religious axis. A text version follows below.`}
    >
      <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} stroke="var(--rule)" />
      <line x1={W / 2} y1={PAD} x2={W / 2} y2={H - PAD} stroke="var(--rule)" />
      <g fontSize="8" fill="var(--muted)" fontFamily="monospace" letterSpacing="0.08em">
        <text x={3} y={H / 2 + 3}>DOVE</text>
        <text x={W - 3} y={H / 2 + 3} textAnchor="end">HAWK</text>
        <text x={W / 2} y={11} textAnchor="middle">RELIGIOUS</text>
        <text x={W / 2} y={H - 3} textAnchor="middle">SECULAR</text>
      </g>

      {markers.map((m) => (
        <g key={m.code}>
          <circle
            cx={m.x}
            cy={m.y}
            r="5"
            fill={m.low ? "var(--slip)" : PARTIES[m.code].color}
            stroke={PARTIES[m.code].color}
            strokeWidth={m.low ? 1.5 : 0}
            strokeDasharray={m.low ? "2 2" : undefined}
            opacity="0.92"
          />
          <text
            x={m.x}
            y={m.y + m.dy}
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="600"
            fill="var(--ink)"
            fontFamily="monospace"
            stroke="var(--slip)"
            strokeWidth="2.5"
            paintOrder="stroke"
          >
            {m.code}
          </text>
        </g>
      ))}

      <circle cx={ux} cy={uy} r="9" fill="none" stroke="var(--slip)" strokeWidth="4" />
      <circle cx={ux} cy={uy} r="9" fill="none" stroke="var(--ink)" strokeWidth="2" />
      <circle cx={ux} cy={uy} r="3" fill="var(--ink)" />
      {/* The user can land exactly on a party. Park the label clear of it. */}
      <text
        x={low ? ux + 14 : ux}
        y={low ? uy + 3 : uy + 23}
        textAnchor={low ? "start" : "middle"}
        fontSize="9"
        fontWeight="700"
        fill="var(--ink)"
        fontFamily="monospace"
        stroke="var(--slip)"
        strokeWidth="3"
        paintOrder="stroke"
      >
        YOU
      </text>
    </svg>
  );
}

/**
 * §8.10 — a scatter plot is unreadable to a screen reader, and the axis scores
 * already contain everything it displays. This is the same information as prose.
 */
export function GridTextEquivalent({ result }: { result: ScoreResult }) {
  const nearest = result.ranked
    .map((r) => ({ r, d: gridDistance(result.user, result.partyAxes[r.code]) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 4);

  return (
    <details>
      <summary>Text version of the grid</summary>
      <div style={{ marginTop: 10 }}>
        <p className="small">
          You sit at {Math.round(result.user.value.A)} on the dove-to-hawk axis and{" "}
          {Math.round(result.user.value.B)} on the secular-to-religious axis, both on a scale from −100 to
          +100 — {quadrantLabel(result.user.value.A, result.user.value.B)}.
        </p>
        <p className="small">Closest on the grid, nearest first:</p>
        {nearest.map(({ r, d }) => (
          <div className="row small" key={r.code}>
            <span>
              {r.name} — {Math.round(result.partyAxes[r.code].value.A)} security,{" "}
              {Math.round(result.partyAxes[r.code].value.B)} religion
            </span>
            <span className="mono muted">{Math.round(d)} away</span>
          </div>
        ))}
        <p className="small muted" style={{ marginTop: 10 }}>
          Grid distance and match percentage measure different things: the grid uses two topics, the match
          uses all five and applies your weighting. They will not always agree, and where they diverge the
          match is the more complete answer.
        </p>
      </div>
    </details>
  );
}
