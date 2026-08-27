/* ============================================================
   Save and resume — spec §8.10
   Everything stays on the device. Demographics are held under a
   separate key from the answer vector (§6.5.1) and joined only
   by a random response id, so the export can carry them as two
   tables rather than one fingerprint.
   ============================================================ */

import type { Answers, Weights } from "./scoring";
import type { Demographics } from "../data/demographics";

/**
 * Bump these whenever a change makes an in-flight session unresumable. v3
 * retired v2 because the block-order shuffle changed what a stored `seed`
 * produces: answers are keyed by item id so none are lost, but the stored
 * `index` points into a sequence that no longer exists, so a respondent
 * mid-quiz would be shown a statement they had already answered and skip one
 * they had not.
 *
 * v4 retires v3 for the same reason from a different cause: A15 was added to
 * the bank, so the shuffle now produces a 49-item sequence where the stored
 * index addresses a 48-item one. Every saved session is a session that never
 * saw A15, and resuming one would silently produce a result computed over a
 * different questionnaire from the one it started.
 *
 * v5 retires v4 on the same grounds for A16. Two bank additions inside a month
 * is more churn than §8.10 anticipated, and the September revision should be
 * the last one before the election that does this to a saved session.
 */
const SESSION_KEY = "israquiz.session.v5";
const DEMO_KEY = "israquiz.demographics.v5";

/**
 * Superseded keys, deleted on first load. Leaving them would strand answer and
 * demographic vectors in the browser forever, unreachable by Start over and so
 * undeletable from inside the app — poor practice for anything, and worse for
 * a block that collects religion, ethnicity and political opinion (§6.5).
 */
const LEGACY_KEYS = [
  "israquiz.session.v2",
  "israquiz.demographics.v2",
  "israquiz.session.v3",
  "israquiz.demographics.v3",
  "israquiz.session.v4",
  "israquiz.demographics.v4",
];

export interface Session {
  responseId: string;
  seed: number;
  index: number;
  answers: Answers;
  weights: Weights;
  f1: -1 | 0 | 1 | null;
  f2: -1 | 0 | 1 | null;
  /** block G cross-cutting answers, keyed by item id */
  g: Record<string, -1 | 0 | 1 | null>;
  stage: string;
  /** validation mode only (§4.7) */
  declared?: string;
  tester?: string;
  savedAt: string;
  /**
   * ISO timestamp of an opt-in research submission, or absent/null if this
   * response was never sent or has since been withdrawn. Held on the device
   * so the results page can offer withdrawal instead of a second submission.
   */
  submittedAt?: string | null;
}

export function newResponseId(): string {
  const c = globalThis.crypto;
  if (c && "randomUUID" in c) return c.randomUUID();
  return `r-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode, quota, or storage disabled — the quiz still works, it just won't resume */
  }
}

/** Remove superseded keys. Idempotent, and safe where storage is unavailable. */
export function purgeLegacy(): void {
  try {
    for (const key of LEGACY_KEYS) localStorage.removeItem(key);
  } catch {
    /* storage disabled — nothing to purge */
  }
}

export const loadSession = () => {
  purgeLegacy();
  return read<Session>(SESSION_KEY);
};
export const saveSession = (s: Session) => write(SESSION_KEY, s);
export const loadDemographics = () => read<Demographics>(DEMO_KEY);
export const saveDemographics = (d: Demographics) => write(DEMO_KEY, d);

export function clearAll(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(DEMO_KEY);
  } catch {
    /* nothing to clear */
  }
  purgeLegacy();
}
