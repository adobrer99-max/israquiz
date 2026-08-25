/* ============================================================
   Editorial notes — spec §7
   Surfaced as a page the user can reach from anywhere, not
   buried. Publishing the doubts is what makes the coding matrix
   auditable rather than merely visible.
   ============================================================ */

export const VERSION = "v0.2 — preview";
export const VERSION_DATE = "25 August 2026";

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
    severe: true,
    issue: "The technical-bloc structure means the merged column overstates unity on religion-and-state and economics, where all but one of the flagged and divergent cells fall. The exception is A13, added after validation, which is the first security item to divide the components — so the spec's claim that the three are genuinely identical outside those two blocks held partly because the bank had not asked the question. This note used to end by saying to re-examine once the joint slate was published. It now has been, and the re-examination has not been done: sixteen cells are flagged in the matrix as the merge doing interpretive work rather than reading a position off a platform, and every one of them is a cell a published slate could settle. Ten are component positions, where one component is coded and the other silent — B2, B3, B5, B6, B7, B8, B9, B11, B12 and B14. Six are divergences resolved to the less committal value — A13, B4, B10, B13, E3 and E8. The list's own ordering is the evidence to read them against, since it shows whose positions carry weight, and none of that has been read in here.",
  },
  {
    items: "Economy block (Otzma Yehudit, Religious Zionism)",
    issue: "Economic positions are thin and subordinate to other commitments. Several N codings are low-confidence.",
  },
  {
    items: "All Unity (HaAchdut) rows",
    severe: true,
    issue: "Named Unity — HaAchdut in Hebrew — in August, having been launched on 6 August as an unnamed Erdan–Edelstein list. Naming a party does not give it a platform: 65% of items are still unstated (32 of 49), and most of the sixteen coded cells are inferred rather than stated. To be re-coded entirely once a platform exists. Also verify the list still exists at filing — Likud breakaways have a mixed survival record.",
  },
  {
    items: "All Haredi Public Party rows",
    severe: true,
    issue: "Codings rest on press reporting of the party's platform rather than on a published manifesto, which is a weaker source than most columns here and should be re-read against the filed list. Three cells are stated policy and twelve are inferred, which is the worst stated-to-inferred ratio in the bank and the reason the column is suppressed rather than ranked. B1, B3 and E2 are the party's own planks — conscription, core curriculum, and the money that sustains full-time study. The rest of the religion-and-state block follows Shas and United Torah Judaism exactly, on the reading that a reform faction within ultra-Orthodox society is quarrelling about integration into the state and not about halakha. That reading is the load-bearing judgement here: if the party turns out to differ from the haredi parties on the Rabbinate or on Shabbat, twelve cells are wrong at once. Security, institutions and national identity are left unstated rather than inferred from United Torah Judaism, which is the line between a thin column and a fabricated one.",
  },
  {
    items: "E2 (Haredi Public Party) · resolved",
    issue: "Coded D, against Shas and UTJ at A, and previously flagged as the cell most likely to be wrong: economic reform might have meant redirecting subsidy rather than cutting it, which would make the honest coding N. Reported platform detail settles it. The traditional haredi parties demand daycare and student subsidies stay intact regardless of whether men enlist; this party wants funding restructured to incentivise service and workforce participation, and describes the existing arrangement as locking families into state-subsidised poverty. E2 asks whether stipends for full-time yeshiva students should be increased — the exact category it wants to stop funding unconditionally. D stands, and it is now sourced rather than inferred.",
  },
  {
    items: "All People of Israel rows",
    severe: true,
    issue: "The thinnest column in the bank and the weakest-sourced. Ofer Winter launched Amcha Yisrael in Jerusalem on 25 August 2026, and these eight cells come from reporting of that launch speech rather than from any platform — half of them are flagged inferred for that reason. Four were said outright: there can never be a Palestinian state (A1), integrating the haredim into the IDF (B1), a right-wing government of Zionist partners with the Arab parties rejected (D2), and the Zionist frame running through the speech (D7). Block C is empty on purpose: a significant change in the justice system is a direction, and every institutions item asks about a mechanism. Religion-and-state and economics went unmentioned. At 17% coverage the column is suppressed, which is the correct outcome for a party three days old — it belongs in the published matrix so a reader can check it, and nowhere near a ranking.",
  },
  {
    items: "A4 (People of Israel)",
    issue: "Coded N on resuming Jewish settlement in Gaza, following the precedent already set for Noam rather than the party's general direction. Winter said the only solution in Gaza is Palestinian emigration and that an enemy will pay a heavy territorial price — territorial maximalism, and a reader could reasonably expect A. But the bank settled this question once already: campaigning on Gaza resettlement earns A, not campaigning on it earns N, even for a party that would not oppose it in principle. Winter campaigned on emigration and said nothing about settlement. Applying the rule consistently is worth more here than squeezing the last drop of signal out of a launch speech.",
  },
  {
    items: "Ra'am (D1, D7, C9)",
    issue: "Yoav Segalovitz's reported move to Ra'am's list comes with a stated precondition that the party recognise Israel as a Jewish state. If adopted, D1 flips and D7 moves with it — the most consequential single recoding in the bank. Still unresolved and not pre-empted here. Keep it apart from Ra'am's separate confirmation that it will not seek recognition of a Palestinian state as a coalition condition: recognising Israel as a Jewish state and declining to demand a Palestinian one are different commitments touching different items, and the two are adjacent enough to be merged by accident. Neither settles the other.",
  },
  {
    items: "D2 (all columns)",
    issue: "Coded from the pre-Segalovitz landscape, and now the most volatile cell in the matrix for a second reason. D2 asks whether Arab parties are legitimate coalition partners, and it is coded on every column except Ra'am's. Ra'am has confirmed it will not seek recognition of a Palestinian state as a condition of entering a coalition, which removes the obstacle on its own side and leaves the question entirely with the other parties. None of them has moved, so none of their cells has been recoded — coding what a party might do once an obstacle is gone would be inventing a position rather than recording one. These are the cells to watch between now and filing.",
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
    items: "The Joint List · confirmed, and what that settles",
    issue: "Hadash–Ta'al and Balad are now confirmed to be running together. Nothing in the codings changes, but a structural question closes: until now the alliance could have collapsed, and had it done so both would have become ballot entities in their own right and the merged column would have ceased to exist. The party registry is built to absorb exactly that, and it no longer has to. What follows is that the merge rule stops being a provisional convenience and becomes a permanent property of the ballot — which raises rather than lowers the standard the flagged cells have to meet, because they will still be there on election day.",
  },
  {
    items: "The Joint List · Balad's silence is now a settled limitation",
    issue: "Balad takes no position on intra-Jewish religion-and-state questions, and the merge absorbs that silence into a ballot column. While the alliance was provisional this was an artefact that might have dissolved; with the slate confirmed it will not. The concrete consequence is worth stating for what it costs a respondent rather than what it costs the matrix: someone whose views sit closest to Balad specifically cannot see that in the headline ranking, because Balad is not a thing anyone can vote for and its distinctive positions are averaged into a column it shares with Hadash–Ta'al. The component readout below the ranking is the only place that difference surfaces, which is the reason it exists and the reason those columns stay published.",
  },
  {
    items: "The Haredi Public Party · the cut nothing else made",
    issue: "Until now every haredi column in the bank sat on the same side of B1 and B3 — against conscription on the same terms, against conditioning yeshiva funding on the core curriculum. Those are the two items block B is built around, and having no haredi party opposed to the haredi position on them meant the religion axis could not distinguish a respondent who is observant and pro-integration from one who is simply secular. The Haredi Public Party is the first column to make that cut. It is worth having even suppressed: it changes what the two items mean, and it puts a party on the A side of both that a haredi respondent could actually recognise.",
  },
  {
    items: "B1 · what the item conflates, for one party only",
    severe: true,
    issue: "B1 asks whether haredi yeshiva students should be subject to the draft on the same terms as other citizens. For every other column that is one question, because supporting haredi enlistment and supporting equal legal compulsion are the same position — the parties that want haredim serving also want the exemption ended, and the parties that do not want neither. The Haredi Public Party splits them. It supports integrating haredi men into the military and wants state funding restructured to incentivise service, while arguing that aggressive external coercion — the legal and financial sanctions the secular opposition parties favour — fails, and that the change has to be driven from inside the community. Coded A, because on the direction the item measures it is the only haredi column that wants haredim in uniform. N was considered and rejected: it would place the party beside Otzma Yehudit and Religious Zionism, which are N for the opposite reason — support in principle while voting to protect exemptions — and merging those two positions would be a worse error than the imprecision it fixed. The honest statement is that the cell records the enlistment half of the item and is silent on the compulsion half, and that no cell in this bank can show the difference.",
  },
  {
    items: "People of Israel · Arab citizens in, Arab parties out",
    issue: "D2 is the best-sourced cell in this column and it is sourced twice — Winter promising a right-wing government with as many Zionist partners as possible, and Yoseph Haddad, the party's Arab-Israeli candidate for public diplomacy minister, attacking the Arab parties for representing Gaza, Jenin and Ramallah rather than their own communities. What makes it worth a note is the pairing: the same party runs an Arab candidate for the security cabinet, cites Arab soldiers, and campaigns on connecting Arabs who want the good of the country. Arab citizens in, Arab parties out. That is a real and coherent position, it is held by a party on the ballot, and D2 captures it exactly — which is unusual enough to record, since most of the notes here are about things the bank cannot express.",
  },
  {
    items: "G1 · an item whose frame does not fit a new party",
    issue: "G1 asks whether an Arab party should be willing to join a coalition led by a Zionist party. The frame assumes Arab political representation runs through Arab parties, which for every column coded so far it does. People of Israel's whole proposition is that it should not: Arabs in the security cabinet, on a Zionist list, with the existing Arab parties rejected as unrepresentative. Neither A nor D records that, so the cell is left as no position. The coding is not the problem — the item's frame is, and it is worth saying so rather than forcing an answer that would misreport the party in either direction.",
  },
  {
    items: "A15 · Gaza emigration, added mid-cycle",
    issue: "The bank asked nothing about encouraging the emigration of Gaza's population while three ballot entities campaigned on it — Otzma Yehudit, Religious Zionism, and People of Israel, for which it is the central Gaza plank. A compass silent on a position that openly held is not describing the choice in front of voters, so the item was added rather than deferred to September. It earns its place on the numbers as well as the principle: it separates 68% of party pairs, above A4's 64%, and it is the sole thing keeping one pair off an identical security coordinate. A4, on whether Jewish settlement in Gaza may resume, is the adjacent item and a genuinely different question — the two rows differ on Yashar, Yisrael Beiteinu, Unity and People of Israel. Adding it mid-cycle cost a storage-key bump to v4, which ends every session saved before it: a resumed session would have produced a result computed over a questionnaire the respondent never saw. Coverage denominators moved from 48 to 49 for every column and no party crossed the 70% floor.",
  },
  {
    items: "A gap the bank now has: how to enforce conscription, not whether",
    issue: "With a haredi party arguing for enlistment by incentive and against enforcement by sanction, the live argument in Israeli politics has moved to a question the bank does not ask. Nothing here separates a respondent who wants haredim drafted and penalised for refusing from one who wants them drafted through funding incentives and communal persuasion — B1 collects both as agreement. An item on the enforcement mechanism would make a cut that currently exists nowhere: it would put the Haredi Public Party on one side, Yisrael Beiteinu and The Democrats on the other, and Shas and United Torah Judaism opposed to the premise of both. It is not added here, because adding an item shifts every party's coverage denominator, forces a storage-key bump that invalidates in-flight sessions, and re-opens the §4.6 clustering check — a decision that belongs to a bank revision rather than to a party edit.",
  },
  {
    items: "A1 · Ra'am, and what a coalition condition is not",
    severe: true,
    issue: "Ra'am has confirmed it will not seek recognition of a Palestinian state as a condition of entering a coalition. A1 asks whether Israel should accept the establishment of a Palestinian state as part of a wider regional normalisation, and Ra'am is coded A on it. The cell does not move. A1 asks what Israel should do; the confirmation is about what Ra'am will not demand, and the gap between those two is Ra'am's entire strategy since 2021 — park the national question, join on civic terms, extract material gains for the constituency. A party can hold a position and decline to make it a precondition. Coding A1 as D would assert the party opposes a Palestinian state, which nothing supports. N was the defensible alternative and was rejected: it would record a change in coalition conduct as a change in stated policy, where §7's rule is to code the stated position and document the choice. The D8 note already settled the neighbouring case — the matrix records positions, not reasons — and this is the same shape: positions, not preconditions. What the bank cannot show is that a party's coalition behaviour and its platform can point different ways, which for Ra'am is the most important thing about it.",
  },
  {
    items: "G1 · the same confirmation, where it does land",
    issue: "G1 asks whether an Arab party should be willing to join a coalition led by a Zionist party, and codes Ra'am A against the Joint List's D — the sharpest divide between them in the bank, and the reason the item is asked at all. Ra'am declining to make a Palestinian state a coalition condition is that cell being demonstrated rather than changed. Nothing is recoded; the coding is simply better sourced than it was. This is also the answer to why G1 is unscored: it measures coalitionability rather than ideology, and the confirmation is a coalitionability fact that leaves every ideological cell where it was.",
  },
  {
    items: "The Haredi Public Party · confirmed running",
    issue: "Confirmed to be contesting the election. Nothing structural follows: the column was already coded and already suppressed at 31% coverage, which stays correct, and confirmation is not polling, so the threshold caveat stands. Its one real effect is on the drafted B15 item, whose recorded objections included that the party might simply not appear. That half retires — though confirmed is not filed, and the deadline is still weeks away — while the other half stands untouched: B15 is B1's row with one cell changed, and that cell belongs to a column coded from press reporting. B15 stays held for the September bank revision regardless, because it was never held on this question.",
  },
  {
    items: "The Haredi Public Party · it is UTJ with three flips",
    issue: "Said plainly rather than left for a reader to notice: across the fifteen cells coded, the column is identical to United Torah Judaism except on B1, B3 and E2. That is what the party is by its own account — an internal reform faction, not a new religious tendency — so the resemblance is a finding rather than a coding failure. It does mean the column carries almost no independent information outside those three cells, and that a respondent matching it closely is really matching UTJ. The coverage floor keeps it out of the ranking, which is the right outcome for a column whose distinctiveness rests on three items.",
  },
  {
    items: "Unity (HaAchdut) · two name collisions",
    issue: "The Erdan–Edelstein list is now named Unity, and the name lands awkwardly twice. First, the recalled-vote question offers National Unity, which is Gantz's 2022 list and a different party — that option keeps its name because it has to match what was on the 2022 ballot, so the compass now shows a reader two similar names for unrelated parties. The party is therefore carried here as Unity (HaAchdut), with the Hebrew doing the disambiguating. Second, F2 asks about preferring a broad national-unity government, which is the standard term for a government type but can now read as a question about the party. The wording is kept: national-unity government is the term Israeli politics actually uses, F2 is unscored, and renaming a concept to avoid a party is how you end up describing neither. It is the first thing to check if testers stumble on it.",
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
    items: "A14 · why the Temple Mount sits on the security axis",
    issue: "Otzma Yehudit and Religious Zionism agree, Shas and United Torah Judaism disagree, Likud is neutral — a cut nothing else in the bank produces. It is nonetheless coded on security rather than religion-and-state, because the haredi parties oppose Jewish prayer there precisely by holding the strictest rabbinic position: the Chief Rabbinate and haredi authorities forbid entering the compound at all. On the religion axis the item would have driven the two most religious parties toward the secular pole. As a sovereignty assertion, agree reads correctly as hawkish.",
  },
  {
    items: "B11 · the Western Wall agreement, and Likud's N",
    issue: "Signed in 2016, frozen in 2017 under haredi coalition pressure, never enacted. Likud is coded N rather than D because the freeze was an act of coalition management that the platform never repudiated — the §7 rule of coding the stated position and documenting the choice. It is the item most likely to separate a reader's intuitions about Israeli religious politics from the way those politics actually run, since it matters more to Jews outside Israel, most of whom are not Orthodox, than to Israelis.",
  },
  {
    items: "Block G · items that load on no axis",
    issue: "Three statements are coded and reported but never scored. G1 measures whether an Arab party should be willing to join a Zionist-led coalition — coalitionability rather than ideology, and the sharpest Ra'am/Joint List divide there is. G2 asks whether the electoral threshold should be raised, which parties answer from self-interest: it is the only configuration in the bank where Otzma Yehudit and Balad land on the same side. G3 asks about acknowledging discrimination against Mizrahi immigrants, which looks like an identity-block item but would load wrongly on an axis about Arab citizens. Forcing any of them onto an axis would score something other than a political position.",
  },
  {
    items: "G3 · no party disagrees",
    issue: "Not one column is coded D. §5 requires a scored statement to draw both agreement and disagreement, and an item nobody opposes inflates every match percentage uniformly — which is the concrete reason block G exists rather than a sixth weighted topic. As an unscored readout the item still works: the agree-versus-neutral split is the Shas-against-United Torah Judaism communal cut, which nothing else in the bank produces. If a sharper version is wanted later, the contested form is affirmative action in senior public appointments rather than historical acknowledgment.",
  },
  {
    items: "Noam For Israel · a narrow column, coded as narrow",
    issue: "Running separately for the first time in 2026; its single seat in 2021 and 2022 came inside the Religious Zionism list. Coded complete on religion-and-state and national identity, thin on security, and silent on economics — a description of the party rather than a gap in the research, since it is a single-purpose Jewish-identity list whose security positions are inherited from the bloc and which has never published an economic platform. Coverage lands at 75%, just above the floor, so it is ranked; it will be the first column to fall below if any coding is tightened.",
  },
  {
    items: "Noam · A14, the cell to check hardest",
    severe: true,
    issue: "Coded D on Jewish prayer on the Temple Mount, where Otzma Yehudit and Religious Zionism are A. The basis is that Noam is the political arm of the Har Hamor stream, whose rabbinic authority forbids ascending the compound at all. If that holds it is the sharpest single thing separating Noam from the rest of the religious right, and it is exactly the sort of cell that is easy to get wrong by assuming the far right is uniform. Verify against the filed list before launch.",
  },
  {
    items: "Noam · A4, the same trait in a second place",
    issue: "Coded N on resuming Jewish settlement in Gaza, where Otzma Yehudit and Religious Zionism are A. Noam is Kookist and would not oppose settlement in principle, but its rivals campaigned actively for Gaza resettlement and it did not — the Har Hamor stream is characteristically quietist about territorial activism, which is the same trait producing its D on the Temple Mount. Read Noam as simply another religious-Zionist list and this cell becomes A. Together with A14, B3, B14 and D4 it is one of five cells separating Noam from Otzma Yehudit; two of those five rest on the same reading of one rabbinic stream, so if that reading is wrong the column loses much of what makes it distinct.",
  },
  {
    items: "D8 · the matrix records positions, not reasons",
    issue: "Shas, United Torah Judaism and Noam are all coded A, and they arrive there by different routes. The haredi parties object to intermarriage on halachic grounds, which bar marriage to any non-Jew and single out no ethnicity; Noam objects on ethnic grounds and targets relationships with Arabs specifically. Those are different politics reaching the same cell, and the coding scheme has no way to show it — a limitation worth stating rather than smoothing over, because a reader who sees the haredi parties beside Noam here will otherwise assume a shared motive that does not exist.",
  },
  {
    items: "D8 · wording, and who it asks about",
    issue: "The statement asks about state policy rather than about whom anyone should marry, because a compass measures what governments should do. It names the programmes as their supporters would — preventing assimilation is a funded activity of Israeli municipal and national bodies — rather than as their opponents describe them, which is what §5's both-sides test requires. It should also be said plainly that this item asks Arab respondents about a policy aimed at them, and that no wording makes that comfortable.",
  },
  {
    items: "Presentation order · blocks now shuffled",
    issue: "§8.9 says to randomise items within each block and never across blocks, because interleaving topics raises abandonment. That left a gap it did not anticipate: the blocks themselves ran in a fixed order, so every respondent met twelve security statements before anything else, and the resulting primacy effect landed on one of the two axes the grid is built from. Blocks are now shuffled as whole units and items shuffled within them. Topic coherence — the thing §8.9 was protecting — is untouched.",
  },
  {
    items: "B14 · women in combat roles, and Otzma Yehudit's N",
    issue: "The item exists to separate Religious Zionism from Otzma Yehudit, which nothing else in the bank did. Religious Zionism and its rabbis have campaigned directly and repeatedly against expanding women's combat service; Otzma Yehudit, whose politics runs through policing and deterrence rather than rabbinic authority, has not made it a cause. Otzma is therefore coded N. That is the cell doing all the discriminating work here, which makes it the one to check hardest against the filed list — if it should read D, the item stops separating them and should be reconsidered.",
  },
  {
    items: "B14 · why it is not a security item",
    issue: "It concerns how far rabbinic authority reaches into military policy, and nothing about it is hawkish or dovish. Scored on the security axis it would have pulled Religious Zionism — sitting on the hawk pole — toward the doves for holding a religious view, in the same way the Temple Mount item would have pulled the haredi parties toward the secular pole. Same trap, opposite direction.",
  },
  {
    items: "A8 · rewritten as two concrete acts",
    issue: "The statement read 'the state should vigorously enforce the law against illegal outposts and settler violence'. An intensifier makes the disagreeing side sound like it is endorsing lawlessness, which fails §5's test that a supporter and an opponent both accept the statement as a fair description of their position. Deleting the intensifier alone would have left a statement nobody could refuse, and an item nobody opposes carries no information. Naming the two acts — removal and prosecution — restores a real disagreement: the parties coded D favour retroactive legalisation rather than demolition, and have called for pardons rather than prosecutions. Codings are unchanged, because the row was never about enforcement in the abstract.",
  },
  {
    items: "B10, B13 · marriage and adoption split",
    issue: "These were one item and they are not one question in Israel. There is no civil marriage for anyone, so same-sex marriage is entangled with the Rabbinate's monopoly and asks something close to B4; adoption was opened through the courts and draws a softer opposition. Likud is the cell that moves — coded D on marriage and N on adoption, which is the honest reading of a party that has made gestures on gay rights while blocking the surrogacy expansion under coalition pressure.",
  },
  {
    items: "B12 · chametz in hospitals",
    issue: "The rest of the religion-and-state block asks about principles — halakha's precedence, the Rabbinate's authority, recognition of non-Orthodox streams — and principles invite people to answer as they would like to think of themselves. A hospital ward during Passover is where the principle is actually enforced, on patients and visitors having their bags searched at the door. It is the smallest question in the block and probably the one that predicts best.",
  },
  {
    items: "Six statements cut after validation",
    issue: "A11, C2, C4, C7, C10 and D5 each carried a coding row identical to another item's, so no pair of parties was separated by one and not the other. They are retired rather than deleted, with the item kept in each one's place and the reason recorded, and they remain visible under Diagnostics. Three of the six were in institutions and rule of law, which is a finding rather than an accident: the judicial overhaul was a pure bloc fight, and every party's position on every judicial question was fixed by which side of the coalition it sat on. The institutions block is correspondingly the one where a compass learns least.",
  },
  {
    items: "A8 and C9 · a duplicate kept on purpose",
    issue: "These two still carry the same coding row. They were kept because they sit in different blocks, so neither axis is made redundant, and because §3.8 added C9 for a specific reason — a party fielding a former police commander for the national security portfolio — that should make it diverge once Ra'am's column is re-coded from the filed list. If it has not diverged by then, cut it.",
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
    items: "Collection · the one thing that leaves the device",
    issue: "Until now nothing could be transmitted: the source contained no fetch, no beacon and no cookie, and the fonts were self-hosted so the page made no third-party request either. That is still true of a default build, and it is still true of every screen before the last one. Collection is a build-time option, off unless an endpoint is configured, and when it is on it changes nothing until a respondent ticks an unticked box and presses a button. Consent to the statement answers and consent to the background block are separate controls, because §6.5.1 treats them as two tables and it would be incoherent to bind them into one decision. What is sent is shown in full before it is sent rather than described. Withdrawal deletes both rows and needs no email, because the response id lives on the device that sent it — which is the rare case where holding an identifier improves the privacy position rather than worsening it.",
  },
  {
    items: "Collection · what is stripped, and why the list is written out",
    issue: "The payload names every field it carries instead of spreading the session object, so a field added to the session later cannot start transmitting itself by accident. Three things are dropped deliberately. The tester initials from validation mode are free text about a person drawn from a cohort of fifteen, which §6.5.4 forbids and which would be re-identifying at that cohort size. The random seed and the stored index describe the device's progress rather than the respondent's politics. The declared vote is kept, because it is a party code chosen from a fixed list and it is the single most useful field for the §4.7 recovery check. Presentation order is kept too: §8.9 changed it after testers found a primacy problem, and order effects cannot be measured after the fact unless the order is recorded.",
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
];

/**
 * The last limit depends on how the build was configured, so it is kept out of
 * LIMITS rather than asserted. A build with no collection endpoint genuinely
 * cannot transmit anything; one with an endpoint can, on request, and should
 * not claim otherwise.
 */
export const STORAGE_LIMIT = {
  local:
    "Nothing you answer leaves your browser. Progress is saved to this device's local storage so you can close the tab and come back.",
  collected:
    "Progress is saved to this device's local storage so you can close the tab and come back. Nothing is transmitted while you answer. Contributing your response to the research is a separate opt-in at the end, unticked by default, separable from the background questions, and withdrawable from this device at one click.",
};
