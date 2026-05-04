import Link from "next/link";
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
    <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
            Persona Swarm
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Buyer page review
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Review the FlowLens page through seven buyer profiles, then turn repeated
            friction into prioritized fixes and copy variants.{" "}
            <Link
              href="/demo"
              className="font-medium text-blue-700 underline-offset-4 hover:text-blue-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Inspect target page
            </Link>
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
          <span
            className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadge.className}`}
            aria-live="polite"
          >
            {statusBadge.label}
            {personaCount > 0 && state.status !== "idle" && (
              <span className="ml-2 text-slate-500">{personaCount} lenses</span>
            )}
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onReplay}
              disabled={disabled}
              title="Replay a recorded flagship run without the local Claude CLI"
              className="min-h-11 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Replay demo run
            </button>
            <button
              type="button"
              onClick={onRun}
              disabled={disabled}
              title="Spawn a fresh swarm using the local Claude CLI"
              className="min-h-11 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-transform hover:border-slate-400 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLaunching ? "Starting..." : "Run live review"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function statusBadgeText(status: RunState["status"]): { label: string; className: string } {
  switch (status) {
    case "idle":
      return { label: "Idle", className: "bg-slate-50 text-slate-600 ring-slate-200" };
    case "queued":
      return { label: "Queued", className: "bg-amber-50 text-amber-800 ring-amber-200" };
    case "running":
      return { label: "Running", className: "bg-blue-50 text-blue-800 ring-blue-200" };
    case "aggregating":
      return { label: "Aggregating", className: "bg-violet-50 text-violet-800 ring-violet-200" };
    case "complete":
      return { label: "Complete", className: "bg-emerald-50 text-emerald-800 ring-emerald-200" };
    case "failed":
      return { label: "Failed", className: "bg-rose-50 text-rose-800 ring-rose-200" };
  }
}
