import type { Recommendation } from "@/lib/schemas";
import type { RunState } from "./types";

type Props = {
  recommendations: Recommendation[];
  status: RunState["status"];
};

const severityTone: Record<Recommendation["severity"], string> = {
  high: "border-rose-300 bg-rose-50 text-rose-900",
  medium: "border-amber-300 bg-amber-50 text-amber-900",
  low: "border-slate-200 bg-slate-50 text-slate-800",
};

export function RecommendationsPanel({ recommendations, status }: Props) {
  const pending = status === "running" || status === "aggregating";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Recommendations</h2>
          <p className="mt-1 text-xs text-slate-500">
            Actionable copy and layout changes derived from the swarm.
          </p>
        </div>
        {pending && recommendations.length === 0 && (
          <span className="text-xs text-slate-400">
            {status === "aggregating" ? "generating…" : "waiting for run to finish"}
          </span>
        )}
      </div>

      {recommendations.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Recommendations will appear once every persona has reached a verdict.
        </div>
      ) : (
        <ol className="mt-5 space-y-3">
          {recommendations.map((r) => (
            <li
              key={r.id}
              className={`rounded-lg border p-4 ${severityTone[r.severity]}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">{r.title}</p>
                  <p className="mt-1 text-sm opacity-80">{r.detail}</p>
                  <p className="mt-2 text-sm">
                    <span className="font-semibold">Suggested change:</span>{" "}
                    {r.suggestedChange}
                  </p>
                </div>
                <span className="whitespace-nowrap rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider">
                  {r.severity}
                </span>
              </div>
              {r.affectedPersonas.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                  {r.affectedPersonas.map((p) => (
                    <span key={p} className="rounded bg-white/70 px-2 py-0.5 font-medium">
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
