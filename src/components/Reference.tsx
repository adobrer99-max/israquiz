import { CODING_NOTES, INSTRUMENT_NOTES, LIMITS, VERSION, VERSION_DATE } from "../data/editorial";
import { GLOSSARY } from "../data/glossary";
import { PARTIES, type PartyCode } from "../data/parties";
import { axisCollapses, coverageTable, itemDiagnostics } from "../lib/diagnostics";
import { BLOCKS } from "../data/items";

export function GlossaryPage({ focus }: { focus?: string }) {
  return (
    <div>
      {GLOSSARY.map((t) => (
        <div
          key={t.key}
          style={{
            padding: "12px 0",
            borderBottom: "1px solid var(--rule)",
            background: t.key === focus ? "var(--slip)" : undefined,
            margin: t.key === focus ? "0 -8px" : undefined,
            paddingLeft: t.key === focus ? 8 : undefined,
            paddingRight: t.key === focus ? 8 : undefined,
          }}
        >
          <h3 style={{ marginBottom: 4 }}>{t.title}</h3>
          <p className="small" style={{ margin: 0 }}>
            {t.body}
          </p>
        </div>
      ))}
    </div>
  );
}

export function EditorialNotes() {
  return (
    <div>
      <p className="small">
        {VERSION}, {VERSION_DATE}. Every coding below is a judgement that could be wrong, and these are the
        ones most likely to be. They are listed here rather than buried because accusations of bias are
        certain, and a visible record of the doubts answers them before they are made.
      </p>

      <h3 style={{ margin: "20px 0 8px" }}>What a result does and does not mean</h3>
      {LIMITS.map((l, i) => (
        <p className="small" key={i}>
          {l}
        </p>
      ))}

      <h3 style={{ margin: "22px 0 8px" }}>Known coding uncertainties</h3>
      {CODING_NOTES.map((n, i) => (
        <div className="row" key={i} style={{ display: "block" }}>
          <div className="mono tiny" style={{ color: n.severe ? "var(--bad)" : "var(--envelope)", marginBottom: 3 }}>
            {n.items}
            {n.severe && " · high risk"}
          </div>
          <div className="small">{n.issue}</div>
        </div>
      ))}

      <h3 style={{ margin: "22px 0 8px" }}>What the instrument itself cannot do</h3>
      {INSTRUMENT_NOTES.map((n, i) => (
        <div className="row" key={i} style={{ display: "block" }}>
          <div className="mono tiny" style={{ color: n.severe ? "var(--bad)" : "var(--envelope)", marginBottom: 3 }}>
            {n.items}
            {n.severe && " · unresolved"}
          </div>
          <div className="small">{n.issue}</div>
        </div>
      ))}
    </div>
  );
}

/** §4.7 — the validation checks, shown rather than described. */
export function Diagnostics() {
  const items = itemDiagnostics().sort((a, b) => a.discrimination - b.discrimination);
  const collapses = axisCollapses().filter((c) => c.parties.length > 2);
  const coverage = coverageTable();

  return (
    <div>
      <p className="small">
        Computed from the codings alone, every time this page opens. Response variance and item–axis
        correlation need live responses and are not available before launch.
      </p>

      <h3 style={{ margin: "18px 0 6px" }}>Weakest discriminators</h3>
      <p className="small muted">
        Two numbers per statement. <strong>Split</strong> is the share of party pairs it separates — low
        means most parties answer it the same way. <strong>Holds</strong> is the number of party pairs that
        would land on an identical axis coordinate if the statement were dropped. A low split with a
        non-zero hold is not a dead item: it is the only thing keeping two parties apart, and cutting it for
        low variance would undo exactly that.
      </p>
      {items.slice(0, 6).map((d) => (
        <div className="row" key={d.id} style={{ alignItems: "flex-start" }}>
          <span style={{ flex: 1, textAlign: "left", whiteSpace: "normal" }}>
            <span className="mono muted">{d.id}</span> {d.text}
          </span>
          <span className="mono" style={{ flex: "none", whiteSpace: "nowrap" }}>
            {d.discrimination.toFixed(2)}
            <span style={{ color: d.collapsesPrevented > 0 ? "var(--good)" : "var(--muted)" }}>
              {" "}
              · holds {d.collapsesPrevented}
            </span>
          </span>
        </div>
      ))}

      <h3 style={{ margin: "22px 0 6px" }}>Axis pile-ups</h3>
      <p className="small muted">
        Three or more ballot parties landing on an identical coordinate. Each one is a difference the axis
        cannot express. Both grid axes are now clear of these; what remains sits on the reported bars.
      </p>
      {collapses.map((c, i) => (
        <div className="row" key={i}>
          <span>
            {BLOCKS[c.block].label} at {c.value > 0 ? "+" : ""}
            {c.value}
          </span>
          <span className="mono">{c.parties.join(" · ")}</span>
        </div>
      ))}

      <h3 style={{ margin: "22px 0 6px" }}>Coverage</h3>
      <p className="small muted">
        Share of the 48 statements on which each party has a coded position. Below 70% a party is suppressed
        from the ranking and shown separately.
      </p>
      {coverage.map((r) => (
        <div className="row" key={r.code}>
          <span>
            {r.name}
            {!PARTIES[r.code as PartyCode].ballot && <span className="muted"> · component</span>}
          </span>
          <span className="mono" style={{ color: r.coverage < 0.7 ? "var(--bad)" : undefined }}>
            {Math.round(r.coverage * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}
