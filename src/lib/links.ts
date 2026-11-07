/* ============================================================
   Links into the compass's reference views, so a party, a
   statement or a glossary term can be linked to and searched for:

     ?party=LIK      the party's profile
     ?item=A3        the statement and where every party stands
     ?term=knesset   the glossary, opened at that term
     ?coalition=...  the coalition builder (lib/coalition.ts)

   Only one opens at a time; the first that parses wins. The
   parameter is removed when the view closes, so a reload does
   not reopen it.
   ============================================================ */

import { GLOSSARY_BY_KEY } from "../data/glossary";
import { ITEMS } from "../data/items";
import { PARTIES, type PartyCode } from "../data/parties";
import { parseCoalitionParam } from "./coalition";

export type LinkTarget =
  | { kind: "party"; code: PartyCode }
  | { kind: "item"; id: string }
  | { kind: "glossary"; focus: string }
  | { kind: "coalition"; parties: PartyCode[] };

export const LINK_PARAMS = ["party", "item", "term", "coalition"] as const;

export function parseLink(search: string): LinkTarget | null {
  const q = new URLSearchParams(search);
  const party = (q.get("party") || "").toUpperCase();
  if (party && party in PARTIES) return { kind: "party", code: party as PartyCode };
  const item = (q.get("item") || "").toUpperCase();
  if (item && ITEMS.some((i) => i.id === item)) return { kind: "item", id: item };
  const term = (q.get("term") || "").toLowerCase();
  if (term && GLOSSARY_BY_KEY[term]) return { kind: "glossary", focus: term };
  const parties = parseCoalitionParam(search);
  if (parties) return { kind: "coalition", parties };
  return null;
}

/** Remove every link parameter from the address, keeping anything else. */
export function clearLinkParams() {
  const url = new URL(window.location.href);
  let changed = false;
  for (const p of LINK_PARAMS) if (url.searchParams.has(p)) { url.searchParams.delete(p); changed = true; }
  if (changed) window.history.replaceState(null, "", url.toString());
}

/** Point the address at a view, so it can be copied while it is open. */
export function setLinkParam(name: (typeof LINK_PARAMS)[number] | null, value?: string) {
  const url = new URL(window.location.href);
  for (const p of LINK_PARAMS) url.searchParams.delete(p);
  if (name && value) url.searchParams.set(name, value);
  window.history.replaceState(null, "", url.toString());
}
