import { useCallback, useEffect, useMemo, useState } from "react";
import { Intro } from "./components/Intro";
import { Question } from "./components/Question";
import { Weights } from "./components/Weights";
import { Results } from "./components/Results";
import { Demographics } from "./components/Demographics";
import { Matrix } from "./components/Matrix";
import { Diagnostics, EditorialNotes, GlossaryPage } from "./components/Reference";
import { Sheet } from "./components/Sheet";
import { VERSION, VERSION_DATE } from "./data/editorial";
import type { Demographics as Demo } from "./data/demographics";
import { orderedItems, newSeed } from "./lib/shuffle";
import { DEFAULT_WEIGHTS, score, type Answer, type Answers, type Weights as W } from "./lib/scoring";
import { buildSubmission, collectionEnabled, hasDemographics } from "./lib/collect";
import {
  clearAll, loadDemographics, loadSession, newResponseId, saveDemographics, saveSession,
  type Session,
} from "./lib/storage";

type Stage = "intro" | "quiz" | "weights" | "results" | "demographics";
type Reference = null | { kind: "glossary"; focus?: string } | { kind: "matrix" } | { kind: "notes" } | { kind: "diagnostics" };

const REF_TITLE: Record<string, string> = {
  glossary: "Glossary",
  matrix: "The full coding matrix",
  notes: "Editorial notes",
  diagnostics: "Instrument diagnostics",
};

function freshSession(): Session {
  return {
    responseId: newResponseId(),
    seed: newSeed(),
    index: 0,
    answers: {},
    weights: { ...DEFAULT_WEIGHTS },
    f1: null,
    f2: null,
    g: {},
    stage: "intro",
    savedAt: new Date().toISOString(),
  };
}

