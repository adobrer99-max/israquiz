/* ============================================================
   Share card — spec §8, "Share cards"
   Assume every result gets screenshotted and posted without the
   surrounding page. Whatever caveat matters most therefore has
   to live on the generated image, not beside it.
   ============================================================ */

import { ELECTION, VERSION } from "../data/editorial";
import type { PartyResult, ScoreResult } from "./scoring";

const W = 1200;
const H = 630;

const INK = "#131a2b";
const PAPER = "#f1f2ed";
const SLIP = "#fbfbf7";
const RULE = "#c9cbc4";
const MUTED = "#6b7180";
const ENVELOPE = "#1e4b8f";

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > max && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function drawShareCard(
  canvas: HTMLCanvasElement,
  result: ScoreResult,
  top: PartyResult[],
  weighted: boolean,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = W;
  canvas.height = H;

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = ENVELOPE;
  ctx.fillRect(0, 0, 10, H);

  ctx.fillStyle = ENVELOPE;
  ctx.font = "600 20px 'IBM Plex Mono', monospace";
  ctx.fillText("ISRAEL 2026 ELECTION COMPASS", 56, 66);

  ctx.fillStyle = MUTED;
  ctx.font = "400 18px 'IBM Plex Mono', monospace";
  ctx.fillText(`${ELECTION.knesset}TH KNESSET · ${ELECTION.date.toUpperCase()}`, 56, 94);

  // --- ranking ---
  ctx.fillStyle = INK;
  ctx.font = "700 30px Archivo, system-ui, sans-serif";
  ctx.fillText("Closest matches", 56, 156);

  let y = 196;
  top.slice(0, 3).forEach((r, i) => {
    ctx.fillStyle = SLIP;
    ctx.fillRect(56, y, 640, 78);
    ctx.strokeStyle = i === 0 ? INK : RULE;
    ctx.lineWidth = i === 0 ? 2 : 1;
    ctx.strokeRect(56, y, 640, 78);

    ctx.fillStyle = r.color;
    ctx.fillRect(56, y, 8, 78);

    ctx.fillStyle = MUTED;
    ctx.font = "700 26px 'IBM Plex Mono', monospace";
    ctx.fillText(String(i + 1), 82, y + 50);

    ctx.fillStyle = INK;
    ctx.font = "600 26px Archivo, system-ui, sans-serif";
    const name = r.name.length > 26 ? `${r.name.slice(0, 25)}…` : r.name;
    ctx.fillText(name, 118, y + 42);

    ctx.fillStyle = MUTED;
    ctx.font = "400 16px Archivo, system-ui, sans-serif";
    ctx.fillText(r.belowThreshold ? `${r.lead} · polling below the 3.25% threshold` : r.lead, 118, y + 64);

    ctx.fillStyle = INK;
    ctx.font = "700 32px 'IBM Plex Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText(`${Math.round(weighted ? r.weighted : r.unweighted)}%`, 676, y + 52);
    ctx.textAlign = "left";

    y += 90;
  });

  // --- axis readout ---
  const bx = 740;
  ctx.fillStyle = INK;
  ctx.font = "700 22px Archivo, system-ui, sans-serif";
  ctx.fillText("Where you sit", bx, 156);

  const axes: [string, string, string, number][] = [
    ["Dove", "Hawk", "Security", result.user.value.A],
    ["Secular", "Religious", "Religion & state", result.user.value.B],
    ["Parliament", "Courts", "Institutions", result.user.value.C],
    ["Ethnonational", "Civic", "Identity", result.user.value.D],
    ["Market", "Social-dem", "Economy", result.user.value.E],
  ];

  let ay = 190;
  for (const [neg, pos, label, v] of axes) {
    ctx.fillStyle = INK;
    ctx.font = "600 15px Archivo, system-ui, sans-serif";
    ctx.fillText(label, bx, ay);
    ctx.fillStyle = MUTED;
    ctx.font = "400 12px 'IBM Plex Mono', monospace";
    ctx.fillText(neg, bx, ay + 40);
    ctx.textAlign = "right";
    ctx.fillText(pos, bx + 384, ay + 40);
    ctx.textAlign = "left";

    ctx.fillStyle = "#dfe1db";
    ctx.fillRect(bx, ay + 12, 384, 6);
    ctx.fillStyle = RULE;
    ctx.fillRect(bx + 192, ay + 8, 1, 14);
    ctx.fillStyle = ENVELOPE;
    const cx = bx + ((v + 100) / 200) * 384;
    ctx.beginPath();
    ctx.arc(cx, ay + 15, 7, 0, Math.PI * 2);
    ctx.fill();
    ay += 66;
  }

  // --- the caveat, on the image itself ---
  ctx.fillStyle = SLIP;
  ctx.fillRect(56, H - 118, W - 112, 76);
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 1;
  ctx.strokeRect(56, H - 118, W - 112, 76);

  ctx.fillStyle = MUTED;
  ctx.font = "400 16px Archivo, system-ui, sans-serif";
  const caveat =
    "A match measures agreement on issues only — not coalition arithmetic, not leadership, not whether a list will clear the 3.25% threshold. " +
    `Party codings are a working draft (${VERSION}) and will be re-verified against the lists filed in September.`;
  wrap(ctx, caveat, W - 152).slice(0, 3).forEach((line, i) => {
    ctx.fillText(line, 76, H - 92 + i * 22);
  });
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}
