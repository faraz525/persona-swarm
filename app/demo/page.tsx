import type { Metadata } from "next";
import { DemoNav } from "./components/nav";
import { DemoHero } from "./components/hero";
import { DemoFeatures } from "./components/features";
import { DemoPricing } from "./components/pricing";
import { DemoFooter } from "./components/footer";
import { DemoFAQ } from "./components/faq";

export const metadata: Metadata = {
  title: "FlowLens — unified observability with async pipelines",
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <DemoNav />
      <DemoHero />
      <DemoFeatures />
      <DemoPricing />
      <DemoFooter />
      <DemoFAQ />
    </div>
  );
}
