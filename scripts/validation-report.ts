/* ============================================================
   §4.7 validation round — CLI

     npx vite-node scripts/validation-report.ts validation/

   Reads a directory of .json replies (or one file holding an
   array of them), writes markdown. Everything it knows lives in
   src/lib/validation.ts; this file is argument parsing and disk.

   Replies join a named tester to a declared vote and a full
   answer vector. That is identifiable political opinion, and the
   exact join §6.5.1 keeps apart everywhere else — so the default
   output path stays inside the gitignored input directory, and
   writing anywhere else needs --out and a deliberate decision.
   ============================================================ */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { parseReplies, renderMarkdown, validationReport } from "../src/lib/validation.ts";

const args = process.argv.slice(2);
const outFlag = args.indexOf("--out");
const outPath = outFlag >= 0 ? args[outFlag + 1] : null;
const input = args.find((a, i) => !a.startsWith("--") && i !== outFlag + 1) ?? "validation";

function load(path: string): { source: string; value: unknown }[] {
  const p = resolve(path);
  const collect = (file: string) => {
    const text = readFileSync(file, "utf8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return [{ source: basename(file), value: null }];
    }
    // one file may hold a single reply or an array of them
    return Array.isArray(parsed)
      ? parsed.map((v, i) => ({ source: `${basename(file)}[${i}]`, value: v }))
      : [{ source: basename(file), value: parsed }];
  };

  if (!statSync(p).isDirectory()) return collect(p);
  return readdirSync(p)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .flatMap((f) => collect(join(p, f)));
}

let raw: { source: string; value: unknown }[];
try {
  raw = load(input);
} catch {
  console.error(
    `Could not read "${input}".\n\n` +
      "Put the replies testers emailed back into validation/ as .json files, then:\n" +
      "  npx vite-node scripts/validation-report.ts validation/\n",
  );
  process.exit(1);
}

if (!raw.length) {
  console.error(`No .json files in "${input}". Nothing to report on.`);
  process.exit(1);
}

const { replies, rejected } = parseReplies(raw);
const markdown = renderMarkdown(validationReport(replies), rejected);

const dest = outPath ?? join(input, "REPORT.md");
if (outPath && !resolve(outPath).startsWith(resolve(input))) {
  console.error(
    `Refusing to write outside "${input}" by default — the report names testers.\n` +
      `If you meant it, the path you gave was: ${resolve(outPath)}\n` +
      "Write it there yourself, or keep it in the gitignored directory.",
  );
  process.exit(1);
}

writeFileSync(dest, markdown + "\n", "utf8");
console.log(markdown);
console.error(`\n--- written to ${dest} (${replies.length} counted, ${rejected.length} rejected)`);
