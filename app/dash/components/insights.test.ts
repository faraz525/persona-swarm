import { describe, expect, it } from "vitest";
import {
  deriveEmergingThemes,
  deriveExecutiveSummary,
  selectFocusPersona,
} from "./insights";
import type { PersonaLive, RunState } from "./types";
import type { Persona, Recommendation } from "@/lib/schemas";

const baseTs = "2026-04-20T22:00:00.000Z";

function persona(id: string, name = id): Persona {
  return {
    id,
    name,
    role: "Evaluator",
    primary_goal: "Assess the landing page",
    time_budget_seconds: 60,
    objections: [],
    technical_level: "medium",
    voice: "concise",
    success_criteria: "Can decide whether to try the product",
  };
}

function live(
  id: string,
  overrides: Partial<PersonaLive> = {},
): PersonaLive {
  return {
    persona: persona(id),
    status: "running",
    steps: [],
    ...overrides,
  };
}

function think(
  personaId: string,
  step: number,
  thought: string,
  confusion: number,
  ts = baseTs,
): PersonaLive["steps"][number] {
  return {
    kind: "think",
    type: "think",
    personaId,
    step,
    ts,
    thought,
    sentiment: -0.4,
    confusion,
  };
}

function verdict(
  personaId: string,
  step: number,
  outcome: "converted" | "bounced" | "confused",
  reasons: string[],
  ts = baseTs,
): PersonaLive["steps"][number] {
  return {
    kind: "verdict",
    type: "verdict",
    personaId,
    step,
    ts,
    outcome,
    reasons,
    rating: outcome === "converted" ? 5 : 2,
  };
}

function recommendation(
  id: string,
  severity: Recommendation["severity"],
  title: string,
  detail = "",
): Recommendation {
  return {
    id,
    severity,
    affectedPersonas: [],
    title,
    detail,
    suggestedChange: "Revise the section.",
  };
}

function state(
  personas: PersonaLive[],
  recommendations: Recommendation[] = [],
  status: RunState["status"] = "running",
): RunState {
  return {
    runId: "run-1",
    status,
    personas: new Map(personas.map((p) => [p.persona.id, p])),
    recommendations,
  };
}

describe("deriveExecutiveSummary", () => {
  it("derives summary metrics from launched personas and terminal verdicts", () => {
    const summary = deriveExecutiveSummary(
      state([
        live("converted", {
          status: "done",
          outcome: "converted",
          steps: [verdict("converted", 3, "converted", ["Clear pricing and CTA"])],
        }),
        live("bounced", {
          status: "done",
          outcome: "bounced",
          steps: [verdict("bounced", 4, "bounced", ["Pricing was too vague"])],
        }),
        live("confused", {
          status: "done",
          outcome: "confused",
          steps: [verdict("confused", 5, "confused", ["Could not understand docs"])],
        }),
        live("active", {
          status: "running",
          steps: [think("active", 1, "Still reading the page", 0.3)],
        }),
      ]),
    );

    expect(summary).toMatchObject({
      launched: 4,
      completed: 3,
      converted: 1,
      bounced: 1,
      confused: 1,
      blocked: 2,
      conversionRate: 33,
      recommendationsReady: false,
    });
  });

  it("uses the highest-severity recommendation as the top blocker when available", () => {
    const summary = deriveExecutiveSummary(
      state(
        [live("buyer", { status: "done", outcome: "bounced" })],
        [
          recommendation("low", "low", "FAQ copy is thin"),
          recommendation(
            "high",
            "high",
            "Pricing section lacks transparency on real costs",
            "People cannot calculate seat costs.",
          ),
        ],
        "complete",
      ),
    );

    expect(summary.topBlocker).toBe("Pricing section lacks transparency on real costs");
    expect(summary.recommendationsReady).toBe(true);
  });

  it("falls back to verdict and theme keywords for a live run before recommendations arrive", () => {
    const summary = deriveExecutiveSummary(
      state([
        live("cfo", {
          status: "done",
          outcome: "bounced",
          steps: [
            verdict("cfo", 4, "bounced", [
              "Pricing does not show per-seat cost or billing details",
            ]),
          ],
        }),
        live("founder", {
          status: "running",
          steps: [
            think(
              "founder",
              2,
              "The trial mentions credit card and pricing surprises",
              0.7,
            ),
          ],
        }),
      ]),
    );

    expect(summary.topBlocker).toBe("Pricing");
    expect(summary.recommendationsReady).toBe(false);
  });
});

