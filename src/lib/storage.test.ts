import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAll, loadDemographics, loadSession, newResponseId,
  purgeLegacy, saveDemographics, saveSession, type Session,
} from "./storage";
import { DEFAULT_WEIGHTS } from "./scoring";

/** Minimal localStorage stand-in; the suite runs in node, not jsdom. */
function installStorage(): Map<string, string> {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
    },
  });
  return store;
}

const session = (): Session => ({
  responseId: newResponseId(),
  seed: 7,
  index: 3,
  answers: { A1: 2, B1: -1 },
  weights: { ...DEFAULT_WEIGHTS },
  f1: 1,
  f2: null,
  g: { G2: -1 },
  stage: "quiz",
  savedAt: "2026-08-09T00:00:00.000Z",
});

let store: Map<string, string>;
beforeEach(() => {
  store = installStorage();
});

describe("session storage", () => {
  it("round-trips a session", () => {
    const s = session();
    saveSession(s);
    expect(loadSession()).toEqual(s);
  });

  it("keeps demographics under a separate key from the answers (§6.5.1)", () => {
    saveSession(session());
    saveDemographics({ D0: "Israel", D6: ["Mizrahi / Sephardi"] });
    const keys = [...store.keys()];
    expect(keys).toHaveLength(2);
    expect(new Set(keys).size).toBe(2);
    // neither blob may contain the other's fields
    const sessionBlob = store.get(keys.find((k) => k.includes("session"))!)!;
    expect(sessionBlob).not.toContain("Mizrahi");
  });

  it("returns null rather than throwing on corrupt data", () => {
    store.set("israquiz.session.v4", "{not json");
    expect(loadSession()).toBeNull();
  });

  it("clears both keys on start over", () => {
    saveSession(session());
    saveDemographics({ D0: "Israel" });
    clearAll();
    expect(loadSession()).toBeNull();
    expect(loadDemographics()).toBeNull();
  });
});

describe("version bump to v3", () => {
  it("does not read a v2 session as current", () => {
    store.set("israquiz.session.v2", JSON.stringify(session()));
    expect(loadSession()).toBeNull();
  });

  /**
   * A stale v2 session holds a seed whose ordering no longer exists and, in the
   * demographics key, special-category data. Leaving either behind would strand
   * it in the browser with no way to delete it from inside the app.
   */
  it("deletes superseded keys on first load", () => {
    store.set("israquiz.session.v2", "{}");
    store.set("israquiz.demographics.v2", '{"D3":"Jewish"}');
    loadSession();
    expect(store.has("israquiz.session.v2")).toBe(false);
    expect(store.has("israquiz.demographics.v2")).toBe(false);
  });

  it("leaves the current keys alone when purging", () => {
    const s = session();
    saveSession(s);
    purgeLegacy();
    expect(loadSession()).toEqual(s);
  });
});

describe("storage unavailable", () => {
  it("degrades to no-resume rather than breaking the quiz", () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("storage disabled");
      },
    });
    expect(() => saveSession(session())).not.toThrow();
    expect(() => clearAll()).not.toThrow();
    expect(loadSession()).toBeNull();
  });
});

describe("response ids", () => {
  it("are unique, so the two tables join on nothing guessable", () => {
    const ids = new Set(Array.from({ length: 500 }, newResponseId));
    expect(ids.size).toBe(500);
  });
});
