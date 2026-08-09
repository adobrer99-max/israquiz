import { useCallback, useEffect } from "react";
import { BLOCKS, type Item } from "../data/items";
import type { Answer } from "../lib/scoring";
import { Statement } from "./Statement";

/** §1 — five points plus an escape hatch that leaves the item out of every calculation. */
export const SCALE: { v: Exclude<Answer, null>; label: string; key: string }[] = [
  { v: -2, label: "Strongly disagree", key: "1" },
  { v: -1, label: "Somewhat disagree", key: "2" },
  { v: 0, label: "Neutral", key: "3" },
  { v: 1, label: "Somewhat agree", key: "4" },
  { v: 2, label: "Strongly agree", key: "5" },
];

export function Question({
  item,
  index,
  total,
  value,
  onAnswer,
  onBack,
  onTerm,
}: {
  item: Item;
  index: number;
  total: number;
  value: Answer | undefined;
  onAnswer: (v: Answer) => void;
  onBack: () => void;
  onTerm: (key: string) => void;
}) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const hit = SCALE.find((s) => s.key === e.key);
      if (hit) onAnswer(hit.v);
      else if (e.key === "0") onAnswer(null);
      else if (e.key === "Backspace" && index > 0) {
        e.preventDefault();
        onBack();
      }
    },
    [onAnswer, onBack, index],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <div>
      <div className="topbar">
        <span className="eyebrow">{BLOCKS[item.block].label}</span>
        <span className="mono tiny muted">
          {index + 1} / {total}
        </span>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label="Progress through the statements"
      >
        <div style={{ width: `${(index / total) * 100}%` }} />
      </div>

      <div className="statement">
        <span className="ident" aria-hidden="true">
          {item.id}
        </span>
        <p>
          <Statement text={item.text} onTerm={onTerm} />
        </p>
      </div>

      <div className="stack" role="group" aria-label="Your response">
        {SCALE.map((s) => (
          <button
            key={s.v}
            className="answer"
            aria-pressed={value === s.v}
            onClick={() => onAnswer(s.v)}
          >
            <span className="key" aria-hidden="true">
              {s.key}
            </span>
            {s.label}
          </button>
        ))}
        <div className="btn-row" style={{ marginTop: 4 }}>
          <button
            className="answer answer-skip"
            aria-pressed={value === null}
            onClick={() => onAnswer(null)}
          >
            <span className="key" aria-hidden="true">
              0
            </span>
            No opinion — skip
          </button>
          {index > 0 && (
            <button className="btn-ghost" style={{ flex: "0 0 88px" }} onClick={onBack}>
              Back
            </button>
          )}
        </div>
      </div>

      <p className="small muted" style={{ marginTop: 14 }}>
        Keys 1–5 to answer, 0 to skip, backspace to go back. Skipped statements are left out of every
        calculation rather than counted as neutral.
      </p>
    </div>
  );
}
