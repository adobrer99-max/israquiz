/* ============================================================
   Save and resume — spec §8.10
   Everything stays on the device. Demographics are held under a
   separate key from the answer vector (§6.5.1) and joined only
   by a random response id, so the export can carry them as two
   tables rather than one fingerprint.
   ============================================================ */

import type { Answers, Weights } from "./scoring";
import type { Demographics } from "../data/demographics";

const SESSION_KEY = "israquiz.session.v2";
const DEMO_KEY = "israquiz.demographics.v2";

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

export const loadSession = () => read<Session>(SESSION_KEY);
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
}
