import type { Metadata } from "next";
import { DemoNav } from "./components/nav";
import { DemoHero } from "./components/hero";
import { DemoFeatures } from "./components/features";
import { DemoPricing } from "./components/pricing";
import { DemoFooter } from "./components/footer";
import { DemoFAQ } from "./components/faq";
import { toDemoVariant } from "./components/variant-copy";

export const metadata: Metadata = {
  title: "FlowLens — unified observability with async pipelines",
};

type Props = {
  searchParams?: Promise<{ variant?: string }>;
};

const proofStripItemsByVariant = {
  a: ["Clear Team cost example", "Trust packet surfaced", "Trial terms explicit"],
  b: ["HubSpot + Segment + Marketo", "Self-serve trial CTA", "Revenue-impact product proof"],
};

export default async function DemoPage({ searchParams }: Props) {
  const params = await searchParams;
  const variant = toDemoVariant(params?.variant);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <DemoNav />
      <DemoHero variant={variant} />
      {variant !== "control" && <VariantProofStrip variant={variant} />}
      <DemoFeatures />
      <DemoPricing variant={variant} />
      <DemoFooter />
      <DemoFAQ variant={variant} />
    </div>
  );
}

function VariantProofStrip({ variant }: { variant: "a" | "b" }) {
  const items = proofStripItemsByVariant[variant];

  return (
    <section className="border-y border-slate-200 bg-slate-950 py-5 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6">
        <p className="text-sm font-semibold">Generated A/B preview from persona feedback</p>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200 ring-1 ring-white/15"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
