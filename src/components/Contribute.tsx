import { useMemo, useState } from "react";
import {
  RETENTION_MONTHS, sendSubmission, sendWithdrawal, type Submission,
} from "../lib/collect";

/**
 * §6.5 — the only control in the app that transmits anything.
 *
 * Three things it has to get right, and each of them costs a click:
 *  · Consent is explicit and unticked by default. Special-category data
 *    cannot be collected on an implied basis or a pre-ticked box.
 *  · Consent to the statement answers and to the background block are
 *    separate. Someone can contribute their politics without contributing
 *    their religion and ethnicity.
 *  · Exactly what will be sent is shown before it is sent, not described.
 */
export interface ContributeProps {
  build: (includeDemographics: boolean) => Submission;
  responseId: string;
  hasDemographics: boolean;
  submittedAt: string | null;
  onSubmitted: (at: string | null) => void;
}

type Phase = "idle" | "sending" | "error";

export function Contribute({
  build,
  responseId,
  hasDemographics,
  submittedAt,
  onSubmitted,
}: ContributeProps) {
  const [consented, setConsented] = useState(false);
  const [includeDemo, setIncludeDemo] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(
    () => JSON.stringify(build(includeDemo && hasDemographics), null, 1),
    [build, includeDemo, hasDemographics],
  );

  const send = async () => {
    setPhase("sending");
    setError(null);
    const payload = build(includeDemo && hasDemographics);
    const res = await sendSubmission(payload);
    if (res.ok) {
      setPhase("idle");
      onSubmitted(payload.consent.at);
    } else {
      setPhase("error");
      setError(res.error ?? "The submission failed.");
    }
  };

  const withdraw = async () => {
    setPhase("sending");
    setError(null);
    const res = await sendWithdrawal(responseId);
    if (res.ok) {
      setPhase("idle");
      onSubmitted(null);
    } else {
      setPhase("error");
      setError(res.error ?? "The withdrawal failed. Your response is still stored.");
    }
  };

  if (submittedAt) {
    return (
      <>
        <h3 style={{ margin: "28px 0 10px" }}>Contributed to the research</h3>
        <div className="callout good">
          <p style={{ margin: "0 0 8px", fontSize: 15 }}>
            Sent on {new Date(submittedAt).toLocaleDateString()}, under the reference below. It carries no
            name and nothing that identifies you.
          </p>
          <p className="mono small" style={{ margin: 0, wordBreak: "break-all" }}>{responseId}</p>
        </div>
        <p className="small muted">
          You can take it back at any point, from this device, with no email and no explanation. Doing so
          deletes both rows — the answers and, if you sent them, the background questions.
          {hasDemographics &&
            " If you answered the background questions after sending, withdraw and send again to include them."}
        </p>
        <button
          className="btn-ghost no-print"
          style={{ marginTop: 8 }}
          onClick={withdraw}
          disabled={phase === "sending"}
        >
          {phase === "sending" ? "Withdrawing…" : "Withdraw my response"}
        </button>
        {error && (
          <p className="small" style={{ color: "var(--bad)", marginTop: 8 }}>
            {error}
          </p>
        )}
      </>
    );
  }

  return (
    <>
      <h3 style={{ margin: "28px 0 10px" }}>Contribute your answers to the research</h3>

      <div className="card no-print">
        <p className="small">
          This compass is a research instrument, not a commercial product. Contributed responses are used to
          study how the items behave and how positions distribute — which statements actually discriminate,
          how respondents cluster, how recalled 2022 vote relates to where people land. Nothing is sold,
          nothing is passed to a campaign or a party, and there is no advertising anywhere in it.
        </p>
        <p className="small">
          <strong>What is stored:</strong> your answers to the statements, your topic weighting, the
          unscored questions, your grid position and the resulting ranking, and the order the statements
          were shown in. Optionally, and only if you tick the second box, the background questions you
          answered after your result.
        </p>
        <p className="small">
          <strong>What is not stored:</strong> your name, your email, any cookie or identifier that
          follows you between sites, and — in validation runs — the initials you typed on the first
          screen. No IP address is recorded in the research database; the host handles one in transit to
          route the request, the way every web server does, and nothing keeps it afterwards. The answers
          and the background questions are written to two separate tables joined only by the random
          reference above. No file joining a full answer vector to a full background vector will be
          published, and no figure resting on fewer than 30 respondents will be reported.
        </p>
        <p className="small">
          <strong>How long:</strong> {RETENTION_MONTHS} months from submission, then deleted. You can
          withdraw before that from this device, at one click, with no email and no explanation.
        </p>
        <p className="small">
          <strong>What it is not:</strong> a poll. Anyone who reaches this page can answer it, so the people
          who do are not a sample of the Israeli electorate and no aggregate of them will be described as
          one.
        </p>

        <label className="consent">
          <input
            type="checkbox"
            checked={consented}
            onChange={(e) => setConsented(e.target.checked)}
          />
          <span className="small">
            I consent to my statement answers being stored and used for the research described above. I
            understand they record political opinions, and that I can withdraw them at any time.
          </span>
        </label>

        {hasDemographics && (
          <label className="consent">
            <input
              type="checkbox"
              checked={includeDemo}
              onChange={(e) => setIncludeDemo(e.target.checked)}
            />
            <span className="small">
              Also include the optional background questions I answered. I understand these can include
              religion, observance and community background, and that I do not have to send them to send
              the rest.
            </span>
          </label>
        )}

        <details style={{ marginTop: 12 }}>
          <summary>Show me exactly what would be sent</summary>
          <textarea readOnly value={preview} rows={10} style={{ marginTop: 8 }} />
        </details>

        <button
          className="btn"
          style={{ marginTop: 14 }}
          disabled={!consented || phase === "sending"}
          onClick={send}
        >
          {phase === "sending" ? "Sending…" : "Send my response"}
        </button>

        {error && (
          <p className="small" style={{ color: "var(--bad)", marginTop: 10 }}>
            {error}
          </p>
        )}

        <p className="tiny muted" style={{ marginTop: 12, marginBottom: 0 }}>
          Skipping this changes nothing about your result. If you send nothing, nothing about this session
          ever leaves the device.
        </p>
      </div>
    </>
  );
}
