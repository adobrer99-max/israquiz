/* ============================================================
   Editorial notes — spec §7
   Surfaced as a page the user can reach from anywhere, not
   buried. Publishing the doubts is what makes the coding matrix
   auditable rather than merely visible.
   ============================================================ */

export const VERSION = "v0.2 — preview";
export const VERSION_DATE = "9 August 2026";

export const ELECTION = {
  knesset: 26,
  date: "27 October 2026",
  threshold: 3.25,
  seats: 120,
  majority: 61,
};

export interface Note {
  items: string;
  issue: string;
  /** true = flagged as the highest-risk entries */
  severe?: boolean;
}

export const CODING_NOTES: Note[] = [
  {
    items: "All Together rows",
    severe: true,
    issue: "Together has published no platform. Codings derive from Yesh Atid's prior platform plus Bennett's public statements, and the two diverge on religion-state and settlements. The highest-risk column in the bank.",
  },
  {
    items: "All Yashar rows",
    issue: "Eisenkot's positioning is deliberately broad. N here often means 'genuinely unstated' rather than 'centrist'. A5, A6, A9 and A10 would arguably be better coded as no position, with the low coverage reported honestly.",
  },
  {
    items: "A3, A4 (Likud)",
    issue: "Likud's platform and its leadership's operative policy diverge on annexation and Gaza resettlement. Coded to the stated party position.",
  },
  {
    items: "A5 (all columns)",
    severe: true,
    issue: "Replaces a hostages item made obsolete when the last remains were returned in January. The disarmament plan is days old: Hamas has agreed, Netanyahu says Israel has not, Ben Gvir calls it unacceptable, and most other parties have said nothing — hence the run of N. The most perishable item in the bank. If Israel accepts, or the plan collapses, this row must be rewritten rather than re-coded; a durable replacement is drafted and ready to swap in.",
  },
  {
    items: "B1 (Otzma Yehudit, Religious Zionism)",
    issue: "Both have voiced support for haredi conscription in principle while voting to protect exemptions. Coded N; defensible either way.",
  },
  {
    items: "D2 (Together)",
    issue: "Bennett governed with Ra'am in 2021 and has since ruled it out; Lapid has not. Coded N for the merged list.",
  },
  {
    items: "Religion-and-state block (Ra'am, Balad)",
    issue: "Coded as no position on intra-Jewish religion-and-state questions. Correct, but it thins Ra'am's religion axis to three items — which is why its grid marker is drawn as low-confidence. Balad's silence is absorbed by the Joint List merge, which is that rule's single largest effect.",
  },
  {
    items: "The Joint List merge",
    issue: "The technical-bloc structure means the merged column overstates unity on religion-and-state and economics. Every flagged and divergent cell falls in exactly those two blocks; on security, institutions and national identity the three components are genuinely identical. Re-examine once the joint slate is published — the ordering of the list itself will show which component's positions carry weight.",
  },
  {
    items: "Economy block (Otzma Yehudit, Religious Zionism)",
    issue: "Economic positions are thin and subordinate to other commitments. Several N codings are low-confidence.",
  },
  {
    items: "All Erdan–Edelstein rows",
    severe: true,
    issue: "The party is days old and unnamed; 63% of items are unstated and a third of the coded ones are inferred rather than stated. To be re-coded entirely once a platform exists. Also verify the list still exists at filing — Likud breakaways have a mixed survival record.",
  },
  {
    items: "Ra'am (D1, D5, C9)",
    issue: "Yoav Segalovitz's reported move to Ra'am's list comes with a stated precondition that the party recognise Israel as a Jewish state. If adopted, D1 flips and D5 follows — the most consequential single recoding in the bank. Not pre-empted here. The larger effect is on other parties' D2, which asks whether Arab parties are legitimate coalition partners: if bloc leaders follow the polling, several columns change on one item.",
  },
  {
    items: "D2 (all columns)",
    issue: "Coded from the pre-Segalovitz landscape. Currently the most volatile cell in the matrix.",
  },
];

/**
 * §4.7 pre-launch validation, run against the codings themselves.
 * The §4.6 smoke test reproduces the expected clustering in most respects —
 * Otzma Yehudit and Religious Zionism top-right, the haredi parties top-centre,
 * Likud upper-right, Yisrael Beiteinu lower-right — and fails in two places.
 * Both failures are recorded here rather than fixed by moving coordinates.
 */
export const INSTRUMENT_NOTES: Note[] = [
  {
    items: "Security block · dove pole",
    severe: true,
    issue: "The Democrats, Ra'am and the Joint List are coded identically on all twelve security items and therefore sit at exactly the same point on the horizontal axis. The spec expects the Joint List further left than The Democrats; the bank cannot express that difference at all. The fix is a discriminating item — most plausibly on Zionism itself, or on the legitimacy of armed resistance — not a nudge to the coordinates.",
  },
  {
    items: "Religion block · Yashar",
    issue: "Yashar plots at −60 on the religion axis, well clear of the origin the spec expects, because its five coded religion-and-state cells all lean secular and the other five are N. If those N codings are really 'unstated' rather than 'centrist', they should be no-position, which would raise the coordinate's error bars rather than move it.",
  },
  {
    items: "Religion block · Ra'am",
    issue: "Ra'am is coded on three of ten religion-and-state items, which places it at +67 — far above the 'slightly above the secular half' the spec anticipates. The marker is drawn as low-confidence for this reason.",
  },
  {
    items: "Item discrimination",
    issue: "No statement in the bank is unanimous and none is close to it: the weakest discriminator still separates roughly half of all party pairs. There are no dead items to cut before launch. Response variance and item–axis correlation can only be computed once there are live responses.",
  },
];

export const LIMITS: string[] = [
  "A match percentage measures issue agreement only. It is not coalition arithmetic, not leadership, not electoral viability under a 3.25% threshold, and not advice about how to vote.",
  "Party codings are a working draft. They will be re-verified against the platforms of the lists actually filed in September, and this build should be treated as a preview until then.",
  "Parties are coded at full intensity because a party either takes a position or it does not. Most people hedge. That is why the parties spread wider on the grid than you will.",
  "Differences of under about three points are noise given the coding uncertainty. The top result is a closest match, not your party.",
  "Nothing you answer leaves your browser. Progress is saved to this device's local storage so you can close the tab and come back.",
];
