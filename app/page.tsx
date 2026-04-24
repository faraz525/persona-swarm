import Link from "next/link";

const proofStats = ["7 personas", "5 blockers", "2/7 converted", "ranked fixes"];

const previewMetrics = [
  { label: "Personas launched", value: "7", detail: "Fixture replay" },
  { label: "Conversion", value: "29%", detail: "2 converted" },
  { label: "Buyers blocked", value: "5", detail: "Bounced before trial" },
  { label: "Top blocker", value: "Pricing", detail: "High severity" },
];

const processSteps = [
  {
    title: "Launch swarm",
    copy: "Start the fixture replay or send a fresh cohort at a target page.",
  },
  {
    title: "Watch buyer friction",
    copy: "Personas browse in real browsers and preserve what stopped them.",
  },
  {
    title: "Prioritize fixes",
    copy: "Leadership gets ranked fixes tied to repeated evidence, not opinions.",
  },
];

const evidenceRows = [
  ["Pricing opacity", "High", "CFO, founder"],
  ["Placeholder proof", "Medium", "Designer"],
  ["Trial dark pattern", "Medium", "Founder"],
  ["FAQ gaps", "Medium", "CFO, student"],
  ["Missing integrations", "Low", "Marketing"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1240px] items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] lg:px-8">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Persona Swarm
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Reveal why buyers bounce before you ship
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            With synthetic buyer personas browsing your landing page in real browsers,
            Persona Swarm captures what they notice and turns repeated friction into
            evidence-backed fixes leaders can review before launch.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dash?runId=fixture&paced=1"
              className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              Open command center
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Inspect target page
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {proofStats.map((stat) => (
              <div
                key={stat}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
              >
                {stat}
              </div>
            ))}
          </div>
        </div>

        <aside className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-200 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Fixture command center
                </p>
                <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
                  FlowLens launch review
                </h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                Complete
              </span>
            </div>
          </div>

          <div className="grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            {previewMetrics.map((metric) => (
              <div key={metric.label} className="min-w-0 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {metric.label}
                </p>
                <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-slate-950">
                  {metric.value}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {metric.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 p-5">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-950">
                  Ranked fixes
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Fixture stats from live browser evidence.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">5 blockers</span>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
              {evidenceRows.map(([title, severity, buyer], index) => (
                <div
                  key={title}
                  className="grid grid-cols-[minmax(0,1fr)_80px] gap-3 border-b border-slate-200 bg-white p-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_90px_120px]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {index + 1}. {title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 sm:hidden">{buyer}</p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {severity}
                  </span>
                  <span className="hidden truncate text-xs text-slate-500 sm:block">
                    {buyer}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1240px] gap-4 px-4 py-6 sm:px-6 md:grid-cols-3 lg:px-8">
          {processSteps.map((step, index) => (
            <div key={step.title} className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <h2 className="text-sm font-semibold text-slate-950">{step.title}</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{step.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Leadership signal
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              Browser evidence beats proxy metrics
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
              <h3 className="text-sm font-semibold text-slate-950">
                More specific than heatmaps
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Heatmaps show where attention pooled. Persona Swarm shows what buyers
                tried, misunderstood, and used as a reason to leave.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
              <h3 className="text-sm font-semibold text-slate-950">
                Sharper than generic CRO audits
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Each recommendation is ranked by repeated persona friction, with the
                live browser trail close enough for product, growth, and sales leaders.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
