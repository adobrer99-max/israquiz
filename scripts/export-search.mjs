// After `vite build`: write dist/search.json, the compass's entries for the site search.
// Each entry carries a query string (q) rather than a full URL, so the site can mount the
// compass wherever it likes.
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "compass-search-"));
const out = join(dir, "entry.mjs");
try {
  await build({ entryPoints: ["scripts/search-entry.ts"], bundle: true, platform: "node", format: "esm", outfile: out, logLevel: "error" });
  const json = execFileSync(process.execPath, [out], { encoding: "utf8" });
  const list = JSON.parse(json);
  writeFileSync("dist/search.json", JSON.stringify(list));
  console.log(`search.json: ${list.length} entries`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
