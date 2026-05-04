import { describe, expect, it } from "vitest";
import type { Recommendation } from "./schemas";
import { buildFallbackCopyVariants } from "./variants";

const recommendations: Recommendation[] = [
  {
    id: "rec-1-pricing",
    severity: "high",
    affectedPersonas: ["skeptical-cfo", "solo-founder-5min"],
    title: "Pricing section lacks transparency on real costs and plan limits",
    detail: "Buyers cannot calculate total cost or understand what happens after trial.",
    suggestedChange: "Show per-seat pricing, trial terms, and a worked team example.",
  },
  {
    id: "rec-2-hero",
    severity: "medium",
    affectedPersonas: ["designer-visual-sceptic", "student-curious"],
    title: "Hero section uses a placeholder graphic and generic copy",
    detail: "The hero does not explain the concrete outcome or show product proof.",
    suggestedChange: "Rewrite the hero around a clear outcome and add a real product preview.",
  },
  {
    id: "rec-3-faq",
    severity: "medium",
    affectedPersonas: ["student-curious"],
    title: "FAQ does not answer billing cycles or trial policies",
    detail: "Evaluation-stage buyers still have basic purchasing questions.",
    suggestedChange: "Add direct FAQ answers about billing, trial end, and plan changes.",
  },
];

describe("buildFallbackCopyVariants", () => {
  it("creates two evidence-backed variants with preview URLs", () => {
    const variants = buildFallbackCopyVariants(recommendations);

    expect(variants).toHaveLength(2);
    expect(variants.map((variant) => variant.id)).toEqual(["a", "b"]);
    expect(variants.map((variant) => variant.demoUrl)).toEqual([
      "/demo?variant=a",
      "/demo?variant=b",
    ]);
    expect(variants[0].sections.length).toBeGreaterThanOrEqual(3);
  });

  it("maps affected personas onto generated section evidence", () => {
    const variants = buildFallbackCopyVariants(recommendations);
    const hero = variants[0].sections.find((section) => section.section === "hero");
    const pricing = variants[0].sections.find((section) => section.section === "pricing");

    expect(hero?.evidencePersonaIds).toEqual(["designer-visual-sceptic", "student-curious"]);
    expect(pricing?.evidencePersonaIds).toEqual(["skeptical-cfo", "solo-founder-5min"]);
  });

  it("uses a broad improvement variant when recommendations are missing", () => {
    const variants = buildFallbackCopyVariants([]);

    expect(variants[0].summary).toContain("clarifies the offer");
    expect(variants[0].sections.map((section) => section.section)).toContain("hero");
    expect(variants[1].sections.map((section) => section.section)).toContain("cta");
  });
});
