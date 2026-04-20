import { query } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import type {
  RunArtifact,
  Recommendation,
  ThinkEvent,
  ActEvent,
  VerdictEvent,
} from "@/lib/schemas";

const recommendationsSchema = z.array(
  z.object({
    id: z.string(),
    severity: z.enum(["high", "medium", "low"]),
    affectedPersonas: z.array(z.string()),
    title: z.string(),
    detail: z.string(),
    suggestedChange: z.string(),
  }),
);

type Cluster = {
  id: string;
  signals: Array<{ personaId: string; evidence: string; sentiment: number; confusion: number }>;
};

function bucketKey(text: string): string {
  const lower = text.toLowerCase();
  const keywords = [
    "pricing",
    "price",
    "cost",
    "sales",
    "hero",
    "headline",
    "cta",
    "button",
    "sign up",
    "signup",
    "trial",
    "free",
    "plan",
    "enterprise",
    "contact",
    "docs",
    "api",
    "integration",
    "compliance",
    "soc",
    "gdpr",
    "security",
    "footer",
    "faq",
    "feature",
    "confus",
    "unclear",
    "jargon",
    "screenshot",
    "illustration",
    "visual",
    "scroll",
    "fold",
    "credit card",
  ];
  for (const k of keywords) {
    if (lower.includes(k)) return k;
  }
  return "general";
}

function collectClusters(artifact: RunArtifact): Cluster[] {
  const buckets = new Map<string, Cluster>();

  for (const ev of artifact.events) {
    let text: string | null = null;
    let sentiment = 0;
    let confusion = 0;
    let personaId: string | null = null;

    if (ev.type === "think") {
      const t = ev as ThinkEvent;
      text = t.thought;
      sentiment = t.sentiment;
      confusion = t.confusion;
      personaId = t.personaId;
    } else if (ev.type === "verdict") {
      const v = ev as VerdictEvent;
      text = v.reasons.join(" | ");
      sentiment = v.outcome === "converted" ? 0.3 : -0.6;
      confusion = v.outcome === "confused" ? 0.8 : 0.3;
      personaId = v.personaId;
    } else if (ev.type === "act") {
      const a = ev as ActEvent;
      if (a.action !== "snapshot") {
        text = `${a.action}: ${a.target}`;
        personaId = a.personaId;
      }
    }

    if (!text || !personaId) continue;
    const isFriction = sentiment < -0.1 || confusion > 0.4 || ev.type === "verdict";
    if (!isFriction) continue;

    const key = bucketKey(text);
    const existing = buckets.get(key) ?? { id: key, signals: [] };
    existing.signals.push({ personaId, evidence: text.slice(0, 240), sentiment, confusion });
    buckets.set(key, existing);
  }

  return Array.from(buckets.values())
    .filter((c) => new Set(c.signals.map((s) => s.personaId)).size >= 1)
    .sort((a, b) => {
      const au = new Set(a.signals.map((s) => s.personaId)).size;
      const bu = new Set(b.signals.map((s) => s.personaId)).size;
      if (au !== bu) return bu - au;
      return b.signals.length - a.signals.length;
    })
    .slice(0, 8)
    .map((c) => ({
      id: c.id,
      signals: c.signals.slice(0, 10),
    }));
}

function templateRecommendations(
  clusters: Cluster[],
  artifact: RunArtifact,
): Recommendation[] {
  const total = artifact.personas.length;
  return clusters.slice(0, 5).map((c, i) => {
    const uniquePersonas = Array.from(new Set(c.signals.map((s) => s.personaId)));
    const top = c.signals
      .slice()
      .sort((a, b) => a.sentiment - b.sentiment || b.confusion - a.confusion)[0];
    const severity: Recommendation["severity"] =
      uniquePersonas.length >= Math.ceil(total * 0.5)
        ? "high"
        : uniquePersonas.length >= 2
          ? "medium"
          : "low";
    return {
      id: `rec-${i + 1}-${c.id}`,
      severity,
      affectedPersonas: uniquePersonas,
      title: `${uniquePersonas.length}/${total} personas flagged "${c.id}"`,
      detail: top ? `Example: "${top.evidence}"` : "",
      suggestedChange: `Review the ${c.id}-related copy or layout on the page and address the concerns raised by ${uniquePersonas.join(", ")}.`,
    };
  });
}

async function polishWithClaude(
  raw: Recommendation[],
  artifact: RunArtifact,
): Promise<Recommendation[]> {
  const personaSummary = artifact.personas
    .map((p) => `- ${p.id}: ${p.name}, goal: ${p.primary_goal}`)
    .join("\n");
  const rawBlock = raw
    .map(
      (r, i) =>
        `[${i + 1}] id=${r.id} severity=${r.severity} affected=${r.affectedPersonas.join(",")}\n  title: ${r.title}\n  detail: ${r.detail}`,
    )
    .join("\n");

  const prompt = [
    "You are a product-page coach reviewing results from a simulated persona swarm.",
    "Here are the personas and the raw friction clusters produced by our aggregator:",
    "",
    "Personas:",
    personaSummary,
    "",
    "Raw clusters:",
    rawBlock,
    "",
    "Task: rewrite these into 3-5 actionable recommendations for the landing page owner.",
    "Each recommendation MUST:",
    "- be concrete (reference the specific element or copy that's broken)",
    "- name the affected personas by id",
    "- include a 'suggestedChange' sentence that tells the owner what to change",
    "- keep severity accurate (high = ≥50% of personas affected, medium = 2+ personas, low = 1 persona)",
    "",
    "Return ONLY a JSON array, no prose. Each item: { id, severity, affectedPersonas (string[]), title, detail, suggestedChange }.",
  ].join("\n");

  let last = "";
  try {
    for await (const msg of query({
      prompt,
      options: {
        tools: [],
        maxTurns: 1,
        cwd: process.cwd(),
      },
    })) {
      if (msg.type === "result" && msg.subtype === "success") {
        last = msg.result;
        break;
      }
    }
  } catch {
    return raw;
  }

  const jsonMatch = last.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (!jsonMatch) return raw;
  try {
    const parsed = recommendationsSchema.parse(JSON.parse(jsonMatch[0]));
    return parsed;
  } catch {
    return raw;
  }
}

export async function aggregate(artifact: RunArtifact): Promise<Recommendation[]> {
  const clusters = collectClusters(artifact);
  const templated = templateRecommendations(clusters, artifact);
  if (templated.length === 0) {
    return [
      {
        id: "rec-no-friction",
        severity: "low",
        affectedPersonas: [],
        title: "No significant friction detected",
        detail: "All personas moved through the page without strong negative sentiment.",
        suggestedChange:
          "Consider running with more adversarial personas or testing a deliberately harder variant.",
      },
    ];
  }
  return await polishWithClaude(templated, artifact);
}
