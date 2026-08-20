import { useMemo, useRef, useState } from "react";
import { BLOCKS, BLOCK_IDS, CROSS_CUTTING, ITEMS } from "../data/items";
import { ELECTION } from "../data/editorial";
import { PARTIES, type PartyCode } from "../data/parties";
import {
  diagnosticSides, flatOpposition, NOISE_BAND, rankingsDisagree, reasonLine, unlikelyBedfellows,
  type Answers, type PartyResult, type ScoreResult, type Weights,
} from "../lib/scoring";
import { drawShareCard, downloadCanvas } from "../lib/shareCard";
import { Bar } from "./Bar";
import { Contribute, type ContributeProps } from "./Contribute";
import { Grid, GridTextEquivalent } from "./Grid";
import { Statement } from "./Statement";

const BLOC_ROWS: [keyof ScoreResult["blocs"], string][] = [
  ["pro", "Pro-Netanyahu bloc"],
  ["anti", "Anti-Netanyahu Zionist bloc"],
  ["non", "Non-aligned"],
];

const SIDE_LABEL = { agree: "Agree", neutral: "No clear position", disagree: "Disagree" } as const;

/**
 * Block G readout. These items are never scored, so the only honest thing to do
 * with them is show who lines up where. When the parties on one side span more
 * than one bloc, say so — that coincidence is the reason the item is in the bank.
 */
function CrossCutting({
  answers,
  onTerm,
}: {
  answers: Record<string, -1 | 0 | 1 | null>;
  onTerm: (key: string) => void;
}) {
  const asked = CROSS_CUTTING.filter((d) => answers[d.id] != null);
  if (!asked.length) return null;

  return (
    <>
      <h3 style={{ margin: "28px 0 6px" }}>Cuts that follow no axis</h3>
      <p className="small muted" style={{ marginBottom: 14 }}>
        None of these entered your match or your position on the grid. They are here because they divide the
        parties in orders the five topics cannot produce.
      </p>
      {asked.map((d) => {
        const u = answers[d.id]!;
        const sides = diagnosticSides(d.pos!);
        const mine = u > 0 ? sides.agree : u < 0 ? sides.disagree : sides.neutral;
        const key = u > 0 ? "agree" : u < 0 ? "disagree" : "neutral";
        const odd = unlikelyBedfellows(mine);
        return (
          <div key={d.id} style={{ borderTop: "1px solid var(--rule)", padding: "12px 0" }}>
            <p className="serif" style={{ fontSize: 16, lineHeight: 1.4, margin: "0 0 8px" }}>
              <Statement text={d.text} onTerm={onTerm} />
            </p>
            <p className="small" style={{ margin: "0 0 6px" }}>
              <span className="mono muted">{SIDE_LABEL[key]}</span> — with you:{" "}
              {mine.length ? mine.map((c) => PARTIES[c].name).join(", ") : "no party on the ballot"}.
            </p>
            {odd && (
              <p className="small" style={{ margin: 0 }}>
                That side puts a party from the Netanyahu bloc alongside a non-aligned one — parties that
                agree on almost nothing else, and that arrive here for opposite reasons. No axis in this
                compass can produce that grouping, which is why the question is asked and not scored.
              </p>
            )}
          </div>
        );
      })}
    </>
  );
}

function MatchRow({ r, i, value }: { r: PartyResult; i: number; value: number }) {
  return (
    <div className={`match${i === 0 ? " lead" : ""}`}>
      <span className="rank">{i + 1}</span>
      <span className="swatch" style={{ background: r.color }} />
      <span className="body">
        <span style={{ fontSize: 15, fontWeight: 600, display: "block" }}>{r.name}</span>
        <span className="small muted">
          {r.lead}
          {r.belowThreshold && ` · ${r.thresholdNote ?? `polling below the ${ELECTION.threshold}% threshold`}`}
          {r.coverage < 1 && ` · ${Math.round(r.coverage * 100)}% coded`}
        </span>
      </span>
      <span className="pct">{Math.round(value)}%</span>
    </div>
  );
}

