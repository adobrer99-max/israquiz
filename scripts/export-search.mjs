// After `vite build`: write dist/search.json, the compass's entries for the site search.
// Each entry carries a query string (q) rather than a full URL, so the site can mount the
// compass wherever it likes.
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// It also writes dist/pages.json (scripts/pages-entry.ts): the data the site uses to build
// plain pages for each party and for how the coding works.
const dir = mkdtempSync(join(tmpdir(), "compass-search-"));
const run = async (entry, name) => {
  const out = join(dir, name + ".mjs");
  await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", outfile: out, logLevel: "error" });
  return JSON.parse(execFileSync(process.execPath, [out], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
};
try {
  const list = await run("scripts/search-entry.ts", "search");
  writeFileSync("dist/search.json", JSON.stringify(list));
  console.log(`search.json: ${list.length} entries`);
  const pages = await run("scripts/pages-entry.ts", "pages");
  writeFileSync("dist/pages.json", JSON.stringify(pages));
  console.log(`pages.json: ${pages.parties.length} parties, ${pages.items.length} statements, ${pages.codingNotes.length} notes`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
