import type { PersonaLive } from "./types";

type Props = {
  personas: PersonaLive[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function PersonaGrid({ personas, selectedId, onSelect }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Swarm</h2>
        <span className="text-xs text-slate-500">{personas.length} personas</span>
      </div>
      <ul className="mt-4 space-y-2">
        {personas.map((p) => (
          <PersonaCard
            key={p.persona.id}
            live={p}
            selected={selectedId === p.persona.id}
            onClick={() => onSelect(p.persona.id)}
          />
        ))}
      </ul>
    </div>
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
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`w-full rounded-lg border p-3 text-left transition ${
          selected
            ? "border-indigo-500 bg-indigo-50/50"
            : "border-slate-200 bg-white hover:border-slate-300"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar id={persona.id} />
            <div>
              <div className="text-sm font-semibold text-slate-900">{persona.name}</div>
              <div className="text-xs text-slate-500">{persona.role}</div>
            </div>
          </div>
          <StatusChip status={status} outcome={outcome} />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {steps.length} step{steps.length === 1 ? "" : "s"}
          </span>
          {rating !== undefined && (
            <span className="text-amber-600">{"★".repeat(rating)}{"☆".repeat(5 - rating)}</span>
          )}
        </div>
        {latestLabel && (
          <p className="mt-2 line-clamp-2 text-xs text-slate-600">{latestLabel}</p>
        )}
      </button>
    </li>
  );
}

function Avatar({ id }: { id: string }) {
  const color = avatarColor(id);
  const initials = id
    .split("-")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
  return (
    <div
      className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}

function avatarColor(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const hue = Math.abs(hash) % 360;
  return `linear-gradient(135deg, hsl(${hue}, 70%, 55%), hsl(${(hue + 40) % 360}, 70%, 45%))`;
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
      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
        running
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
        error
      </span>
    );
  }
  if (status === "done" && outcome) {
    const tone =
      outcome === "converted"
        ? "bg-emerald-100 text-emerald-700"
        : outcome === "bounced"
          ? "bg-amber-100 text-amber-700"
          : "bg-violet-100 text-violet-700";
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{outcome}</span>
    );
  }
  return <span className="text-xs text-slate-400">queued</span>;
}

function describeStep(step: PersonaLive["steps"][number] | undefined): string | null {
  if (!step) return null;
  if (step.kind === "think") return `“${step.thought}”`;
  if (step.kind === "act")
    return `${step.action} → ${step.target}: ${step.rationale.slice(0, 120)}`;
  if (step.kind === "perceive") return step.viewport.title ? `@ ${step.viewport.title}` : null;
  if (step.kind === "verdict") return `verdict: ${step.outcome} — ${step.reasons[0] ?? ""}`;
  return null;
}
