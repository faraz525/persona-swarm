import { z } from "zod";

export const personaSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  role: z.string(),
  primary_goal: z.string(),
  time_budget_seconds: z.number().int().positive().max(600),
  objections: z.array(z.string()),
  technical_level: z.enum(["low", "low-medium", "medium", "medium-high", "high"]),
  voice: z.string(),
  success_criteria: z.string(),
});

export type Persona = z.infer<typeof personaSchema>;

export const baseEventFields = {
  personaId: z.string(),
  step: z.number().int().nonnegative(),
  ts: z.string(),
};

export const perceiveEventSchema = z.object({
  type: z.literal("perceive"),
  ...baseEventFields,
  screenshotPath: z.string(),
  visibleText: z.string(),
  viewport: z.object({
    url: z.string(),
    title: z.string(),
    scrollY: z.number(),
    pageHeight: z.number(),
  }),
});

export const thinkEventSchema = z.object({
  type: z.literal("think"),
  ...baseEventFields,
  thought: z.string(),
  sentiment: z.number().min(-1).max(1),
  confusion: z.number().min(0).max(1),
});

export const actEventSchema = z.object({
  type: z.literal("act"),
  ...baseEventFields,
  action: z.enum(["click", "scroll", "type", "hover", "snapshot", "done"]),
  target: z.string(),
  rationale: z.string(),
});

export const verdictEventSchema = z.object({
  type: z.literal("verdict"),
  ...baseEventFields,
  outcome: z.enum(["converted", "bounced", "confused"]),
  reasons: z.array(z.string()).min(1).max(5),
  rating: z.number().int().min(1).max(5),
});

export const personaStartedEventSchema = z.object({
  type: z.literal("persona_started"),
  ...baseEventFields,
  persona: personaSchema,
});

export const personaFinishedEventSchema = z.object({
  type: z.literal("persona_finished"),
  ...baseEventFields,
  durationMs: z.number(),
  reason: z.enum(["verdict", "timeout", "step_cap", "error"]),
});

export const runStatusEventSchema = z.object({
  type: z.literal("run_status"),
  ts: z.string(),
  runId: z.string(),
  status: z.enum(["queued", "running", "aggregating", "complete", "failed"]),
  message: z.string().optional(),
});

export const recommendationEventSchema = z.object({
  type: z.literal("recommendations"),
  ts: z.string(),
  runId: z.string(),
  recommendations: z.array(
    z.object({
      id: z.string(),
      severity: z.enum(["high", "medium", "low"]),
      affectedPersonas: z.array(z.string()),
      title: z.string(),
      detail: z.string(),
      suggestedChange: z.string(),
    }),
  ),
});

export const eventSchema = z.discriminatedUnion("type", [
  perceiveEventSchema,
  thinkEventSchema,
  actEventSchema,
  verdictEventSchema,
  personaStartedEventSchema,
  personaFinishedEventSchema,
  runStatusEventSchema,
  recommendationEventSchema,
]);

export type PerceiveEvent = z.infer<typeof perceiveEventSchema>;
export type ThinkEvent = z.infer<typeof thinkEventSchema>;
export type ActEvent = z.infer<typeof actEventSchema>;
export type VerdictEvent = z.infer<typeof verdictEventSchema>;
export type PersonaStartedEvent = z.infer<typeof personaStartedEventSchema>;
export type PersonaFinishedEvent = z.infer<typeof personaFinishedEventSchema>;
export type RunStatusEvent = z.infer<typeof runStatusEventSchema>;
export type RecommendationEvent = z.infer<typeof recommendationEventSchema>;
export type RunEvent = z.infer<typeof eventSchema>;

export type Recommendation = RecommendationEvent["recommendations"][number];

export const runArtifactSchema = z.object({
  runId: z.string(),
  createdAt: z.string(),
  completedAt: z.string().optional(),
  status: z.enum(["queued", "running", "aggregating", "complete", "failed"]),
  personas: z.array(personaSchema),
  events: z.array(eventSchema),
  recommendations: z.array(recommendationEventSchema.shape.recommendations.element).default([]),
});

export type RunArtifact = z.infer<typeof runArtifactSchema>;
