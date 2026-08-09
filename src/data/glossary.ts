/* ============================================================
   Glossary — spec §5
   Terms are tappable inline in statement text rather than parked
   in a footer. `match` phrases are matched case-insensitively,
   longest first, so "Nation-State Basic Law" wins over "Basic Law".
   ============================================================ */

export interface Term {
  key: string;
  title: string;
  body: string;
  /** phrases that trigger the inline link. Omit to list in the glossary only. */
  match?: string[];
}

export const GLOSSARY: Term[] = [
  {
    key: "knesset",
    title: "Knesset",
    body: "Israel's single-chamber parliament. 120 seats, elected by nationwide proportional representation from closed party lists. 61 seats form a majority.",
    match: ["Knesset"],
  },
  {
    key: "threshold",
    title: "Electoral threshold",
    body: "A party must win 3.25% of the national vote — roughly four seats — to enter the Knesset at all. Votes for lists that fall short are discarded, which is why small parties merge before filing. The bar was raised from 2% in 2014 by a coalition whose smaller rivals saw the change as aimed at them, and where a party stands on raising it further tracks its own polling far more closely than its politics.",
    match: ["electoral threshold"],
  },
  {
    key: "temple-mount",
    title: "Temple Mount",
    body: "The compound in Jerusalem's Old City holding the Al-Aqsa Mosque and the Dome of the Rock, and the site of the two Jewish temples. Under the arrangement in place since 1967, Jews may visit but not pray there. The Chief Rabbinate and most haredi authorities forbid Jews from entering the compound at all on grounds of ritual purity — which is why the parties pressing hardest for Jewish prayer rights are on the religious right rather than among the haredim.",
    match: ["Temple Mount"],
  },
  {
    key: "kotel",
    title: "Western Wall egalitarian plaza",
    body: "A 2016 cabinet decision creating a permanent mixed-gender prayer section at the southern end of the Western Wall, with a role in its governance for the Reform and Conservative movements. It was frozen in 2017 under haredi coalition pressure and has never been enacted. It matters more to Jews outside Israel, most of whom are not Orthodox, than to Israelis — which makes it the sharpest test of whether a reader's intuitions about Israeli religious politics match the way those politics actually run.",
    match: ["Western Wall egalitarian plaza agreement", "Western Wall egalitarian plaza", "Western Wall"],
  },
  {
    key: "basic-laws",
    title: "Basic Laws",
    body: "Israel has no single written constitution. Instead a series of Basic Laws, passed by ordinary Knesset majorities, carry quasi-constitutional status. Whether courts may strike them down is one of the central disputes in Israeli politics.",
    match: ["Basic Laws"],
  },
  {
    key: "nation-state",
    title: "Nation-State Law",
    body: "The 2018 Basic Law: Israel as the Nation-State of the Jewish People. It declares national self-determination in Israel to be unique to the Jewish people, downgrades Arabic from official to 'special' status, and contains no equality clause — the omission the amendment in this statement would fix.",
    match: ["Nation-State Basic Law", "Nation-State Law"],
  },
  {
    key: "jsc",
    title: "Judicial Selection Committee",
    body: "The nine-member body that appoints judges, including Supreme Court justices. Its composition — currently a balance of politicians, sitting judges and bar representatives — was the centrepiece of the 2023 judicial overhaul fight.",
    match: ["Judicial Selection Committee"],
  },
  {
    key: "reasonableness",
    title: "Reasonableness standard",
    body: "A doctrine allowing courts to void government decisions as extremely unreasonable even where no specific law is broken. Its curtailment was the first piece of the 2023 overhaul to pass, and was struck down by the Supreme Court in January 2024.",
  },
  {
    key: "ag",
    title: "Attorney General",
    body: "Israel's Attorney General is both the government's chief legal adviser and head of public prosecution. By longstanding convention the government is bound by that advice — a convention with no statutory basis, which is what this statement asks about.",
    match: ["Attorney General"],
  },
  {
    key: "commission",
    title: "State commission of inquiry",
    body: "The strongest investigative instrument in Israeli law: established by the cabinet but chaired by a judge appointed by the Supreme Court president, with subpoena power and the ability to recommend removal from office. Weaker alternatives — governmental or 'national' probes — let the government pick the chair.",
    match: ["state commission of inquiry"],
  },
  {
    key: "west-bank",
    title: "West Bank",
    body: "The territory between the Green Line and the Jordan River, captured in 1967. Israelis on the right generally call it Judea and Samaria; the terms describe the same place and signal different politics. This quiz uses 'West Bank' throughout for consistency, not as an endorsement.",
    match: ["West Bank"],
  },
  {
    key: "outposts",
    title: "Outposts",
    body: "Settlements built without Israeli government authorisation, illegal under Israeli law as well as under the international consensus that treats all settlements as unlawful. Some are retroactively legalised; others are subject to demolition orders that are rarely enforced.",
    match: ["illegal outposts", "outposts"],
  },
  {
    key: "pa",
    title: "Palestinian Authority",
    body: "The self-governing body established by the Oslo Accords, administering parts of the West Bank under Fatah leadership. It lost control of Gaza to Hamas in 2007.",
    match: ["Palestinian Authority"],
  },
  {
    key: "board-of-peace",
    title: "Board of Peace",
    body: "The international transitional body proposed for post-war Gaza governance, envisaged as overseeing reconstruction and a phased Israeli withdrawal tied to Hamas disarmament. Its terms were still under negotiation when this bank was written — the one statement here that a news cycle could invalidate.",
    match: ["Board of Peace"],
  },
  {
    key: "haredi",
    title: "Haredi",
    body: "Strictly Orthodox Jews, about 13% of Israel's population and growing fast. Preferred here to 'ultra-Orthodox', which is a description imposed from outside. The community's near-blanket exemption from military service is the running dispute behind most of the religion-and-state block.",
    match: ["Haredi", "haredi"],
  },
  {
    key: "yeshiva",
    title: "Yeshiva",
    body: "An institution of full-time Talmudic study. Plural yeshivot. Enrolment has historically deferred military conscription indefinitely, which is what makes state funding of yeshivot a question about the draft as much as about education.",
    match: ["yeshiva students", "yeshivot", "yeshiva"],
  },
  {
    key: "hesder",
    title: "Hesder",
    body: "A programme combining yeshiva study with shortened military service, associated with the national-religious rather than the haredi world. It is the standing counter-example to the claim that Torah study and conscription cannot be combined.",
  },
  {
    key: "tal-law",
    title: "Tal Law",
    body: "The 2002 statute that codified haredi draft deferrals, struck down as unconstitutional in 2012. Every subsequent attempt to write a conscription law has failed, been annulled, or lapsed — the reason the exemption question keeps returning to the Knesset and the courts.",
  },
  {
    key: "rabbinate",
    title: "Chief Rabbinate",
    body: "The state Orthodox religious authority holding a legal monopoly over Jewish marriage, divorce and conversion in Israel. There is no civil marriage; couples who cannot or will not marry through it typically marry abroad, and the state then registers the foreign marriage.",
    match: ["Chief Rabbinate"],
  },
  {
    key: "halakha",
    title: "Halakha",
    body: "Jewish religious law. The question of what happens where it conflicts with Knesset legislation separates parties that treat the state as a secular framework from those that treat it as subordinate to religious authority.",
    match: ["halakha"],
  },
  {
    key: "shabbat",
    title: "Shabbat",
    body: "The Jewish sabbath, from Friday sunset to Saturday nightfall. Public transport largely stops nationally and most commerce closes, under arrangements inherited from the 1947 'status quo' agreement rather than from any single statute.",
    match: ["Shabbat"],
  },
  {
    key: "law-of-return",
    title: "Law of Return · grandchild clause",
    body: "The 1950 law granting automatic citizenship to Jews. A 1970 amendment extended it to the children and grandchildren of a Jew and their spouses — the 'grandchild clause' — which is how most of the post-Soviet immigration arrived. Narrowing it is a standing demand of the religious parties.",
    match: ["Law of Return's “grandchild clause”", "Law of Return", "grandchild clause"],
  },
  {
    key: "blocs",
    title: "Blocs",
    body: "Israeli coalition politics currently sorts less by left and right than by attitude to Netanyahu: a pro-Netanyahu bloc of Likud, the haredi parties and the religious right; an anti-Netanyahu Zionist bloc; and Arab parties that neither bloc has governed with since 2021. This is why the quiz reports Netanyahu separately from ideology.",
  },
];

const ESCAPE = /[.*+?^${}()|[\]\\]/g;

const SORTED_MATCHES: { phrase: string; key: string }[] = GLOSSARY
  .flatMap((t) => (t.match ?? []).map((phrase) => ({ phrase, key: t.key })))
  .sort((a, b) => b.phrase.length - a.phrase.length);

export const GLOSSARY_BY_KEY: Record<string, Term> = Object.fromEntries(
  GLOSSARY.map((t) => [t.key, t]),
);

const PATTERN = SORTED_MATCHES.length
  ? new RegExp(`(${SORTED_MATCHES.map((m) => m.phrase.replace(ESCAPE, "\\$&")).join("|")})`, "gi")
  : null;

export type TextPart = { text: string; term?: string };

/** Split a statement into plain runs and glossary-linked runs. */
export function annotate(text: string): TextPart[] {
  if (!PATTERN) return [{ text }];
  const parts: TextPart[] = [];
  let last = 0;
  PATTERN.lastIndex = 0;
  for (let m = PATTERN.exec(text); m; m = PATTERN.exec(text)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index) });
    const hit = SORTED_MATCHES.find((s) => s.phrase.toLowerCase() === m![0].toLowerCase());
    parts.push({ text: m[0], term: hit?.key });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
