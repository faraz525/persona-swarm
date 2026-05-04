import type { PersonaLive } from "./types";

export function FunnelChart({ personas }: { personas: PersonaLive[] }) {
  const total = personas.length;
  if (total === 0) {
    return (
      <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
        <h2 className="text-sm font-semibold text-slate-950">Decision funnel</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Replay or run live to see how far each buyer gets.
        </p>
        <div className="mt-4 grid grid-cols-5 gap-2 text-center text-[11px] font-medium text-slate-500">
          {["Land", "Explore", "Engage", "Verdict", "Convert"].map((label) => (
            <div key={label} className="rounded-md bg-slate-50 px-2 py-3 ring-1 ring-slate-200">
              {label}
            </div>
          ))}
        </div>
      </section>
    );
  }

  const counts = {
    started: total,
    explored: personas.filter((p) => p.steps.length >= 2).length,
    engaged: personas.filter((p) =>
      p.steps.some(
        (s) =>
          (s.kind === "act" && s.action !== "snapshot" && s.action !== "scroll") ||
          s.kind === "think",
      ),
    ).length,
    verdict: personas.filter((p) => !!p.outcome).length,
    converted: personas.filter((p) => p.outcome === "converted").length,
  };

  const rows: Array<{ label: string; value: number; tone: string }> = [
    { label: "Landed", value: counts.started, tone: "bg-slate-400" },
    { label: "Explored", value: counts.explored, tone: "bg-slate-500" },
    { label: "Engaged", value: counts.engaged, tone: "bg-blue-500" },
    { label: "Reached verdict", value: counts.verdict, tone: "bg-sky-600" },
    { label: "Converted", value: counts.converted, tone: "bg-emerald-500" },
  ];

  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <h2 className="text-sm font-semibold text-slate-950">Decision funnel</h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        How far each buyer got before reaching a verdict.
      </p>
      <ul className="mt-4 space-y-3">
        {rows.map((r) => {
          const pct = total > 0 ? Math.round((r.value / total) * 100) : 0;
          return (
            <li key={r.label} className="flex min-w-0 items-center gap-3">
              <span className="w-24 shrink-0 text-xs font-medium text-slate-600 sm:w-28">
                {r.label}
              </span>
              <div className="flex-1">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full ${r.tone}`}
                    style={{ width: `${total > 0 ? (r.value / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <span className="w-20 shrink-0 text-right text-xs tabular-nums text-slate-700">
                {r.value}/{total} - {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
