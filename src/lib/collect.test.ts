import { describe, expect, it, vi } from "vitest";
import {
  buildSubmission, CONSENT_VERSION, hasDemographics, sendSubmission, sendWithdrawal,
  SUBMISSION_FORMAT, WITHDRAWAL_FORMAT, type BuildArgs,
} from "./collect";
import { DEFAULT_WEIGHTS, score, type Answers } from "./scoring";
import { newResponseId, type Session } from "./storage";
import { ITEMS } from "../data/items";
import type { Demographics } from "../data/demographics";

const answers: Answers = Object.fromEntries(
  ITEMS.map((it, i) => [it.id, ((i % 5) - 2) as -2 | -1 | 0 | 1 | 2]),
);

const session = (over: Partial<Session> = {}): Session => ({
  responseId: newResponseId(),
  seed: 12345,
  index: ITEMS.length,
  answers,
  weights: { ...DEFAULT_WEIGHTS },
  f1: 1,
  f2: -1,
  g: { G1: 1, G2: 0, G3: -1 },
  stage: "results",
  savedAt: "2026-08-10T00:00:00.000Z",
  ...over,
});

const demo: Demographics = {
  D0: "Israel",
  D3: "Jewish",
  D4: "Masorti (traditional, less observant)",
  D6: ["Mizrahi / Sephardi", "Ashkenazi"],
  D15: "Likud",
};

function build(over: Partial<BuildArgs> = {}) {
  const s = over.session ?? session();
  return buildSubmission({
    session: s,
    result: score(s.answers, s.weights),
    order: ITEMS.map((i) => i.id),
    demographics: {},
    includeDemographics: false,
    validation: false,
    now: "2026-08-10T09:00:00.000Z",
    ...over,
  });
}

describe("payload shape (§6.5.1)", () => {
  it("carries two objects joined only by the response id", () => {
    const s = session();
    const sub = build({ session: s, demographics: demo, includeDemographics: true });
    expect(sub.format).toBe(SUBMISSION_FORMAT);
    expect(sub.responses.responseId).toBe(s.responseId);
    expect(sub.demographics?.responseId).toBe(s.responseId);
    // the answer vector must not appear inside the demographic row, or the
    // "two tables" claim is decoration
    expect(Object.keys(sub.demographics!)).not.toContain("answers");
    expect(Object.keys(sub.responses)).not.toContain("D3");
  });

  it("omits demographics entirely when consent for them was withheld", () => {
    const sub = build({ demographics: demo, includeDemographics: false });
    expect(sub.demographics).toBeNull();
    expect(sub.consent.demographics).toBe(false);
    expect(JSON.stringify(sub)).not.toContain("Mizrahi");
  });

  it("omits them when the block was skipped, even if consent was given", () => {
    const sub = build({ demographics: {}, includeDemographics: true });
    expect(sub.demographics).toBeNull();
    expect(sub.consent.demographics).toBe(false);
  });
});

describe("what is never transmitted", () => {
  it("strips the validation tester's initials (§6.5.4 — no free text)", () => {
    const s = session({ declared: "LIK", tester: "YS" });
    const wire = JSON.stringify(build({ session: s, validation: true }));
    expect(wire).not.toContain("tester");
    expect(wire).not.toContain('"YS"');
  });

  it("keeps the declared vote, which is a code from a fixed list", () => {
    const s = session({ declared: "LIK", tester: "YS" });
    expect(build({ session: s, validation: true }).responses.declared).toBe("LIK");
  });

  it("does not leak the declared vote outside validation runs", () => {
    const s = session({ declared: "LIK" });
    expect(build({ session: s, validation: false }).responses.declared).toBeUndefined();
  });

  it("drops device-progress fields that describe the session rather than the person", () => {
    const wire = JSON.stringify(build());
    for (const field of ["seed", "index", "savedAt", "stage", "submittedAt"]) {
      expect(wire).not.toContain(`"${field}"`);
    }
  });

  /**
   * The payload names its fields rather than spreading the session, so a field
   * added to Session later cannot start transmitting itself. This pins that.
   */
  it("ignores unknown fields bolted onto the session", () => {
    const s = { ...session(), homeAddress: "12 Rothschild Blvd" } as unknown as Session;
    expect(JSON.stringify(build({ session: s }))).not.toContain("Rothschild");
  });
});

describe("consent record", () => {
  it("stamps the version and time on every submission", () => {
    const sub = build();
    expect(sub.consent.version).toBe(CONSENT_VERSION);
    expect(sub.consent.at).toBe("2026-08-10T09:00:00.000Z");
  });

  it("records the instrument version, so rows from different item banks stay separable", () => {
    const sub = build();
    expect(sub.instrument.itemCount).toBe(ITEMS.length);
    expect(sub.instrument.a5Variant).toBeTruthy();
  });
});

describe("hasDemographics", () => {
  it("treats an empty multi-select and a cleared answer as unanswered", () => {
    expect(hasDemographics({})).toBe(false);
    expect(hasDemographics({ D6: [], D0: "" })).toBe(false);
    expect(hasDemographics({ D6: ["Arab"] })).toBe(true);
  });
});

describe("transport", () => {
  it("refuses to send when no endpoint is configured", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const res = await sendSubmission(build(), "");
    expect(res.ok).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("posts JSON with no credentials", async () => {
    const fetchSpy = vi.fn(async (_url: string, _init?: RequestInit) => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const res = await sendSubmission(build(), "https://example.invalid/submit");
    expect(res.ok).toBe(true);
    const init = fetchSpy.mock.calls[0][1]!;
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("omit");
    vi.unstubAllGlobals();
  });

  it("reports a refusal rather than pretending the send worked", async () => {
    vi.stubGlobal("fetch", async () => new Response("no", { status: 500 }));
    const res = await sendSubmission(build(), "https://example.invalid/submit");
    expect(res.ok).toBe(false);
    expect(res.error).toContain("500");
    vi.unstubAllGlobals();
  });

  it("survives a network failure without throwing", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new Error("offline");
    });
    const res = await sendSubmission(build(), "https://example.invalid/submit");
    expect(res.ok).toBe(false);
    vi.unstubAllGlobals();
  });

  it("sends a withdrawal carrying the id and nothing else", async () => {
    const fetchSpy = vi.fn(async (_url: string, _init?: RequestInit) => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    await sendWithdrawal("abc-123", "https://example.invalid/submit");
    const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    expect(body).toEqual({ format: WITHDRAWAL_FORMAT, responseId: "abc-123" });
    vi.unstubAllGlobals();
  });
});
