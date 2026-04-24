import type { EmergingTheme } from "./insights";
import type { RunState } from "./types";

type Props = {
  themes: EmergingTheme[];
  status: RunState["status"];
};

const plannedThemes: EmergingTheme[] = [
  { id: "pricing-clarity", label: "Pricing clarity", count: 0, severity: "medium" },
  { id: "product-proof", label: "Product proof", count: 0, severity: "medium" },
  { id: "compliance-trust", label: "Compliance trust", count: 0, severity: "medium" },
  { id: "integrations", label: "Integrations", count: 0, severity: "low" },
  { id: "developer-proof", label: "Developer proof", count: 0, severity: "low" },
];

const severityDot: Record<EmergingTheme["severity"], string> = {
  high: "bg-rose-500",
  medium: "bg-amber-500",
  low: "bg-slate-400",
};

export function EmergingThemes({ themes, status }: Props) {
  const hasLiveThemes = themes.length > 0;
  const visibleThemes = hasLiveThemes ? themes : plannedThemes;

  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div className="flex min-w-0 items-baseline justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-950">Emerging themes</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {hasLiveThemes
              ? "Signals clustering across buyer behavior."
              : status === "idle"
                ? "Planned lenses for the FlowLens scenario."
                : "Waiting for repeated buyer signals."}
          </p>
        </div>
        {hasLiveThemes && (
          <span className="shrink-0 text-xs font-medium text-slate-500">
            {themes.reduce((total, theme) => total + theme.count, 0)} signals
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {visibleThemes.map((theme) => (
          <span
            key={theme.id}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
          >
            <span className={`h-2 w-2 rounded-full ${severityDot[theme.severity]}`} />
            {theme.label}
            <span className="text-slate-400">{hasLiveThemes ? theme.count : "planned"}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
