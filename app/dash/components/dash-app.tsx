"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PersonaLive, RunState, StreamEvent } from "./types";
import {
  deriveEmergingThemes,
  deriveExecutiveSummary,
  selectFocusPersona,
} from "./insights";
import { RunHeader } from "./run-header";
import { ExecutiveSummary } from "./executive-summary";
import { EmergingThemes } from "./emerging-themes";
import { FocusRail } from "./focus-rail";
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

  const openStream = useCallback((runId: string, opts: { paced?: boolean } = {}) => {
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
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const runId = url.searchParams.get("runId");
    if (!runId) return;
    const paced = url.searchParams.get("paced") === "1";
    openStream(runId, { paced });
  }, [openStream]);

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

  const personas = useMemo(() => Array.from(state.personas.values()), [state.personas]);
  const summary = useMemo(() => deriveExecutiveSummary(state), [state]);
  const themes = useMemo(() => deriveEmergingThemes(state), [state]);
  const focus = useMemo(
    () => selectFocusPersona(personas, selectedPersonaId),
    [personas, selectedPersonaId],
  );

  return (
    <div className="mx-auto flex min-w-0 max-w-[1500px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <RunHeader
        state={state}
        isLaunching={isLaunching}
        onRun={startRun}
        onReplay={replayDemo}
        personaCount={personas.length}
      />

      <ExecutiveSummary summary={summary} status={state.status} themes={themes} />

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        <div className="min-w-0">
          <PersonaGrid
            personas={personas}
            selectedId={selectedPersonaId}
            onSelect={setSelectedPersonaId}
          />
        </div>

        <div className="min-w-0 space-y-6">
          <FocusRail live={focus} status={state.status} />
          <EmergingThemes themes={themes} status={state.status} />
          <FunnelChart personas={personas} />
          {focus && <PersonaDetail live={focus} />}
        </div>
      </div>

      <RecommendationsPanel recommendations={state.recommendations} status={state.status} />
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
