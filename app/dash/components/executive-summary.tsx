import type { EmergingTheme, ExecutiveSummary as ExecutiveSummaryData } from "./insights";
import type { RunState } from "./types";

type Props = {
  summary: ExecutiveSummaryData;
  status: RunState["status"];
  themes: EmergingTheme[];
};

export function ExecutiveSummary({ summary, status, themes }: Props) {
  const preRun = status === "idle" && summary.launched === 0;
  const topTheme = themes[0]?.label;

  const metrics = preRun
    ? [
        {
          label: "Profiles",
          value: "7 planned",
          detail: "Buyer mix ready",
        },
        {
          label: "Conversion",
          value: "Pending",
          detail: "Measured after run",
        },
        {
          label: "Buyers blocked",
          value: "Watching",
          detail: "Pricing, proof, trust, and fit",
        },
        {
          label: "Top blocker",
          value: "Pricing clarity",
          detail: "Preview lens, not a live result",
        },
        {
          label: "Recommendations",
          value: "Ranked fixes",
          detail: "Built from evidence",
        },
      ]
    : [
        {
          label: "Profiles",
          value: summary.launched.toString(),
          detail: `${summary.completed} reached verdict`,
        },
        {
          label: "Conversion",
          value: `${summary.conversionRate}%`,
          detail: `${summary.converted} converted of ${summary.completed || summary.launched || 0}`,
        },
        {
          label: "Buyers blocked",
          value: summary.blocked.toString(),
          detail: `${summary.bounced} bounced, ${summary.confused} confused`,
        },
        {
          label: "Top blocker",
          value: summary.topBlocker,
          detail: topTheme ? `Theme: ${topTheme}` : "Live signal pending",
        },
        {
          label: "Recommendations",
          value: summary.recommendationsReady ? "Ready" : "Pending",
          detail: summary.recommendationsReady
            ? "Evidence-backed fixes loaded"
            : "Generated after aggregation",
        },
      ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="grid gap-px overflow-hidden rounded-lg bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric) => (
          <div key={metric.label} className="min-w-0 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
              {metric.label}
            </p>
            <p className="mt-2 min-h-8 break-words text-xl font-semibold tracking-tight text-slate-950 tabular-nums">
              {metric.value}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {metric.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
