import { query } from "@anthropic-ai/claude-agent-sdk";
import {
  copyVariantSchema,
  type CopyVariant,
  type Recommendation,
  type RunArtifact,
} from "./schemas";

const copyVariantsSchema = copyVariantSchema.array().length(2);

type SectionTemplate = CopyVariant["sections"][number];

const DEFAULT_SECTIONS: SectionTemplate[] = [
  {
    id: "hero-default",
    section: "hero",
    original: "FlowLens: unified observability with async pipelines",
    replacement: "Find the pipeline issue before customers feel it",
    rationale: "Lead with the concrete operational outcome instead of platform jargon.",
    evidencePersonaIds: [],
  },
  {
    id: "cta-default",
    section: "cta",
    original: "Book a demo",
    replacement: "Start a guided trial",
    rationale: "Gives time-constrained evaluators a self-serve next step.",
    evidencePersonaIds: [],
  },
  {
    id: "pricing-default",
    section: "pricing",
    original: "$0 free forever*",
    replacement: "30-day trial, then $29/month. No surprise renewal.",
    rationale: "Removes ambiguity around the trial and billing terms.",
    evidencePersonaIds: [],
  },
];

export async function generateCopyVariants(artifact: RunArtifact): Promise<CopyVariant[]> {
  const fallback = buildFallbackCopyVariants(artifact.recommendations);
  if (artifact.recommendations.length === 0) return fallback;

  const prompt = buildVariantPrompt(artifact, fallback);
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
    return fallback;
  }

  const jsonMatch = last.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (!jsonMatch) return fallback;

  try {
    return copyVariantsSchema.parse(JSON.parse(jsonMatch[0]));
  } catch {
    return fallback;
  }
}

export function buildFallbackCopyVariants(
  recommendations: Recommendation[],
): CopyVariant[] {
  const variantASections = [
    sectionFromRecommendation(recommendations, "hero") ?? DEFAULT_SECTIONS[0],
    sectionFromRecommendation(recommendations, "pricing") ?? DEFAULT_SECTIONS[2],
    sectionFromRecommendation(recommendations, "faq") ?? buildFaqSection(recommendations),
  ];
  const variantBSections = [
    sectionFromRecommendation(recommendations, "cta") ?? buildCtaSection(recommendations),
    sectionFromRecommendation(recommendations, "trust") ?? buildTrustSection(recommendations),
    sectionFromRecommendation(recommendations, "integrations") ??
      buildIntegrationsSection(recommendations),
  ];

  return [
    {
      id: "a",
      label: "Variant A",
      strategy: "Clarity + trust",
      summary:
        "This version clarifies the offer, removes ambiguous pricing language, and answers the buying questions that blocked evaluators.",
      demoUrl: "/demo?variant=a",
      sections: compactSections(variantASections),
    },
    {
      id: "b",
      label: "Variant B",
      strategy: "Conversion + proof",
      summary:
        "This version makes the page feel more shippable by tightening CTAs, adding proof, and exposing the ecosystem buyers expected to see.",
      demoUrl: "/demo?variant=b",
      sections: compactSections(variantBSections),
    },
  ];
}

function buildVariantPrompt(artifact: RunArtifact, fallback: CopyVariant[]): string {
  const recommendations = artifact.recommendations
    .map(
      (r, i) =>
        `[${i + 1}] severity=${r.severity}; affected=${r.affectedPersonas.join(", ")}\n` +
        `title: ${r.title}\ndetail: ${r.detail}\nsuggestedChange: ${r.suggestedChange}`,
    )
    .join("\n\n");

  return [
    "You are an expert landing-page conversion copywriter and product designer.",
    "Use the persona swarm evidence to create two A/B copy variants for the FlowLens landing page.",
    "Variant A should optimize for clarity and trust. Variant B should optimize for conversion and proof.",
    "Keep the product category as observability / async data pipelines.",
    "Use evidencePersonaIds exactly from the affected persona ids in the recommendations.",
    "Return ONLY a JSON array of two objects that matches this example shape:",
    JSON.stringify(fallback, null, 2),
    "",
    "Persona evidence and recommendations:",
    recommendations,
  ].join("\n");
}

function sectionFromRecommendation(
  recommendations: Recommendation[],
  target: SectionTemplate["section"],
): SectionTemplate | null {
  const recommendation = recommendations.find((item) =>
    sectionKeywords(target).some((keyword) => recommendationText(item).includes(keyword)),
  );
  if (!recommendation) return null;

  return {
    id: `${target}-${recommendation.id}`,
    section: target,
    original: originalCopyForSection(target),
    replacement: replacementForSection(target),
    rationale: recommendation.suggestedChange,
    evidencePersonaIds: recommendation.affectedPersonas,
  };
}

