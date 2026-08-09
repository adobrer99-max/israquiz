import { annotate } from "../data/glossary";

/** Statement text with glossary terms tappable inline (§5, §8.10). */
export function Statement({ text, onTerm }: { text: string; onTerm: (key: string) => void }) {
  return (
    <>
      {annotate(text).map((part, i) =>
        part.term ? (
          <button
            key={i}
            className="term"
            onClick={() => onTerm(part.term!)}
            aria-label={`${part.text} — what this means`}
          >
            {part.text}
          </button>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}
