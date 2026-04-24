import type { PersonaLive } from "./types";

type Props = {
  personas: PersonaLive[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function PersonaGrid({ personas, selectedId, onSelect }: Props) {
  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div className="flex min-w-0 items-baseline justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-950">Buyer lenses</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Persona-level pressure tests of the FlowLens page.
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium text-slate-500">
          {personas.length || 7} lenses
        </span>
      </div>
      {personas.length === 0 ? (
        <div className="mt-4 min-w-0 rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-900">Ready to launch seven lenses</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Finance, compliance, marketing, engineering, design, founder, and student buyers
            will stream here as the run starts.
          </p>
        </div>
      ) : (
        <ul className="mt-4 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {personas.map((p) => (
            <PersonaCard
              key={p.persona.id}
              live={p}
              selected={selectedId === p.persona.id}
              onClick={() => onSelect(p.persona.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function PersonaCard({
  live,
  selected,
  onClick,
}: {
  live: PersonaLive;
  selected: boolean;
  onClick: () => void;
}) {
  const { persona, status, outcome, rating, steps } = live;
  const latest = steps[steps.length - 1];
  const latestLabel = describeStep(latest);

  return (
    <li className="min-w-0">
      <button
        type="button"
        onClick={onClick}
        className={`flex h-full min-h-56 w-full min-w-0 flex-col rounded-lg border p-4 text-left transition ${
          selected
            ? "border-indigo-400 bg-indigo-50/60 shadow-[0_10px_24px_rgba(79,70,229,0.10)]"
            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
        }`}
      >
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar id={persona.id} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-950">{persona.name}</div>
              <div className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">
                {persona.role}
              </div>
            </div>
          </div>
          <StatusChip status={status} outcome={outcome} />
        </div>

        <p className="mt-4 line-clamp-3 min-w-0 break-words text-sm leading-6 text-slate-700">
          {persona.primary_goal}
        </p>

        <div className="mt-auto min-w-0 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Latest signal
          </p>
          <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-slate-600">
            {latestLabel ?? "Waiting for browser evidence."}
          </p>
        </div>

        <div className="mt-4 flex min-w-0 items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>
            {steps.length} step{steps.length === 1 ? "" : "s"}
          </span>
          <span className="shrink-0">
            {rating !== undefined ? `rating ${rating}/5` : statusLabel(status)}
          </span>
        </div>
      </button>
    </li>
  );
}

function Avatar({ id }: { id: string }) {
  const initials = id
    .split("-")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarTone(id)}`}
    >
      {initials}
    </div>
  );
}

function avatarTone(id: string): string {
  const tones = [
    "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100",
    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
  ];
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return tones[Math.abs(hash) % tones.length];
}

function StatusChip({
  status,
  outcome,
}: {
  status: PersonaLive["status"];
  outcome: PersonaLive["outcome"];
}) {
  if (status === "running") {
    return (
      <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
        running
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
        error
      </span>
    );
  }
  if (status === "done" && outcome) {
    const tone =
      outcome === "converted"
        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
        : outcome === "bounced"
          ? "bg-amber-50 text-amber-700 ring-amber-200"
          : "bg-violet-50 text-violet-700 ring-violet-200";
    return (
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${tone}`}>
        {outcome}
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
      queued
    </span>
  );
}

function describeStep(step: PersonaLive["steps"][number] | undefined): string | null {
  if (!step) return null;
  if (step.kind === "think") return step.thought;
  if (step.kind === "act")
    return `${step.action} ${step.target}: ${step.rationale.slice(0, 120)}`;
  if (step.kind === "perceive") return step.viewport.title ? `@ ${step.viewport.title}` : null;
  if (step.kind === "verdict") return `verdict: ${step.outcome} - ${step.reasons[0] ?? ""}`;
  return null;
}

function statusLabel(status: PersonaLive["status"]): string {
  if (status === "pending") return "queued";
  return status;
}
