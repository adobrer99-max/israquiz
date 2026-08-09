export function Bar({
  value,
  neg,
  pos,
  color,
}: {
  value: number;
  neg: string;
  pos: string;
  color?: string;
}) {
  const left = ((value + 100) / 200) * 100;
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="bar-head">
        <span>{neg}</span>
        <span style={{ color: "var(--ink)", fontWeight: 600 }}>
          {value > 0 ? "+" : ""}
          {Math.round(value)}
        </span>
        <span>{pos}</span>
      </div>
      <div className="bar-track">
        <div className="bar-mid" />
        <div
          className="bar-dot"
          style={{ left: `calc(${left}% - 6px)`, background: color ?? "var(--envelope)" }}
        />
      </div>
    </div>
  );
}
