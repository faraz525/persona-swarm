import type { Recommendation } from "@/lib/schemas";
import type { PersonaLive, RunState } from "./types";

export type ExecutiveSummary = {
  launched: number;
  completed: number;
  converted: number;
  bounced: number;
  confused: number;
  blocked: number;
  conversionRate: number;
  topBlocker: string;
  recommendationsReady: boolean;
};

export type EmergingTheme = {
  id: string;
  label: string;
  count: number;
  severity: "high" | "medium" | "low";
};

type ThemeBucket = {
  id: string;
  label: string;
  keywords: string[];
};

type ThemeSignal = {
  id: string;
  source: "recommendation" | "live";
  severity?: EmergingTheme["severity"];
  confusion?: number;
};

const THEME_BUCKETS: ThemeBucket[] = [
  {
    id: "pricing",
    label: "Pricing",
    keywords: ["pricing", "price", "cost", "seat", "billing", "trial", "credit card"],
  },
  {
    id: "trust",
    label: "Trust",
    keywords: ["soc", "gdpr", "security", "compliance", "dpa", "data residency"],
  },
  {
    id: "integrations",
    label: "Integrations",
    keywords: ["integration", "integrations", "hubspot", "segment", "marketo", "salesforce"],
  },
  {
    id: "product-proof",
    label: "Product proof",
    keywords: ["screenshot", "illustration", "placeholder", "generic", "buzzword"],
  },
  {
    id: "developer-proof",
    label: "Developer proof",
    keywords: ["docs", "api", "developer", "reference"],
  },
];

const SEVERITY_RANK: Record<EmergingTheme["severity"], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function deriveExecutiveSummary(state: RunState): ExecutiveSummary {
  const personas = Array.from(state.personas.values());
  const outcomes = personas.map(getOutcome).filter((outcome) => outcome !== null);
  const converted = outcomes.filter((outcome) => outcome === "converted").length;
  const bounced = outcomes.filter((outcome) => outcome === "bounced").length;
  const confused = outcomes.filter((outcome) => outcome === "confused").length;
  const completed = outcomes.length;
  const recommendationsReady = state.recommendations.length > 0;

  return {
    launched: personas.length,
    completed,
    converted,
    bounced,
    confused,
    blocked: bounced + confused,
    conversionRate: completed > 0 ? Math.round((converted / completed) * 100) : 0,
    topBlocker: recommendationsReady
      ? getTopRecommendation(state.recommendations)?.title ?? "No blocker identified"
      : deriveEmergingThemes(state)[0]?.label ?? "No blocker identified",
    recommendationsReady,
  };
}

export function deriveEmergingThemes(state: RunState): EmergingTheme[] {
  const hasRecommendations = state.recommendations.length > 0;
  const signals = [
    ...collectLiveThemeSignals(Array.from(state.personas.values())),
    ...collectRecommendationThemeSignals(state.recommendations),
  ];
  const grouped = new Map<
    string,
    { count: number; firstSeen: number; severity: EmergingTheme["severity"]; label: string }
  >();

  for (const [index, signal] of signals.entries()) {
    const bucket = THEME_BUCKETS.find((candidate) => candidate.id === signal.id);
    if (!bucket) continue;

    const existing = grouped.get(signal.id) ?? {
      count: 0,
      firstSeen: index,
      severity: "low" as EmergingTheme["severity"],
      label: bucket.label,
    };
    const nextSeverity =
      signal.source === "recommendation" || !hasRecommendations
        ? signal.severity ?? inferSignalSeverity(signal.confusion)
        : inferSignalSeverity(signal.confusion);

    grouped.set(signal.id, {
      ...existing,
      count: existing.count + 1,
      severity: maxSeverity(existing.severity, nextSeverity),
    });
  }

  return Array.from(grouped.entries())
    .map(([id, theme]) => ({
      id,
      label: theme.label,
      count: theme.count,
      firstSeen: theme.firstSeen,
      severity: theme.severity,
    }))
    .sort((a, b) => {
      const severityDelta = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
      if (severityDelta !== 0) return severityDelta;
      if (b.count !== a.count) return b.count - a.count;
      return a.firstSeen - b.firstSeen;
    })
    .map((theme) => ({
      id: theme.id,
      label: theme.label,
      count: theme.count,
      severity: theme.severity,
    }));
}