function buildFaqSection(recommendations: Recommendation[]): SectionTemplate {
  const evidencePersonaIds = affectedPersonasFor(recommendations, ["faq", "billing", "trial"]);
  return {
    id: "faq-billing-clarity",
    section: "faq",
    original: "Frequently asked questions",
    replacement:
      "Add direct answers for billing cycles, what happens after trial end, seat limits, and downgrade/export policies.",
    rationale: "FAQ should resolve purchase blockers instead of restating generic product claims.",
    evidencePersonaIds,
  };
}

function buildCtaSection(recommendations: Recommendation[]): SectionTemplate {
  const evidencePersonaIds = affectedPersonasFor(recommendations, ["cta", "demo", "trial", "sign"]);
  return {
    id: "cta-self-serve",
    section: "cta",
    original: "Book a demo",
    replacement: "Start a guided trial",
    rationale: "A self-serve CTA gives motivated evaluators a working path forward.",
    evidencePersonaIds,
  };
}

function buildTrustSection(recommendations: Recommendation[]): SectionTemplate {
  const evidencePersonaIds = affectedPersonasFor(recommendations, [
    "trust",
    "soc",
    "security",
    "compliance",
  ]);
  return {
    id: "trust-procurement-proof",
    section: "trust",
    original: "SSO, audit logs, custom contracts",
    replacement: "Add a trust strip with SOC 2 status, DPA availability, SSO, audit logs, and data residency notes.",
    rationale: "Procurement-minded buyers need compliance posture before they can advance.",
    evidencePersonaIds,
  };
}

function buildIntegrationsSection(recommendations: Recommendation[]): SectionTemplate {
  const evidencePersonaIds = affectedPersonasFor(recommendations, [
    "integration",
    "hubspot",
    "segment",
    "marketo",
  ]);
  return {
    id: "integrations-proof",
    section: "integrations",
    original: "Integrations are available via our Team plan and above.",
    replacement:
      "Add an integrations strip for HubSpot, Segment, Marketo, Salesforce, Snowflake, and Datadog.",
    rationale: "Marketing and ops buyers need to confirm ecosystem fit without contacting sales.",
    evidencePersonaIds,
  };
}

function compactSections(sections: SectionTemplate[]): SectionTemplate[] {
  const seen = new Set<string>();
  return sections.filter((section) => {
    if (seen.has(section.section)) return false;
    seen.add(section.section);
    return true;
  });
}

function affectedPersonasFor(
  recommendations: Recommendation[],
  keywords: string[],
): string[] {
  return Array.from(
    new Set(
      recommendations
        .filter((item) => keywords.some((keyword) => recommendationText(item).includes(keyword)))
        .flatMap((item) => item.affectedPersonas),
    ),
  );
}

function recommendationText(recommendation: Recommendation): string {
  return [
    recommendation.id,
    recommendation.title,
    recommendation.detail,
    recommendation.suggestedChange,
  ]
    .join(" ")
    .toLowerCase();
}

function sectionKeywords(section: SectionTemplate["section"]): string[] {
  switch (section) {
    case "hero":
      return ["hero", "headline", "placeholder", "generic", "buzzword"];
    case "cta":
      return ["cta", "button", "sign", "demo"];
    case "pricing":
      return ["pricing", "price", "cost", "billing", "seat", "trial"];
    case "faq":
      return ["faq", "question", "billing", "trial", "downgrade"];
    case "trust":
      return ["trust", "security", "soc", "gdpr", "compliance", "dpa"];
    case "integrations":
      return ["integration", "hubspot", "segment", "marketo", "salesforce"];
  }
}

function originalCopyForSection(section: SectionTemplate["section"]): string {
  switch (section) {
    case "hero":
      return "FlowLens: unified observability with async pipelines";
    case "cta":
      return "Book a demo";
    case "pricing":
      return "$0 free forever*";
    case "faq":
      return "Frequently asked questions";
    case "trust":
      return "SSO, audit logs, custom contracts";
    case "integrations":
      return "Integrations are available via our Team plan and above.";
  }
}

function replacementForSection(section: SectionTemplate["section"]): string {
  switch (section) {
    case "hero":
      return "See pipeline failures, spend impact, and customer risk in one live view";
    case "cta":
      return "Start a guided trial";
    case "pricing":
      return "Team plan: $199/month flat rate. Starter trial: 30 days, then $29/month.";
    case "faq":
      return "Answer billing cycles, seat limits, trial end, downgrade policy, and data export directly.";
    case "trust":
      return "Show SOC 2 status, GDPR/DPA availability, SSO, audit logs, and data residency.";
    case "integrations":
      return "Show HubSpot, Segment, Marketo, Salesforce, Snowflake, and Datadog support.";
  }
}