export default function App() {
  const validation = useMemo(
    () => new URLSearchParams(window.location.search).has("validate"),
    [],
  );

  const [saved] = useState(() => loadSession());
  const [session, setSession] = useState<Session>(() => saved ?? freshSession());
  const [stage, setStage] = useState<Stage>("intro");
  const [demo, setDemo] = useState<Demo>(() => loadDemographics() ?? {});
  const [reference, setReference] = useState<Reference>(null);

  const items = useMemo(() => orderedItems(session.seed), [session.seed]);
  const result = useMemo(() => score(session.answers, session.weights), [session.answers, session.weights]);

  const patch = useCallback((p: Partial<Session>) => {
    setSession((s) => {
      const next = { ...s, ...p, savedAt: new Date().toISOString() };
      saveSession(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (stage !== "intro") patch({ stage });
  }, [stage, patch]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [stage, session.index]);

  const savedCount = saved ? Object.keys(saved.answers).length : 0;

  const start = () => {
    const s = freshSession();
    s.declared = session.declared;
    s.tester = session.tester;
    clearAll();
    setDemo({});
    setSession(s);
    saveSession(s);
    setStage("quiz");
  };

  const resume = () => {
    if (!saved) return;
    setSession(saved);
    const s = saved.stage as Stage;
    setStage(s === "intro" ? "quiz" : s);
  };

  const answer = (v: Answer) => {
    const id = items[session.index].id;
    const answers: Answers = { ...session.answers, [id]: v };
    if (session.index + 1 < items.length) {
      patch({ answers, index: session.index + 1 });
    } else {
      patch({ answers });
      setStage("weights");
    }
  };

  const payload = useMemo(
    () =>
      JSON.stringify(
        {
          version: VERSION,
          versionDate: VERSION_DATE,
          responseId: session.responseId,
          // §6.5.1 — two tables, joined only by responseId.
          responses: {
            responseId: session.responseId,
            order: items.map((i) => i.id),
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
            ...(validation
              ? {
                  tester: session.tester ?? "",
                  declared: session.declared ?? "",
                  declaredRank:
                    [...result.ranked].sort((a, b) => b.weighted - a.weighted)
                      .findIndex((r) => r.code === session.declared) + 1 || null,
                }
              : {}),
          },
          demographics: Object.keys(demo).length ? { responseId: session.responseId, ...demo } : null,
        },
        null,
        1,
      ),
    [session, result, demo, items, validation],
  );

  /**
   * §6.5 — absent entirely unless this build was given an endpoint, so a
   * default build has no route out of the browser and no box to tick.
   */
  const contribute = useMemo(() => {
    if (!collectionEnabled()) return undefined;
    return {
      build: (includeDemographics: boolean) =>
        buildSubmission({
          session,
          result,
          order: items.map((i) => i.id),
          demographics: demo,
          includeDemographics,
          validation,
        }),
      responseId: session.responseId,
      hasDemographics: hasDemographics(demo),
      submittedAt: session.submittedAt ?? null,
      onSubmitted: (at: string | null) => patch({ submittedAt: at }),
    };
  }, [session, result, items, demo, validation, patch]);

  const openTerm = (focus: string) => setReference({ kind: "glossary", focus });

  const wide = reference?.kind === "matrix" || reference?.kind === "diagnostics";

  return (
    <>
      <div className={`shell${wide ? " wide" : ""}`}>
        {stage === "intro" && (
          <Intro
            onStart={start}
            onResume={resume}
            hasSaved={!!saved && savedCount > 0}
            savedCount={savedCount}
            validation={validation}
            declared={session.declared ?? ""}
            setDeclared={(v) => patch({ declared: v })}
            tester={session.tester ?? ""}
            setTester={(v) => patch({ tester: v })}
          />
        )}

        {stage === "quiz" && (
          <Question
            item={items[session.index]}
            index={session.index}
            total={items.length}
            value={session.answers[items[session.index].id]}
            onAnswer={answer}
            onBack={() => patch({ index: Math.max(0, session.index - 1) })}
            onTerm={openTerm}
          />
        )}

        {stage === "weights" && (
          <Weights
            weights={session.weights}
            setWeights={(w: W) => patch({ weights: w })}
            f1={session.f1}
            setF1={(v) => patch({ f1: v })}
            f2={session.f2}
            setF2={(v) => patch({ f2: v })}
            g={session.g}
            setG={(id, v) => patch({ g: { ...session.g, [id]: v } })}
            onDone={() => setStage("results")}
          />
        )}

        {stage === "results" && (
          <Results
            result={result}
            answers={session.answers}
            weights={session.weights}
            f1={session.f1}
            f2={session.f2}
            g={session.g}
            declared={session.declared ?? ""}
            validation={validation}
            onTerm={openTerm}
            onDemographics={() => setStage("demographics")}
            onRestart={start}
            payload={payload}
            contribute={contribute}
          />
        )}

        {stage === "demographics" && (
          <Demographics
            value={demo}
            setValue={(d) => {
              setDemo(d);
              saveDemographics(d);
            }}
            onDone={() => setStage("results")}
            onSkip={() => {
              setDemo({});
              saveDemographics({});
              setStage("results");
            }}
          />
        )}

        <nav className="nav no-print" aria-label="Reference">
          <button onClick={() => setReference({ kind: "glossary" })}>Glossary</button>
          <button onClick={() => setReference({ kind: "matrix" })}>Coding matrix</button>
          <button onClick={() => setReference({ kind: "notes" })}>Editorial notes</button>
          <button onClick={() => setReference({ kind: "diagnostics" })}>Diagnostics</button>
          <span className="muted mono tiny" style={{ marginLeft: "auto" }}>
            {VERSION}
          </span>
        </nav>
      </div>

      {reference && (
        <Sheet title={REF_TITLE[reference.kind]} onClose={() => setReference(null)}>
          {reference.kind === "glossary" && <GlossaryPage focus={reference.focus} />}
          {reference.kind === "matrix" && <Matrix />}
          {reference.kind === "notes" && <EditorialNotes />}
          {reference.kind === "diagnostics" && <Diagnostics />}
        </Sheet>
      )}
    </>
  );
}
