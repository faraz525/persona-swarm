import type { PersonaLive } from "./types";

export function PersonaDetail({ live }: { live: PersonaLive }) {
  const { persona, steps, outcome, rating, reasons } = live;
  const latestScreenshot = [...steps]
    .reverse()
    .find((s) => s.kind === "perceive") as
    | Extract<PersonaLive["steps"][number], { kind: "perceive" }>
    | undefined;

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <header className="flex items-start justify-between border-b border-slate-200 p-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{persona.name}</h3>
          <p className="mt-1 text-xs text-slate-500">{persona.role}</p>
          <p className="mt-3 max-w-md text-sm text-slate-600">
            <span className="font-medium text-slate-800">Goal:</span> {persona.primary_goal}
          </p>
        </div>
        {outcome && (
          <div className="text-right">
            <div
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                outcome === "converted"
                  ? "bg-emerald-100 text-emerald-700"
                  : outcome === "bounced"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-violet-100 text-violet-700"
              }`}
            >
              {outcome}
            </div>
            {rating !== undefined && (
              <div className="mt-1 text-xs text-amber-500">
                {"★".repeat(rating)}
                {"☆".repeat(5 - rating)}
              </div>
            )}
          </div>
        )}
      </header>

      {latestScreenshot && (
        <div className="border-b border-slate-200 bg-slate-100 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={latestScreenshot.screenshotPath}
            alt={`step ${latestScreenshot.step}`}
            className="w-full rounded-lg border border-slate-200 shadow-sm"
          />
          <p className="mt-2 text-xs text-slate-500">
            step {latestScreenshot.step} · {latestScreenshot.viewport.url}
          </p>
        </div>
      )}

      {reasons && reasons.length > 0 && (
        <div className="border-b border-slate-200 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Verdict reasons
          </p>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {reasons.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-slate-400">—</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="max-h-96 overflow-y-auto p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Journey</p>
        <ol className="mt-3 space-y-3">
          {steps.map((s, i) => (
            <StepRow key={i} step={s} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function StepRow({ step }: { step: PersonaLive["steps"][number] }) {
  const ts = new Date(step.ts).toLocaleTimeString();
  const headerClass =
    step.kind === "think"
      ? "text-slate-800"
      : step.kind === "act"
        ? "text-indigo-700"
        : step.kind === "verdict"
          ? "text-emerald-700"
          : "text-slate-400";

  const sentimentTone = (s: number) =>
    s >= 0.3 ? "text-emerald-600" : s <= -0.3 ? "text-rose-600" : "text-slate-500";

  let body: React.ReactNode = null;
  if (step.kind === "think") {
    body = (
      <>
        <p className="italic text-slate-700">“{step.thought}”</p>
        <div className="mt-1 flex gap-3 text-xs">
          <span className={sentimentTone(step.sentiment)}>
            sentiment {step.sentiment.toFixed(2)}
          </span>
          <span className="text-slate-500">confusion {step.confusion.toFixed(2)}</span>
        </div>
      </>
    );
  } else if (step.kind === "act") {
    body = (
      <>
        <p className="text-slate-700">
          <span className="font-medium">{step.action}</span>{" "}
          <span className="text-slate-500">→ {step.target}</span>
        </p>
        <p className="mt-1 text-sm text-slate-600">{step.rationale}</p>
      </>
    );
  } else if (step.kind === "verdict") {
    body = (
      <p className="text-slate-700">
        <span className="font-medium">{step.outcome}</span> · {step.reasons.join("; ")} ·{" "}
        {step.rating} stars
      </p>
    );
  } else if (step.kind === "perceive") {
    body = (
      <p className="text-xs text-slate-500">
        perceived: {step.viewport.title || step.viewport.url} · scrollY{" "}
        {step.viewport.scrollY}
      </p>
    );
  }

  return (
    <li className="border-l-2 border-slate-200 pl-4">
      <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${headerClass}`}>
        <span>step {step.step}</span>
        <span className="text-slate-300">·</span>
        <span>{step.kind}</span>
        <span className="ml-auto text-slate-400">{ts}</span>
      </div>
      <div className="mt-1 text-sm">{body}</div>
    </li>
  );
}
