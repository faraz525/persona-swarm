import Image from "next/image";
import type { PersonaLive, RunState } from "./types";

type Props = {
  live: PersonaLive | null;
  status: RunState["status"];
};

type PerceiveStep = Extract<PersonaLive["steps"][number], { kind: "perceive" }>;

export function FocusRail({ live, status }: Props) {
  if (!live) return <PreRunFocus status={status} />;

  const { persona, steps, outcome, reasons } = live;
  const latestScreenshot = findLatestScreenshot(steps);
  const latestSignal = findLatestSignal(steps);
  const journey = steps.slice(-5);

  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="border-b border-slate-200 p-5">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
              Selected buyer
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
              {persona.name}
            </h2>
            <p className="mt-1 break-words text-sm text-slate-600">{persona.role}</p>
          </div>
          <OutcomePill status={live.status} outcome={outcome} />
        </div>
        <p className="mt-4 break-words text-sm leading-6 text-slate-700">
          <span className="font-medium text-slate-950">Goal:</span> {persona.primary_goal}
        </p>
      </div>

      {latestScreenshot ? (
        <div className="border-b border-slate-200 bg-slate-50 p-3">
          <div className="overflow-hidden rounded-md bg-white ring-1 ring-black/10">
            <Image
              src={latestScreenshot.screenshotPath}
              alt={`${persona.name} browser evidence`}
              width={960}
              height={640}
              priority
              unoptimized
              className="h-auto w-full"
            />
          </div>
          <p className="mt-2 truncate text-xs text-slate-500 tabular-nums">
            step {latestScreenshot.step} - {latestScreenshot.viewport.title || latestScreenshot.viewport.url}
          </p>
        </div>
      ) : (
        <div className="border-b border-slate-200 bg-slate-50 p-5">
          <div className="rounded-md border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-900">Browser evidence pending</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              The first screenshot appears once this buyer lands on the target page.
            </p>
          </div>
        </div>
      )}

      <div className="min-w-0 space-y-5 p-5">
        <SignalBlock signal={latestSignal} />

        {outcome && reasons && reasons.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Verdict reasons
            </p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
              {reasons.slice(0, 3).map((reason) => (
                <li key={reason} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-md bg-blue-50/70 p-4 ring-1 ring-blue-100">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-blue-800">
            Decision note
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {whyItMatters(live)}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Journey
          </p>
          {journey.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Waiting for the first browser step.</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {journey.map((step) => (
                <li key={`${step.kind}-${step.step}-${step.ts}`} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-300" />
                  <div className="min-w-0">
                    <p className="font-medium capitalize text-slate-800">
                      {step.kind} <span className="font-normal text-slate-400">step {step.step}</span>
                    </p>
                    <p className="line-clamp-2 text-xs leading-5 text-slate-500">
                      {describeStep(step)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}

function PreRunFocus({ status }: { status: RunState["status"] }) {
  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
        Selected buyer
      </p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
        Run preview
      </h2>
      <p className="mt-2 break-words text-sm leading-6 text-slate-600">
        FlowLens will be reviewed by finance, compliance, marketing, engineering,
        design, founder, and student buyer profiles.
      </p>
      <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-900">Focus behavior</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          This panel follows the freshest verdict, strongest confusion, or active
          evidence trail. Current status: {status}.
        </p>
      </div>
      <div className="mt-5 grid gap-2 text-sm text-slate-600">
        {[
          "Browser evidence appears as profiles move.",
          "Verdicts are tied back to page friction.",
          "Repeated blockers become ranked fixes.",
        ].map((item) => (
          <p key={item} className="rounded-md bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
            {item}
          </p>
        ))}
      </div>
    </section>
  );
}

function OutcomePill({
  status,
  outcome,
}: {
  status: PersonaLive["status"];
  outcome: PersonaLive["outcome"];
}) {
  const label = outcome ?? status;
  const tone = outcome ? outcomeTone(outcome) : statusTone(status);

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tone}`}>
      {label}
    </span>
  );
}

function outcomeTone(outcome: NonNullable<PersonaLive["outcome"]>): string {
  switch (outcome) {
    case "converted":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "bounced":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "confused":
      return "bg-violet-50 text-violet-700 ring-violet-200";
  }
}

function statusTone(status: PersonaLive["status"]): string {
  if (status === "error") return "bg-rose-50 text-rose-700 ring-rose-200";
  return "bg-slate-50 text-slate-600 ring-slate-200";
}

function SignalBlock({ signal }: { signal: PersonaLive["steps"][number] | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        Latest signal
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        {signal ? describeStep(signal) : "Waiting for the first thought, action, or verdict."}
      </p>
    </div>
  );
}

function findLatestScreenshot(steps: PersonaLive["steps"]): PerceiveStep | undefined {
  return [...steps].reverse().find((step): step is PerceiveStep => step.kind === "perceive");
}

function findLatestSignal(steps: PersonaLive["steps"]) {
  return [...steps]
    .reverse()
    .find((step) => step.kind === "think" || step.kind === "act" || step.kind === "verdict");
}

function whyItMatters(live: PersonaLive): string {
  if (live.outcome === "converted") {
    return "This buyer found enough proof to proceed, so their path shows what the page should make easier for others.";
  }
  if (live.outcome === "bounced") {
    return "This buyer left before resolving a purchase question, which points to commercial friction the page can remove.";
  }
  if (live.outcome === "confused") {
    return "This buyer stayed engaged but could not form a clear decision, making the gap useful for copy and proof prioritization.";
  }
  return live.persona.objections[0]
    ? `This buyer is actively testing a known objection: ${live.persona.objections[0]}.`
    : "This buyer is still forming a decision, so the latest signal helps explain where attention is moving.";
}

function describeStep(step: PersonaLive["steps"][number]): string {
  if (step.kind === "think") return step.thought;
  if (step.kind === "act") return `${step.action} ${step.target}: ${step.rationale}`;
  if (step.kind === "verdict") return `${step.outcome}: ${step.reasons.join("; ")} (${step.rating}/5)`;
  return step.viewport.title || step.viewport.url;
}