describe("selectFocusPersona", () => {
  it("prefers selected persona, then newest verdict, then highest confusion, then newest active persona", () => {
    const selected = live("selected", { status: "running" });
    const newestVerdict = live("newest-verdict", {
      status: "done",
      outcome: "confused",
      steps: [
        verdict("newest-verdict", 7, "confused", ["Security proof was missing"], "2026-04-20T22:04:00.000Z"),
      ],
    });
    const olderVerdict = live("older-verdict", {
      status: "done",
      outcome: "bounced",
      steps: [
        verdict("older-verdict", 6, "bounced", ["Pricing was unclear"], "2026-04-20T22:03:00.000Z"),
      ],
    });
    const mostConfused = live("most-confused", {
      status: "running",
      steps: [think("most-confused", 3, "I cannot tell if the API has docs", 0.95)],
    });
    const newestActive = live("newest-active", {
      status: "running",
      steps: [think("newest-active", 4, "Scanning integrations", 0.2, "2026-04-20T22:05:00.000Z")],
    });

    expect(
      selectFocusPersona([olderVerdict, newestVerdict, selected], "selected")?.persona.id,
    ).toBe("selected");
    expect(selectFocusPersona([olderVerdict, newestVerdict, mostConfused])?.persona.id).toBe(
      "newest-verdict",
    );
    expect(selectFocusPersona([newestActive, mostConfused])?.persona.id).toBe("most-confused");
    expect(selectFocusPersona([newestActive, live("pending", { status: "pending" })])?.persona.id).toBe(
      "newest-active",
    );
  });
});

describe("deriveEmergingThemes", () => {
  it("extracts ranked themes from thoughts, verdicts, and recommendations", () => {
    const themes = deriveEmergingThemes(
      state(
        [
          live("cfo", {
            status: "done",
            outcome: "bounced",
            steps: [
              think("cfo", 1, "The pricing table hides seat cost and billing", 0.8),
              verdict("cfo", 2, "bounced", ["Pricing and trial credit card terms are unclear"]),
            ],
          }),
          live("dev", {
            status: "running",
            steps: [
              think("dev", 1, "I need API docs and developer reference material", 0.7),
            ],
          }),
        ],
        [
          recommendation(
            "rec-pricing",
            "high",
            "Clarify pricing",
            "Add seat cost, billing, and trial credit card details.",
          ),
          recommendation(
            "rec-integrations",
            "medium",
            "Show integrations",
            "HubSpot and Salesforce integrations are missing.",
          ),
        ],
      ),
    );

    expect(themes).toEqual([
      { id: "pricing", label: "Pricing", count: 3, severity: "high" },
      { id: "developer-proof", label: "Developer proof", count: 1, severity: "medium" },
      { id: "integrations", label: "Integrations", count: 1, severity: "medium" },
    ]);
  });

  it("keeps recommendation severity authoritative when matching live signals are more severe", () => {
    const themes = deriveEmergingThemes(
      state(
        [
          live("founder", {
            status: "running",
            steps: [
              think(
                "founder",
                1,
                "Pricing and trial billing are extremely confusing",
                0.95,
              ),
            ],
          }),
        ],
        [
          recommendation(
            "rec-pricing",
            "low",
            "Clarify pricing footnote",
            "Trial billing language needs a small copy fix.",
          ),
        ],
      ),
    );

    expect(themes.find((theme) => theme.id === "pricing")).toEqual({
      id: "pricing",
      label: "Pricing",
      count: 2,
      severity: "low",
    });
  });

  it("raises repeated low live-only signals to medium when recommendations are absent", () => {
    const themes = deriveEmergingThemes(
      state([
        live("buyer-one", {
          status: "running",
          steps: [think("buyer-one", 1, "Pricing mentions seat cost but not enough detail", 0.25)],
        }),
        live("buyer-two", {
          status: "running",
          steps: [think("buyer-two", 1, "Billing and trial copy need a closer read", 0.3)],
        }),
      ]),
    );

    expect(themes.find((theme) => theme.id === "pricing")).toEqual({
      id: "pricing",
      label: "Pricing",
      count: 2,
      severity: "medium",
    });
  });

  it("raises repeated medium live-only signals to high when recommendations are absent", () => {
    const themes = deriveEmergingThemes(
      state([
        live("ops", {
          status: "running",
          steps: [think("ops", 1, "Security compliance details are hard to verify", 0.55)],
        }),
        live("legal", {
          status: "running",
          steps: [think("legal", 1, "GDPR and data residency proof is incomplete", 0.65)],
        }),
      ]),
    );

    expect(themes.find((theme) => theme.id === "trust")).toEqual({
      id: "trust",
      label: "Trust",
      count: 2,
      severity: "high",
    });
  });
});
