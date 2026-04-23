import type { Recommendation } from "@/lib/schemas";
import type { RunState } from "./types";

type Props = {
  recommendations: Recommendation[];
  status: RunState["status"];
};

const severityTone: Record<Recommendation["severity"], string> = {
  high: "bg-rose-500",
  medium: "bg-amber-500",
  low: "bg-slate-400",
};

export function RecommendationsPanel({ recommendations, status }: Props) {
  const pending = status === "running" || status === "aggregating";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Ranked fixes</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Copy and layout changes tied to buyer evidence.
          </p>
        </div>
        {pending && recommendations.length === 0 && (
          <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
            {status === "aggregating" ? "generating..." : "waiting for verdicts"}
          </span>
        )}
      </div>

      {recommendations.length === 0 ? (
        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-medium text-slate-900">
            Recommendations are generated after aggregation.
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            The completed run will rank the most repeated blockers and attach suggested
            copy or layout changes.
          </p>
        </div>
      ) : (
        <ol className="mt-5 space-y-3">
          {recommendations.map((r) => (
            <li
              key={r.id}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white"
            >
              <div className="flex">
                <div className={`w-1.5 shrink-0 ${severityTone[r.severity]}`} />
                <div className="min-w-0 flex-1 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-950">{r.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{r.detail}</p>
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 ring-1 ring-slate-200">
                      {r.severity}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    <span className="font-semibold text-slate-950">Suggested change:</span>{" "}
                    {r.suggestedChange}
                  </p>
                  {r.affectedPersonas.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                      {r.affectedPersonas.map((p) => (
                        <span
                          key={p}
                          className="rounded-full bg-slate-50 px-2 py-0.5 font-medium text-slate-500 ring-1 ring-slate-200"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
