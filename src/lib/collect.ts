/* ============================================================
   Optional research collection — spec §6.5

   This is the one place in the app where an answer can leave the
   device, and it only does so when someone ticks a box and presses
   a button. Everything here is built around three rules from §6.5:

     1. Answers and demographics are two tables joined by a random
        response id, never one record (§6.5.1). The transport sends
        two objects; the server writes two rows.
     2. No free text is transmitted, ever (§6.5.4). The validation
        block's `tester` initials are free text about a person from
        a cohort of fifteen, so they are stripped here even though
        they sit in the same session object.
     3. The instrument collects political opinion alongside religion
        and ethnicity, which is special-category data under GDPR and
        UK GDPR (§6.5.6). That needs explicit, separable, revocable
        consent — hence two checkboxes, a recorded consent version,
        and a withdrawal path that works from the device that sent it.

   The endpoint is a build-time variable. With none set the whole
   feature is absent from the interface and the app behaves exactly
   as it did before: no fetch, no network, nothing to opt into.
   ============================================================ */

import { A5_VARIANT, ITEMS } from "../data/items";
import { VERSION, VERSION_DATE } from "../data/editorial";
import type { Demographics } from "../data/demographics";
import type { ScoreResult } from "./scoring";
import type { Session } from "./storage";

const RAW_ENDPOINT =
  typeof import.meta !== "undefined" && import.meta.env
    ? (import.meta.env.VITE_COLLECT_ENDPOINT as string | undefined)
    : undefined;

export const COLLECT_ENDPOINT = (RAW_ENDPOINT ?? "").trim();

/** With no endpoint configured the contribute section never renders. */
export function collectionEnabled(): boolean {
  return COLLECT_ENDPOINT !== "";
}

/**
 * Bump when the consent wording changes materially. Stored with every row so
 * a later reader can tell what each respondent was actually shown, which is
 * the whole point of recording consent rather than asserting it.
 */
export const CONSENT_VERSION = "consent-2026-08-10";

/** Stated in the consent text and enforced by a scheduled delete on the server. */
export const RETENTION_MONTHS = 24;

export const SUBMISSION_FORMAT = "israquiz.submission.v1";
export const WITHDRAWAL_FORMAT = "israquiz.withdrawal.v1";

export interface ResponseRow {
  responseId: string;
  /** presentation order, so order effects are measurable after the fact (§8.9) */
  order: string[];
  answers: Session["answers"];
  weights: Session["weights"];
  f1: Session["f1"];
  f2: Session["f2"];
  g: Session["g"];
  axes: ScoreResult["user"]["value"];
  ranking: { code: string; weighted: number; unweighted: number; coverage: number }[];
  blocs: ScoreResult["blocs"];
  /** validation runs only (§4.7): a party code from a fixed list, never free text */
  declared?: string;
}

export interface DemographicRow extends Demographics {
  responseId: string;
}

export interface Submission {
  format: typeof SUBMISSION_FORMAT;
  instrument: {
    version: string;
    versionDate: string;
    itemCount: number;
    a5Variant: string;
  };
  consent: {
    version: string;
    at: string;
    /** false = the respondent consented to the answers but not the background block */
    demographics: boolean;
  };
  responses: ResponseRow;
  demographics: DemographicRow | null;
}

export interface Withdrawal {
  format: typeof WITHDRAWAL_FORMAT;
  responseId: string;
}

export interface BuildArgs {
  session: Session;
  result: ScoreResult;
  order: string[];
  demographics: Demographics;
  includeDemographics: boolean;
  validation: boolean;
  now?: string;
}

function answeredDemographics(d: Demographics): boolean {
  return Object.values(d).some((v) => (Array.isArray(v) ? v.length > 0 : !!v));
}

export function hasDemographics(d: Demographics): boolean {
  return answeredDemographics(d);
}

/**
 * Build the payload. Deliberately not a spread of the session: every field is
 * named, so a field added to `Session` later cannot start transmitting itself.
 * `seed`, `index`, `stage`, `savedAt`, `submittedAt` and `tester` are all
 * absent by construction.
 */
export function buildSubmission({
  session,
  result,
  order,
  demographics,
  includeDemographics,
  validation,
  now,
}: BuildArgs): Submission {
  const send = includeDemographics && answeredDemographics(demographics);

  const responses: ResponseRow = {
    responseId: session.responseId,
    order,
    answers: session.answers,
    weights: session.weights,
    f1: session.f1,
    f2: session.f2,
    g: session.g,
    axes: result.user.value,
    ranking: [...result.ranked]
      .sort((a, b) => b.weighted - a.weighted)
      .map((r) => ({
        code: r.code,
        weighted: +r.weighted.toFixed(1),
        unweighted: +r.unweighted.toFixed(1),
        coverage: +r.coverage.toFixed(2),
      })),
    blocs: result.blocs,
  };

  // Declared vote is a party code chosen from a list, so it carries no free
  // text; the tester's initials, which sit beside it in the session, do.
  if (validation && session.declared) responses.declared = session.declared;

  return {
    format: SUBMISSION_FORMAT,
    instrument: {
      version: VERSION,
      versionDate: VERSION_DATE,
      itemCount: ITEMS.length,
      a5Variant: A5_VARIANT,
    },
    consent: {
      version: CONSENT_VERSION,
      at: now ?? new Date().toISOString(),
      demographics: send,
    },
    responses,
    demographics: send ? { responseId: session.responseId, ...demographics } : null,
  };
}

export interface SendResult {
  ok: boolean;
  error?: string;
}

async function post(body: unknown, endpoint: string): Promise<SendResult> {
  if (!endpoint) return { ok: false, error: "No collection endpoint is configured for this build." };
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      // No cookies, no credentials, no redirects followed to a third party.
      credentials: "omit",
      mode: "cors",
      cache: "no-store",
      redirect: "error",
    });
    if (!res.ok) {
      return {
        ok: false,
        error:
          res.status === 429
            ? "The server is rate-limiting submissions. Try again in a minute."
            : `The server refused the submission (HTTP ${res.status}).`,
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the server. Nothing was sent." };
  }
}

export function sendSubmission(s: Submission, endpoint = COLLECT_ENDPOINT): Promise<SendResult> {
  return post(s, endpoint);
}

/**
 * Erasure without an email round-trip. The response id lives on the device that
 * sent it, so the person who submitted is the only one who can name the row —
 * which makes self-service withdrawal both possible and safe.
 */
export function sendWithdrawal(responseId: string, endpoint = COLLECT_ENDPOINT): Promise<SendResult> {
  const body: Withdrawal = { format: WITHDRAWAL_FORMAT, responseId };
  return post(body, endpoint);
}
