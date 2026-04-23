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
          label: "Personas launched",
          value: "7 planned",
          detail: "Flagship buyer mix",
        },
        {
          label: "Conversion",
          value: "Pending",
          detail: "Measured after replay or live run",
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
          detail: "Generated from final evidence",
        },
      ]
    : [
        {
          label: "Personas launched",
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
    <section className="rounded-lg border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="grid divide-y divide-slate-200 md:grid-cols-5 md:divide-x md:divide-y-0">
        {metrics.map((metric) => (
          <div key={metric.label} className="min-w-0 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {metric.label}
            </p>
            <p className="mt-2 truncate text-xl font-semibold tracking-tight text-slate-950">
              {metric.value}
            </p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
              {metric.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