export function Results({
  result,
  answers,
  weights,
  f1,
  f2,
  g,
  declared,
  validation,
  onTerm,
  onDemographics,
  onRestart,
  payload,
  contribute,
}: {
  result: ScoreResult;
  answers: Answers;
  weights: Weights;
  f1: -1 | 0 | 1 | null;
  f2: -1 | 0 | 1 | null;
  g: Record<string, -1 | 0 | 1 | null>;
  declared: string;
  validation: boolean;
  onTerm: (key: string) => void;
  onDemographics: () => void;
  onRestart: () => void;
  payload: string;
  /** absent when the build has no collection endpoint — then nothing can be sent at all */
  contribute?: ContributeProps;
}) {
  const [weighted, setWeighted] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const key = weighted ? "weighted" : "unweighted";
  const list = useMemo(
    () => [...result.ranked].sort((a, b) => b[key] - a[key]),
    [result.ranked, key],
  );
  const top = list[0];

  const isKnownParty = validation && declared && !["UNDECIDED", "NOVOTE"].includes(declared);
  const declaredRow = isKnownParty ? list.find((r) => r.code === declared) : undefined;
  const declaredRank = declaredRow ? list.indexOf(declaredRow) + 1 : null;

  const opposition = useMemo(
    () => (isKnownParty ? flatOpposition(declared as PartyCode, answers) : []),
    [isKnownParty, declared, answers],
  );

  const tight = list.length > 2 && Math.abs(list[0][key] - list[2][key]) < NOISE_BAND;
  const disagree = rankingsDisagree(result);
  const reason = top ? reasonLine(top) : null;

  const blocOrder = [...BLOC_ROWS].sort((a, b) => result.blocs[b[0]] - result.blocs[a[0]]);
  const leadBloc = blocOrder[0];
  const f1Points: "pro" | "anti" | null = f1 === null ? null : f1 > 0 ? "pro" : f1 < 0 ? "anti" : null;
  const crossPressure =
    f1Points !== null && leadBloc[0] !== "non" && leadBloc[0] !== f1Points;

  const share = () => {
    const c = canvasRef.current;
    if (!c) return;
    drawShareCard(c, result, list, weighted);
    downloadCanvas(c, "israel-2026-compass.png");
  };

  if (!top) {
    return (
      <div className="card">
        <p>No party cleared the coverage floor, which should be impossible. Please start over.</p>
        <button className="btn" onClick={onRestart}>
          Start over
        </button>
      </div>
    );
  }

  return (
    <div>
      {isKnownParty && (
        <div className={`callout ${declaredRank === 1 ? "good" : declaredRank && declaredRank <= 3 ? "warn" : "bad"}`}>
          <span className="eyebrow" style={{ color: "var(--muted)" }}>
            Validation check
          </span>
          <p style={{ fontSize: 19, fontWeight: 700, margin: "8px 0 6px", lineHeight: 1.3 }}>
            {declaredRank === 1
              ? `Recovered — ${PARTIES[declared as PartyCode].name} came first.`
              : declaredRank
                ? `Missed — ${PARTIES[declared as PartyCode].name} ranked ${declaredRank}.`
                : `${PARTIES[declared as PartyCode].name} was suppressed for low coverage.`}
          </p>
          <p className="small muted" style={{ margin: 0 }}>
            Top match {top.name} at {Math.round(top[key])}%
            {declaredRow &&
              ` · your party at ${Math.round(declaredRow[key])}% (${
                top[key] - declaredRow[key] > 0 ? "−" : "+"
              }${Math.abs(Math.round(top[key] - declaredRow[key]))} pts)`}
          </p>
        </div>
      )}

      <div className="topbar no-print">
        <span className="eyebrow">Closest matches</span>
        <button className="chip" aria-pressed={weighted} onClick={() => setWeighted(!weighted)}>
          {weighted ? "Weighted by your topics" : "Unweighted"} ↔
        </button>
      </div>

      {list.slice(0, 3).map((r, i) => (
        <MatchRow key={r.code} r={r} i={i} value={r[key]} />
      ))}

      {tight && (
        <p className="small" style={{ color: "var(--bad)", marginTop: 8 }}>
          These three are within {NOISE_BAND} points of each other. Treat the order between them as noise —
          the instrument cannot resolve differences that small.
        </p>
      )}
      {reason && (
        <p className="small" style={{ marginTop: 8 }}>
          {reason}
        </p>
      )}
      {top.belowThreshold && (
        <p className="small" style={{ marginTop: 8 }}>
          Your closest match is at risk of the {ELECTION.threshold}% electoral threshold
          {top.thresholdNote ? ` — ${top.thresholdNote}` : ""}. A party that falls short takes no seats and
          its votes are discarded, which is worth knowing before the percentage above becomes advice.
        </p>
      )}
      {disagree && (
        <p className="small" style={{ marginTop: 8 }}>
          Your weighting changed the answer: weighted and unweighted rankings have different parties on top.
          Use the toggle above — the gap between them is the most interesting thing on this page, and hiding
          it would invite the charge that the weighting is doing all the work.
        </p>
      )}

      <details style={{ marginTop: 14 }}>
        <summary>Full ranking, coverage and the parties left out</summary>
        <div style={{ marginTop: 10 }}>
          {list.slice(3).map((r) => (
            <div className="row" key={r.code}>
              <span>
                {r.name}
                {r.belowThreshold && <span className="muted"> · below threshold</span>}
              </span>
              <span className="mono">{Math.round(r[key])}%</span>
            </div>
          ))}

          {result.lowCoverage.length > 0 && (
            <>
              <p className="tiny muted" style={{ margin: "14px 0 6px" }}>
                Insufficient position data — too few stated positions to score fairly, so these are excluded
                from the ranking rather than allowed to win it:
              </p>
              {result.lowCoverage.map((r) => (
                <div className="row muted" key={r.code}>
                  <span>{r.name}</span>
                  <span className="mono">{Math.round(r.coverage * 100)}% coded</span>
                </div>
              ))}
            </>
          )}

          <p className="tiny muted" style={{ margin: "14px 0 6px" }}>
            Inside the Joint List. You cannot vote for these separately, but your answers can still sit
            closer to one than the other:
          </p>
          {result.components.map((r) => (
            <div className="row muted" key={r.code}>
              <span>{r.name}</span>
              <span className="mono">{Math.round(r[key])}%</span>
            </div>
          ))}
          {result.components.length === 2 &&
            Math.abs(result.components[0][key] - result.components[1][key]) >= 3 && (
              <p className="small" style={{ marginTop: 8 }}>
                Your answers put you closer to {result.components[0].name} than to{" "}
                {result.components[1].name}, though they share a ballot line.
              </p>
            )}
        </div>
      </details>

      <h3 style={{ margin: "28px 0 12px" }}>Where you sit</h3>
      <Grid result={result} />
      <p className="grid-note">
        Parties state positions flatly; most people hedge. That is why the parties spread wider than you do —
        it is a property of how manifestos are written, not a claim that you are a moderate. Hollow markers
        rest on too few coded items to be trusted. Parties below {Math.round(0.7 * 100)}% coverage are left
        off entirely.
      </p>
      <GridTextEquivalent result={result} />

      <h3 style={{ margin: "26px 0 12px" }}>All five topics</h3>
      {BLOCK_IDS.map((b) => (
        <div key={b}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            {BLOCKS[b].label}
            {result.user.confidence[b] < 1 && (
              <span className="muted small"> · {Math.round(result.user.confidence[b] * 100)}% answered</span>
            )}
          </div>
          <Bar value={result.user.value[b]} neg={BLOCKS[b].neg} pos={BLOCKS[b].pos} />
        </div>
      ))}

      <h3 style={{ margin: "22px 0 10px" }}>Bloc affinity</h3>
      {BLOC_ROWS.map(([k, label]) => (
        <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
          <span className="small" style={{ width: 132, flex: "none", lineHeight: 1.25 }}>
            {label}
          </span>
          <span style={{ flex: 1, height: 8, background: "var(--well)" }}>
            <span
              style={{ display: "block", height: 8, width: `${result.blocs[k]}%`, background: "var(--envelope)" }}
            />
          </span>
          <span className="mono small" style={{ width: 34, textAlign: "right" }}>
            {Math.round(result.blocs[k])}%
          </span>
        </div>
      ))}
      <p className="small muted" style={{ marginTop: 10 }}>
        Mean match across the parties in each bloc, using your weighting. Ra'am and the Joint List are scored
        as ballot entities here; Unity and the Haredi Public Party belong to no bloc and are excluded.
      </p>
      {f1 !== null && (
        <p className="small" style={{ marginTop: 8 }}>
          You {f1 > 0 ? "agree" : f1 < 0 ? "disagree" : "are neutral on"} that Netanyahu should continue as
          prime minister. That is reported here rather than folded into the scores, because it is not an
          ideological position — it is currently the strongest single predictor of Israeli vote choice, which
          is exactly why it does not belong on an ideological grid.
        </p>
      )}
      {crossPressure && (
        <p className="small" style={{ marginTop: 8 }}>
          Your issue positions sit closest to the {leadBloc[1].toLowerCase()}, while your answer on Netanyahu
          points the other way. That tension is real and common, and it is the thing a compass is worst at
          resolving — coalition politics here sorts on a question this instrument deliberately keeps out of
          the scoring.
          {f2 !== null && f2 > 0 && " You also said you would prefer a broad unity government, which is one way that tension gets resolved in practice."}
        </p>
      )}

      <CrossCutting answers={g} onTerm={onTerm} />

      {isKnownParty && opposition.length > 0 && (
        <>
          <h3 style={{ margin: "28px 0 6px" }}>
            Where you break with {PARTIES[declared as PartyCode].name}
          </h3>
          <p className="small muted" style={{ marginBottom: 12 }}>
            Flat opposition, not shades of difference. If any of these look wrong to you, the coding is
            probably wrong — that is the most useful thing you can send back.
          </p>
          {opposition.map((m) => (
            <div className="row" key={m.id} style={{ alignItems: "flex-start" }}>
              <span className="mono muted" style={{ minWidth: 30 }}>
                {m.id}
              </span>
              <span style={{ flex: 1, textAlign: "left" }}>
                <Statement text={m.text} onTerm={onTerm} />
              </span>
            </div>
          ))}
        </>
      )}

      {result.skippedCount > 0 && (
        <p className="small muted" style={{ marginTop: 22 }}>
          You skipped {result.skippedCount} of {ITEMS.length} statements. Those are excluded from every
          calculation above rather than counted as neutral, so your percentages rest on{" "}
          {result.answeredCount} answers.
        </p>
      )}

      <h3 style={{ margin: "28px 0 10px" }}>Take it with you</h3>
      <div className="btn-row no-print" style={{ marginBottom: 10 }}>
        <button className="btn" onClick={share}>
          Share card
        </button>
        <button className="btn-ghost" onClick={onDemographics}>
          Optional questions
        </button>
      </div>
      <p className="small muted">
        The share card carries its own caveat, because a screenshot travels without this page around it.
      </p>
      <canvas ref={canvasRef} style={{ display: "none" }} aria-hidden="true" />

      {contribute && <Contribute {...contribute} />}

      <details style={{ marginTop: 14 }} className="no-print">
        <summary>Your raw answers, as data</summary>
        <div style={{ marginTop: 10 }}>
          <p className="small muted">
            Everything the scoring used
            {contribute
              ? ", including the background answers if you gave any. Copying it here sends it nowhere; that is what the section above is for."
              : ". Nothing was sent anywhere — copy it out yourself if you want to keep or share it."}
          </p>
          <textarea readOnly value={payload} rows={10} onFocus={(e) => e.currentTarget.select()} />
          <button className="btn-ghost" style={{ marginTop: 8 }} onClick={() => navigator.clipboard?.writeText(payload)}>
            Copy to clipboard
          </button>
        </div>
      </details>

      <button className="btn-ghost no-print" style={{ marginTop: 10 }} onClick={onRestart}>
        Start over
      </button>

      <p className="small muted" style={{ marginTop: 16 }}>
        Weighting: {BLOCK_IDS.map((b) => `${BLOCKS[b].short} ${weights[b]}`).join(" · ")}.
      </p>
    </div>
  );
}