export function selectFocusPersona(
  personas: PersonaLive[],
  selectedPersonaId?: string | null,
): PersonaLive | null {
  if (personas.length === 0) return null;

  if (selectedPersonaId) {
    const selected = personas.find((live) => live.persona.id === selectedPersonaId);
    if (selected) return selected;
  }

  const newestVerdict = personas
    .map((live) => ({ live, ts: latestVerdictTimestamp(live) }))
    .filter((item): item is { live: PersonaLive; ts: number } => item.ts !== null)
    .sort((a, b) => b.ts - a.ts)[0];
  if (newestVerdict) return newestVerdict.live;

  const highestConfusion = personas
    .map((live) => ({ live, confusion: maxConfusion(live), ts: latestStepTimestamp(live) }))
    .filter((item) => item.confusion > 0)
    .sort((a, b) => {
      if (b.confusion !== a.confusion) return b.confusion - a.confusion;
      return b.ts - a.ts;
    })[0];
  if (highestConfusion) return highestConfusion.live;

  return (
    personas
      .filter((live) => live.status === "running")
      .sort((a, b) => latestStepTimestamp(b) - latestStepTimestamp(a))[0] ?? null
  );
}

function getTopRecommendation(recommendations: Recommendation[]): Recommendation | null {
  return (
    recommendations
      .slice()
      .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])[0] ?? null
  );
}

function getOutcome(live: PersonaLive): PersonaLive["outcome"] | null {
  if (live.outcome) return live.outcome;
  const verdict = live.steps.findLast((step) => step.kind === "verdict");
  return verdict?.outcome ?? null;
}

function collectLiveThemeSignals(personas: PersonaLive[]): ThemeSignal[] {
  const signals: ThemeSignal[] = [];

  for (const live of personas) {
    for (const step of live.steps) {
      if (step.kind === "think") {
        signals.push(
          ...matchingThemeIds(step.thought).map((id) => ({
            id,
            source: "live" as const,
            confusion: step.confusion,
          })),
        );
      }

      if (step.kind === "verdict") {
        const text = step.reasons.join(" ");
        signals.push(
          ...matchingThemeIds(text).map((id) => ({
            id,
            source: "live" as const,
            severity: step.outcome === "converted" ? "low" : "medium",
          })),
        );
      }
    }
  }

  return signals;
}

function collectRecommendationThemeSignals(recommendations: Recommendation[]): ThemeSignal[] {
  const signals: ThemeSignal[] = [];

  for (const recommendation of recommendations) {
    const text = [
      recommendation.title,
      recommendation.detail,
      recommendation.suggestedChange,
    ].join(" ");
    signals.push(
      ...matchingThemeIds(text).map((id) => ({
        id,
        source: "recommendation" as const,
        severity: recommendation.severity,
      })),
    );
  }

  return signals;
}

function matchingThemeIds(text: string): string[] {
  const lower = text.toLowerCase();
  return THEME_BUCKETS.filter((bucket) =>
    bucket.keywords.some((keyword) => lower.includes(keyword)),
  ).map((bucket) => bucket.id);
}

function inferSignalSeverity(confusion = 0): EmergingTheme["severity"] {
  if (confusion >= 0.75) return "high";
  if (confusion >= 0.5) return "medium";
  return "low";
}

function maxSeverity(
  a: EmergingTheme["severity"],
  b: EmergingTheme["severity"],
): EmergingTheme["severity"] {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

function latestVerdictTimestamp(live: PersonaLive): number | null {
  const verdicts = live.steps.filter((step) => step.kind === "verdict");
  if (verdicts.length === 0) return null;
  return Math.max(...verdicts.map((step) => timestamp(step.ts)));
}

function maxConfusion(live: PersonaLive): number {
  const values = live.steps
    .filter((step) => step.kind === "think")
    .map((step) => step.confusion);
  return values.length > 0 ? Math.max(...values) : 0;
}

function latestStepTimestamp(live: PersonaLive): number {
  if (live.steps.length === 0) return 0;
  return Math.max(...live.steps.map((step) => timestamp(step.ts)));
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}
