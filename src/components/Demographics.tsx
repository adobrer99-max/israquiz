import { CONSENT, visibleQuestions, type Demographics as D } from "../data/demographics";
import { collectionEnabled } from "../lib/collect";

/**
 * §6 — shown after results, never before and never as a gate.
 * "Skip all" sits at the same visual weight as submit, because gating a
 * result behind demographics converts a voluntary disclosure into a toll
 * and poisons the data: people who resent paying it answer carelessly.
 */
export function Demographics({
  value,
  setValue,
  onDone,
  onSkip,
}: {
  value: D;
  setValue: (d: D) => void;
  onDone: () => void;
  onSkip: () => void;
}) {
  const questions = visibleQuestions(value);

  const toggle = (id: string, option: string, multi: boolean) => {
    if (!multi) {
      setValue({ ...value, [id]: value[id] === option ? "" : option });
      return;
    }
    const current = Array.isArray(value[id]) ? (value[id] as string[]) : [];
    const next = current.includes(option)
      ? current.filter((x) => x !== option)
      : [...current, option];
    setValue({ ...value, [id]: next });
  };

  const isOn = (id: string, option: string) => {
    const v = value[id];
    return Array.isArray(v) ? v.includes(option) : v === option;
  };

  const answered = questions.filter((q) => {
    const v = value[q.id];
    return Array.isArray(v) ? v.length > 0 : !!v;
  }).length;

  return (
    <div>
      <span className="eyebrow">Optional · after the result, not before it</span>
      <h2 style={{ margin: "10px 0 8px" }}>A few questions about you</h2>
      <p className="small muted">{collectionEnabled() ? CONSENT.collected : CONSENT.local}</p>

      <div className="card" style={{ marginTop: 18 }}>
        {questions.map((q) => (
          <div className="demo-q" key={q.id}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{q.label}</div>
            {q.help && (
              <p className="small muted" style={{ margin: "4px 0 0" }}>
                {q.help}
              </p>
            )}
            <div className="opts" role="group" aria-label={q.label}>
              {q.options.map((o) => (
                <button
                  key={o}
                  className="opt"
                  aria-pressed={isOn(q.id, o)}
                  onClick={() => toggle(q.id, o, !!q.multi)}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="btn-row">
        <button className="btn" onClick={onDone}>
          Done{answered > 0 ? ` · ${answered} answered` : ""}
        </button>
        <button className="btn" style={{ background: "var(--muted)" }} onClick={onSkip}>
          Skip all
        </button>
      </div>

      <p className="small muted" style={{ marginTop: 14 }}>
        These answers are stored on this device under a random response id, separately from your statement
        answers. Joining a full answer vector to a full demographic vector is a fingerprint even with no name
        attached, which is why the export keeps them as two tables.
      </p>
    </div>
  );
}
