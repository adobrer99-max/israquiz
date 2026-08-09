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
    items: "A13, D7 — items added after validation",
    issue: "The first run of the §4.6 check found the security axis coding The Democrats, Ra'am and the Joint List identically on all twelve items, so all three sat at exactly the same point and the axis carried no information about the largest difference between them. Two statements were added rather than the coordinates adjusted. A13, on whether attacks on soldiers should be condemned without qualification, separates them on security. D7, on the legitimacy of Zionism, does the same on national identity — and belongs there rather than on the security axis, since The Democrats are both Zionist and dovish and an item that scored those together as hawkishness would wreck the horizontal axis. Both collapses are now resolved.",
  },
  {
    items: "A13 · low discrimination, high value",
    issue: "A13 is the most lopsided statement in the bank: eleven of the thirteen ballot entities agree with it. Read by variance alone it looks like a dead item. It is not — it is one of only two things preventing an axis collapse, which is why the diagnostics report both numbers. An item almost everyone agrees with can still be the only thing holding two parties apart, and cutting it for low variance would undo exactly that. Among respondents, rather than parties, it should divide sharply.",
  },
  {
    items: "A13 · the Joint List merge",
    severe: true,
    issue: "A13 is the first item to divide the Joint List outside religion-and-state and economics. Hadash–Ta'al is coded N and Balad D, so the merged column resolves to N. The spec's observation that the three components are 'genuinely identical' on security, institutions and national identity held only because the bank had not yet asked the question that divides them. That is worth saying plainly: the unity the merge appeared to show was partly an artefact of the item set.",
  },
  {
    items: "D7 · United Torah Judaism",
    issue: "Coded N, not A. Agudat Yisrael was historically anti-Zionist and Degel HaTorah non-Zionist; United Torah Judaism participates fully in the state without affirming Zionism as an ideology. The single item that separates it from the rest of the Netanyahu bloc is therefore not a security question but Zionism itself. Defensible either way, and the most interesting cell added in this revision.",
  },
  {
    items: "D7 · Ra'am",
    issue: "Coded N. Ra'am is a non-Zionist party that has deliberately avoided fighting this question, in contrast to Balad, which campaigns on it. N is what this bank means by deliberately ambiguous, but it is a low-confidence cell and the first one to re-examine against the filed list.",
  },
  {
    items: "Religion block · Yashar",
    issue: "Yashar plots at −60 on the religion axis rather than near the origin. This is not obviously an artefact to correct. Eisenkot's party has published no platform, and its five coded religion-and-state cells all lean secular while the other five are genuinely unstated — a party that has said little, and has leaned one way in the little it has said. The compass reports the stated positions and nothing else. Whether the silence is strategy or an absence of settled policy is a question about the party, not about the instrument.",
  },
  {
    items: "Religion block · Ra'am",
    issue: "Ra'am is coded on three of ten religion-and-state items, which places it at +67 — far above the 'slightly above the secular half' the spec anticipates. The marker is drawn as low-confidence for this reason.",
  },
  {
    items: "Security block · The Democrats and Ra'am",
    issue: "A13 lifts the Joint List clear of the other two dovish parties, but The Democrats and Ra'am remain on the same point: they are coded identically on all thirteen security items, which is a fair reading of two parties whose operative positions on Gaza, Iran and the West Bank genuinely coincide. They are 167 points apart on the vertical axis, so the markers do not collide on the grid.",
  },
  {
    items: "Institutions block · remaining collapses",
    issue: "Two three-way coincidences survive, both on institutions and rule of law: Likud with Otzma Yehudit and Religious Zionism at one pole, The Democrats with Ra'am and the Joint List at the other. Unlike the security collapse these look real rather than artefactual — each trio takes identical positions on judicial review, the Attorney General, the 7 October commission and police independence. Institutions is a reported bar rather than a grid axis, so the cost is lower, but it should be re-checked if any of the six moves.",
  },
  {
    items: "Item discrimination",
    issue: "No statement in the bank is unanimous. Response variance and item–axis correlation can only be computed once there are live responses, which is the post-launch half of §4.7 and the point at which items should actually be cut.",
  },
];

export const LIMITS: string[] = [
  "A match percentage measures issue agreement only. It is not coalition arithmetic, not leadership, not electoral viability under a 3.25% threshold, and not advice about how to vote.",
  "Party codings are a working draft. They will be re-verified against the platforms of the lists actually filed in September, and this build should be treated as a preview until then.",
  "Parties are coded at full intensity because a party either takes a position or it does not. Most people hedge. That is why the parties spread wider on the grid than you will.",
  "Differences of under about three points are noise given the coding uncertainty. The top result is a closest match, not your party.",
  "Nothing you answer leaves your browser. Progress is saved to this device's local storage so you can close the tab and come back.",
];
