import type {
  Persona,
  PerceiveEvent,
  ThinkEvent,
  ActEvent,
  VerdictEvent,
  PersonaStartedEvent,
  PersonaFinishedEvent,
  RunStatusEvent,
  RecommendationEvent,
  Recommendation,
} from "@/lib/schemas";

export type PersonaLive = {
  persona: Persona;
  status: "pending" | "running" | "done" | "error";
  outcome?: VerdictEvent["outcome"];
  rating?: number;
  reasons?: string[];
  finishReason?: PersonaFinishedEvent["reason"];
  steps: Array<
    | ({ kind: "perceive" } & PerceiveEvent)
    | ({ kind: "think" } & ThinkEvent)
    | ({ kind: "act" } & ActEvent)
    | ({ kind: "verdict" } & VerdictEvent)
  >;
};

export type RunState = {
  runId: string | null;
  status: "idle" | "queued" | "running" | "aggregating" | "complete" | "failed";
  personas: Map<string, PersonaLive>;
  recommendations: Recommendation[];
  message?: string;
};

export type StreamEvent =
  | PersonaStartedEvent
  | PersonaFinishedEvent
  | PerceiveEvent
  | ThinkEvent
  | ActEvent
  | VerdictEvent
  | RunStatusEvent
  | RecommendationEvent
  | { type: "hello"; runId: string; status: string };
