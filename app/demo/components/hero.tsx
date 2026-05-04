import type { DemoVariant } from "./variant-copy";

type Props = {
  variant?: DemoVariant;
};

const copyByVariant: Record<
  DemoVariant,
  {
    badge: string;
    headline: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
    proof: string[];
    previewTitle: string;
    previewMetric: string;
  }
> = {
  control: {
    badge: "Unified observability platform",
    headline: "FlowLens: unified observability with async pipelines",
    body: "Leverage best-in-class distributed primitives, AI-native streaming, and a composable control-plane architecture built for modern cloud-native workloads.",
    primaryCta: "Book a demo",
    secondaryCta: "How it works",
    proof: ["Trusted by 500+ teams", "4.8 on G2"],
    previewTitle: "Product illustration",
    previewMetric: "Placeholder",
  },
  a: {
    badge: "Pipeline risk command center",
    headline: "See pipeline failures, spend impact, and customer risk in one live view",
    body: "FlowLens connects traces, events, and pipeline cost data so engineering and finance teams can identify the next reliability risk before customers feel it.",
    primaryCta: "Start a guided trial",
    secondaryCta: "View product tour",
    proof: ["Team plan: $199/month flat rate", "SOC 2 status and DPA details available"],
    previewTitle: "Live pipeline risk",
    previewMetric: "$18.4k protected",
  },
  b: {
    badge: "Async pipeline observability",
    headline: "Know which async pipeline will break revenue next",
    body: "Monitor queue health, schema drift, retries, and customer-facing impact from one workspace built for teams moving critical data across tools.",
    primaryCta: "Start your 30-day trial",
    secondaryCta: "See integrations",
    proof: ["HubSpot, Segment, Marketo, Salesforce", "No surprise renewal language"],
    previewTitle: "Revenue-impact alert",
    previewMetric: "23 min saved",
  },
};

const signalRows = [
  { name: "Checkout retry queue", level: "High" },
  { name: "Schema drift", level: "Med" },
  { name: "Customer sync lag", level: "Low" },
];

export function DemoHero({ variant = "control" }: Props) {
  const copy = copyByVariant[variant];

  return (
    <section className="mx-auto max-w-6xl px-6 pt-16 pb-6">
      <div className="grid gap-10 md:grid-cols-2 md:gap-14">
        <div className="flex flex-col justify-center">
          <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-wider text-slate-600">
            {copy.badge}
          </span>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 md:text-5xl">
            {copy.headline}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            {copy.body}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#pricing"
              className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:bg-indigo-500 active:scale-[0.96]"
            >
              {copy.primaryCta}
            </a>
            <a
              href="#features"
              className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition-transform hover:bg-slate-50 active:scale-[0.96]"
            >
              {copy.secondaryCta}
            </a>
          </div>
          <div className="mt-8 flex items-center gap-6 text-xs text-slate-500">
            <span>{copy.proof[0]}</span>
            <span>•</span>
            <span>{copy.proof[1]}</span>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-100 via-sky-50 to-fuchsia-100 p-4 shadow-[0_24px_70px_rgba(79,70,229,0.16)] md:aspect-[4/4.8]">
            <div className="h-full rounded-xl bg-white p-4 ring-1 ring-black/10">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
                    FlowLens
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {copy.previewTitle}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                  Live
                </span>
              </div>
              <div className="mt-5 grid gap-3">
                <div className="rounded-lg bg-slate-950 p-4 text-white">
                  <p className="text-xs text-slate-400">Current impact</p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums">
                    {copy.previewMetric}
                  </p>
                </div>
                {signalRows.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200"
                  >
                    <span className="text-sm font-medium text-slate-700">{item.name}</span>
                    <span className="text-xs font-semibold text-slate-500">
                      {item.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
