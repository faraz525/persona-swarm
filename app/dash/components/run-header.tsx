import type { RunState } from "./types";

type Props = {
  state: RunState;
  isLaunching: boolean;
  onRun: () => void;
  onReplay: () => void;
  personaCount: number;
};

export function RunHeader({ state, isLaunching, onRun, onReplay, personaCount }: Props) {
  const statusBadge = statusBadgeText(state.status);
  const disabled = isLaunching || state.status === "running" || state.status === "aggregating";

  return (
    <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
          Persona Swarm
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Landing-page simulator
        </h1>
        <p className="mt-2 max-w-xl text-sm text-slate-500">
          Spawns a swarm of synthetic personas against the bundled{" "}
          <a href="/demo" className="font-medium text-indigo-600 hover:underline">
            FlowLens landing page
          </a>
          , then clusters friction into actionable copy and layout recommendations.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge.className}`}
          aria-live="polite"
        >
          {statusBadge.label}
          {personaCount > 0 && state.status !== "idle" && (
            <span className="ml-2 text-slate-500">
              {personaCount} personas
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={onReplay}
          disabled={disabled}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Replay demo
        </button>
        <button
          type="button"
          onClick={onRun}
          disabled={disabled}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLaunching ? "Starting…" : "Run simulation"}
        </button>
      </div>
    </header>
  );
}

function statusBadgeText(status: RunState["status"]): { label: string; className: string } {
  switch (status) {
    case "idle":
      return { label: "Idle", className: "bg-slate-100 text-slate-600" };
    case "queued":
      return { label: "Queued", className: "bg-amber-100 text-amber-800" };
    case "running":
      return { label: "Running", className: "bg-blue-100 text-blue-800" };
    case "aggregating":
      return { label: "Aggregating", className: "bg-violet-100 text-violet-800" };
    case "complete":
      return { label: "Complete", className: "bg-emerald-100 text-emerald-800" };
    case "failed":
      return { label: "Failed", className: "bg-rose-100 text-rose-800" };
  }
}
