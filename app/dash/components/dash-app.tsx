"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PersonaLive, RunState, StreamEvent } from "./types";
import { RunHeader } from "./run-header";
import { PersonaGrid } from "./persona-grid";
import { PersonaDetail } from "./persona-detail";
import { RecommendationsPanel } from "./recommendations-panel";
import { FunnelChart } from "./funnel-chart";

export function DashApp() {
  const [state, setState] = useState<RunState>({
    runId: null,
    status: "idle",
    personas: new Map(),
    recommendations: [],
  });
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      esRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const runId = url.searchParams.get("runId");
    if (!runId) return;
    const paced = url.searchParams.get("paced") === "1";
    openStream(runId, { paced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRun = async () => {
    setIsLaunching(true);
    setSelectedPersonaId(null);
    setState({ runId: null, status: "queued", personas: new Map(), recommendations: [] });
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("failed to create run");
      const { runId } = (await res.json()) as { runId: string };
      openStream(runId);
    } catch (e) {
      setState((s) => ({ ...s, status: "failed", message: String(e) }));
    } finally {
      setIsLaunching(false);
    }
  };

  const replayDemo = () => {
    setSelectedPersonaId(null);
    openStream("fixture", { paced: true });
  };

  const openStream = (runId: string, opts: { paced?: boolean } = {}) => {
    esRef.current?.close();
    setState({ runId, status: "running", personas: new Map(), recommendations: [] });

    const qs = opts.paced ? "?paced=1" : "";
    const es = new EventSource(`/api/runs/${runId}/sse${qs}`);
    esRef.current = es;

    es.onmessage = (ev) => {
      if (!ev.data) return;
      let event: StreamEvent;
      try {
        event = JSON.parse(ev.data);
      } catch {
        return;
      }
      setState((prev) => applyEvent(prev, event));
    };

    es.onerror = () => {
      es.close();
    };
  };

  const personas = useMemo(() => Array.from(state.personas.values()), [state.personas]);
  const selected = selectedPersonaId ? state.personas.get(selectedPersonaId) ?? null : null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <RunHeader
        state={state}
        isLaunching={isLaunching}
        onRun={startRun}
        onReplay={replayDemo}
        personaCount={personas.length}
      />

      {personas.length > 0 && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_2fr]">
          <PersonaGrid
            personas={personas}
            selectedId={selectedPersonaId}
            onSelect={setSelectedPersonaId}
          />
          <div className="space-y-6">
            {selected ? (
              <PersonaDetail live={selected} />
            ) : (
              <EmptyPanel
                title="Click a persona to see their journey"
                hint="You'll see screenshots, step-by-step thoughts, and the final verdict."
              />
            )}
            <FunnelChart personas={personas} />
          </div>
        </div>
      )}

      {personas.length > 0 && (
        <div className="mt-6">
          <RecommendationsPanel
            recommendations={state.recommendations}
            status={state.status}
          />
        </div>
      )}
    </div>
  );
}

function EmptyPanel({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="text-base font-medium text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{hint}</p>
    </div>
  );
}

function applyEvent(prev: RunState, event: StreamEvent): RunState {
  if (event.type === "hello") {
    return { ...prev, runId: event.runId };
  }
  if (event.type === "run_status") {
    return { ...prev, status: event.status, message: event.message };
  }
  if (event.type === "recommendations") {
    return { ...prev, recommendations: event.recommendations };
  }
  if (event.type === "persona_started") {
    const next = new Map(prev.personas);
    next.set(event.personaId, {
      persona: event.persona,
      status: "running",
      steps: [],
    });
    return { ...prev, personas: next };
  }
  if (event.type === "persona_finished") {
    const next = new Map(prev.personas);
    const existing = next.get(event.personaId);
    if (existing) {
      next.set(event.personaId, {
        ...existing,
        status: event.reason === "error" ? "error" : "done",
        finishReason: event.reason,
      });
    }
    return { ...prev, personas: next };
  }

  const stepEvents: StreamEvent["type"][] = ["perceive", "think", "act", "verdict"];
  if (!stepEvents.includes(event.type)) return prev;

  const personaEvent = event as PersonaStepEvent;
  const next = new Map(prev.personas);
  const existing = next.get(personaEvent.personaId);
  if (!existing) return prev;
  const updated: PersonaLive = {
    ...existing,
    steps: [...existing.steps, { ...personaEvent, kind: personaEvent.type } as PersonaLive["steps"][number]],
    ...(personaEvent.type === "verdict"
      ? {
          outcome: personaEvent.outcome,
          rating: personaEvent.rating,
          reasons: personaEvent.reasons,
        }
      : {}),
  };
  next.set(personaEvent.personaId, updated);
  return { ...prev, personas: next };
}

type PersonaStepEvent = Extract<
  StreamEvent,
  { type: "perceive" | "think" | "act" | "verdict" }
>;
