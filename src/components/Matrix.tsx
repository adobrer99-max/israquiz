import { Fragment } from "react";
import { BLOCKS, BLOCK_IDS, DIAGNOSTICS, INFERRED, ITEMS_BY_BLOCK, JL_MERGE_FLAGS, type Position } from "../data/items";
import { PARTIES, type PartyCode } from "../data/parties";

/**
 * §8.6 — publish the full coding matrix alongside the quiz. It is the only
 * thing that makes a result auditable, and it turns the biggest liability
 * into the strongest credibility claim.
 */
const COLUMNS: PartyCode[] = [
  "LIK", "TOG", "YSH", "SHS", "UTJ", "HPP", "OTZ", "RZ", "NOAM", "YB", "DEM", "BW",
  "UNI", "RAM", "JL", "HTA", "BAL",
];

/** Built once: overlay columns whose cells rest on reasoning, not a platform. */
const INFERRED_SETS: Partial<Record<PartyCode, Set<string>>> = Object.fromEntries(
  Object.entries(INFERRED).map(([code, ids]) => [code, new Set(ids)]),
);

const cls = (p: Position) =>
  p === "A" ? "cell-A" : p === "D" ? "cell-D" : p === "N" ? "cell-N" : "cell-none";

export function Matrix() {
  return (
    <div>
      <p className="small">
        Every cell the scoring uses, exactly as the engine reads it.{" "}
        <span className="cell-A">A</span> agree · <span className="cell-N">N</span> neutral or
        deliberately ambiguous · <span className="cell-D">D</span> disagree ·{" "}
        <span className="cell-none">–</span> no position on record, excluded from that party's
        denominator. The ± column is the item's polarity on its axis.
      </p>
      <p className="small muted">
        Hadash–Ta'al and Balad are components of the Joint List, not ballot entities. Their columns are
        published because the merge rule that produces the JL column is a judgement call, and you should be
        able to check it. The alliance is confirmed, so that judgement is now a permanent feature of the
        ballot rather than a provisional one — which makes the flagged cells below worth checking rather
        than worth waiting on.
      </p>

      <div className="scroller">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>±</th>
              {COLUMNS.map((c) => (
                <th key={c} title={PARTIES[c].name}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BLOCK_IDS.map((b) => (
              <Fragment key={b}>
                <tr>
                  <td colSpan={COLUMNS.length + 2} style={{ background: "var(--well)", fontWeight: 700, fontSize: 11 }}>
                    {BLOCKS[b].label} — {BLOCKS[b].neg} ↔ {BLOCKS[b].pos}
                  </td>
                </tr>
                {ITEMS_BY_BLOCK[b].map((it) => (
                  <tr key={it.id}>
                    <td className="mono">{it.id}</td>
                    <td className="mono muted">{it.sign > 0 ? "+" : "−"}</td>
                    {COLUMNS.map((c) => (
                      <td key={c} className={`mono ${cls(it.pos[c])}`}>
                        {it.pos[c] === "-" ? "–" : it.pos[c]}
                        {c === "JL" && JL_MERGE_FLAGS[it.id] === "component" && (
                          <span className="muted" title="One component coded, the other silent">*</span>
                        )}
                        {c === "JL" && JL_MERGE_FLAGS[it.id] === "divergent" && (
                          <span className="muted" title="Components disagreed; resolved to the less committal value">†</span>
                        )}
                        {INFERRED_SETS[c]?.has(it.id) && (
                          <span className="muted" title="Inferred from the party's own framing, not stated by it">‡</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
            <tr>
              <td colSpan={COLUMNS.length + 3} style={{ background: "var(--well)", fontWeight: 700, fontSize: 11 }}>
                Diagnostic and cross-cutting — never enters the axes or the match
              </td>
            </tr>
            {DIAGNOSTICS.filter((d) => d.pos).map((d) => (
              <tr key={d.id}>
                <td className="mono">{d.id}</td>
                <td className="mono muted">·</td>
                {COLUMNS.map((c) => (
                  <td key={c} className={`mono ${cls(d.pos![c])}`}>
                    {d.pos![c] === "-" ? "–" : d.pos![c]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ margin: "20px 0 4px" }}>The statements</h3>
      {BLOCK_IDS.map((b) => (
        <Fragment key={b}>
          <div className="eyebrow" style={{ margin: "14px 0 6px" }}>
            {BLOCKS[b].label}
          </div>
          {ITEMS_BY_BLOCK[b].map((it) => (
            <div className="row" key={it.id} style={{ alignItems: "flex-start" }}>
              <span className="mono muted" style={{ minWidth: 34, flex: "none" }}>
                {it.id}
              </span>
              <span style={{ flex: 1, textAlign: "left", whiteSpace: "normal" }}>{it.text}</span>
            </div>
          ))}
        </Fragment>
      ))}
      <div className="eyebrow" style={{ margin: "14px 0 6px" }}>
        Diagnostic and cross-cutting — never scored
      </div>
      {DIAGNOSTICS.map((d) => (
        <div className="row" key={d.id} style={{ alignItems: "flex-start" }}>
          <span className="mono muted" style={{ minWidth: 34, flex: "none" }}>
            {d.id}
          </span>
          <span style={{ flex: 1, textAlign: "left", whiteSpace: "normal" }}>{d.text}</span>
        </div>
      ))}

      <p className="small muted" style={{ marginTop: 12 }}>
        <span className="muted">*</span> one Joint List component coded, the other silent — a component
        position, not a list position. <span className="muted">†</span> components diverged; resolved to the
        less committal value rather than inventing a consensus. Almost every flagged cell falls in
        religion-and-state or economics, which is the shape of that alliance: unified on the questions that
        define it, a coalition of conveniences elsewhere. The exception is A13, added after validation — it
        is the first security item to divide the components, and the unity the merge appeared to show on
        security was partly an artefact of what the bank had not yet asked.
      </p>
      <p className="small muted" style={{ marginTop: 10 }}>
        <span className="muted">‡</span> inferred: the cell rests on reasoning from what the party is,
        rather than on something it has said. These are listed rather than summarised so you can disagree
        with a specific one — the reasoning behind each set is in the editorial notes. Three columns carry
        them, all of them parties too new or too narrow to have published much: Unity, the Haredi Public
        Party and Noam. A column with many of these is a column to distrust, which is the point of marking
        them at all.
      </p>
    </div>
  );
}
