/* ============================================================
   Optional demographic block — spec §6
   Shown after the results, never before and never as a gate.
   Every question carries "Prefer not to say"; a single "Skip all"
   control sits at the same visual weight as submit.
   No free-text fields anywhere (§6.5.4).
   ============================================================ */

export type Demographics = Record<string, string | string[]>;

export interface DemoQuestion {
  id: string;
  label: string;
  help?: string;
  options: string[];
  multi?: boolean;
  /** shown only when this predicate passes */
  when?: (d: Demographics) => boolean;
}

const PNTS = "Prefer not to say";

const isIn = (d: Demographics) => d.D0 === "Israel";
const isOut = (d: Demographics) => d.D0 === "Outside Israel";
const isJewish = (d: Demographics) => d.D3 === "Jewish";
const isAbrahamicMinority = (d: Demographics) =>
  d.D3 === "Muslim" || d.D3 === "Christian" || d.D3 === "Druze";

export const DEMO_QUESTIONS: DemoQuestion[] = [
  {
    id: "D0",
    label: "Where are you answering from?",
    options: ["Israel", "Outside Israel", PNTS],
  },
  {
    id: "D1",
    label: "Age",
    options: ["18–24", "25–34", "35–44", "45–54", "55–64", "65–74", "75+", PNTS],
  },
  {
    id: "D2",
    label: "Gender",
    options: ["Man", "Woman", "Another term", PNTS],
  },
  {
    id: "D3",
    label: "Religion",
    options: ["Jewish", "Muslim", "Christian", "Druze", "None / secular / atheist / agnostic", "Other", PNTS],
  },
  {
    id: "D4",
    label: "Religious observance",
    help: "The standard CBS and Israel Democracy Institute ladder. It predicts vote better than religion, ethnicity or income — if you answer only one question in this block, answer this one.",
    when: isJewish,
    options: [
      "Haredi",
      "Hardal (haredi-national)",
      "Dati / national-religious",
      "Masorti-dati (traditional-religious)",
      "Masorti (traditional, less observant)",
      "Hiloni (secular)",
      PNTS,
    ],
  },
  {
    id: "D4b",
    label: "Religious observance",
    when: isAbrahamicMinority,
    options: ["Very religious", "Religious", "Not very religious", "Not religious", PNTS],
  },
  {
    id: "D5",
    label: "Education",
    help: "Yeshiva, kollel and seminary study is listed on its own. Without it, haredi men get coded as low-education, which is a well-known way to produce a crosstab that is quietly wrong.",
    options: [
      "No matriculation",
      "Bagrut / secondary",
      "Post-secondary, non-academic",
      "Bachelor's",
      "Master's or above",
      "Yeshiva / kollel / seminary",
      PNTS,
    ],
  },
  {
    id: "D6",
    label: "Community / background",
    help: "Select as many as apply — mixed background is common.",
    multi: true,
    options: [
      "Ashkenazi",
      "Mizrahi / Sephardi",
      "Russian-speaking / FSU",
      "Ethiopian-Israeli",
      "Arab",
      "Bedouin",
      "Druze",
      "Circassian",
      "Other",
      PNTS,
    ],
  },
  {
    id: "D7",
    label: "District",
    when: isIn,
    options: [
      "Jerusalem",
      "Tel Aviv",
      "Central (Merkaz)",
      "Haifa",
      "North",
      "South",
      "West Bank / Judea & Samaria settlement",
      PNTS,
    ],
  },
  {
    id: "D8",
    label: "Community type",
    when: isIn,
    options: ["Large city", "Small city or town", "Local council", "Kibbutz or moshav", "Unrecognised village", PNTS],
  },
  {
    id: "D9",
    label: "Military or national service",
    help: "Unusually predictive in Israel, and central to the draft-exemption fight running through the whole religion-and-state block.",
    when: isIn,
    options: [
      "Combat service",
      "Non-combat service",
      "Sherut leumi (national service)",
      "Currently serving",
      "Currently in reserves",
      "Exempt or did not serve",
      PNTS,
    ],
  },
  {
    id: "D10",
    label: "Immigration",
    when: isIn,
    options: [
      "Born in Israel",
      "Immigrated before 1990",
      "1990–1999",
      "2000–2009",
      "2010–2019",
      "2020 or later",
      PNTS,
    ],
  },
  {
    id: "D11",
    label: "Country",
    when: isOut,
    options: [
      "United States",
      "Canada",
      "United Kingdom",
      "France",
      "Australia",
      "Germany",
      "South Africa",
      "Argentina",
      "Brazil",
      "Russia",
      "Ukraine",
      "Other",
      PNTS,
    ],
  },
  {
    id: "D13",
    label: "Do you hold Israeli citizenship?",
    when: isOut,
    options: ["Yes", "No", PNTS],
  },
  {
    id: "D14",
    label: "Will you be voting in this election?",
    help: "Israel has no general absentee voting. Separating people who will cast a ballot from people who will not is what stops an aggregate of these answers from being read as a poll of the Israeli electorate.",
    when: isOut,
    options: ["Yes", "No", "Not eligible", PNTS],
  },
  {
    id: "D15",
    label: "Which party did you vote for in November 2022?",
    help: "Recalled vote, always — people misremember in the direction of their current preference.",
    options: [
      "Likud",
      "Yesh Atid",
      "Religious Zionism (joint list)",
      "National Unity",
      "Shas",
      "United Torah Judaism",
      "Yisrael Beiteinu",
      "Ra'am",
      "Hadash–Ta'al",
      "Labor",
      "Meretz",
      "Balad",
      "The Jewish Home",
      "Another party",
      "Did not vote",
      "Not eligible",
      PNTS,
    ],
  },
];

/**
 * Two versions, because the first one stopped being true.
 *
 * This screen is where someone answers questions about religion, observance and
 * community background, and it used to promise those answers stayed in the
 * browser. With collection built that is false — the second tick-box on the
 * results page sends exactly these answers — and the flow makes it worse, since
 * the promise is read first and the offer to transmit comes afterwards. Which
 * string is shown follows `collectionEnabled()`, the same way STORAGE_LIMIT in
 * editorial.ts already does.
 */
export const CONSENT = {
  local: `These questions are optional and come after your result, never before it. Answers stay in this browser unless you copy them out yourself. Nothing here asks for your name, and there are no free-text fields. If any of it feels like too much, skip the whole block — the button is right there, the same size as the other one.`,
  collected: `These questions are optional and come after your result, never before it. Nothing here asks for your name, and there are no free-text fields. Answering here sends nothing: these answers stay on this device unless you decide to contribute them, which is a separate tick-box on the results page and a separate decision. If any of it feels like too much, skip the whole block — the button is right there, the same size as the other one.`,
};

export function visibleQuestions(d: Demographics): DemoQuestion[] {
  return DEMO_QUESTIONS.filter((q) => !q.when || q.when(d));
}
