import type { CopyVariant } from "@/lib/schemas";
import type { RunState } from "./types";

type Props = {
  variants: CopyVariant[];
  status: RunState["status"];
};

const sectionLabel: Record<CopyVariant["sections"][number]["section"], string> = {
  hero: "Hero",
  cta: "CTA",
  pricing: "Pricing",
  faq: "FAQ",
  trust: "Trust",
  integrations: "Integrations",
};

export function VariantStudio({ variants, status }: Props) {
  const pending = status === "running" || status === "aggregating";
  const statusLabel = getStatusLabel(variants.length, pending);

  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
            Copy variants
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
            Preview page changes
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Evidence-backed copy alternatives for the target page. Source files stay unchanged.
          </p>
        </div>
        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
          {statusLabel}
        </span>
      </div>

      {variants.length === 0 ? (
        <div className="mt-5 rounded-md bg-slate-50 p-5 ring-1 ring-slate-200">
          <p className="text-sm font-medium text-slate-950">
            Variants appear after ranked fixes are ready.
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            The run creates controlled preview URLs that show what the page could say next.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {variants.map((variant) => (
            <article
              key={variant.id}
              className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 text-slate-950 shadow-[0_4px_14px_rgba(15,23,42,0.025)]"
            >
              <div className="flex min-w-0 items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {variant.label}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-slate-950">
                    {variant.strategy}
                  </h3>
                </div>
                <a
                  href={variant.demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-10 shrink-0 rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition-transform hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:scale-[0.96]"
                >
                  Preview
                </a>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">{variant.summary}</p>

              <div className="mt-4 space-y-3">
                {variant.sections.map((section) => (
                  <div
                    key={section.id}
                    className="rounded-md bg-slate-50 p-3 ring-1 ring-slate-200"
                  >
                    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                        {sectionLabel[section.section]}
                      </span>
                      {section.evidencePersonaIds.length > 0 && (
                        <span className="text-[11px] font-medium text-slate-500">
                          {personaSignalLabel(section.evidencePersonaIds.length)}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <CopyBlock label="Current" value={section.original} muted />
                      <CopyBlock label="Proposed" value={section.replacement} />
                    </div>
                    <p className="mt-2 break-words text-xs leading-5 text-slate-500">
                      {section.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CopyBlock({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>
      <p
        className={`mt-1 break-words text-sm leading-6 ${
          muted ? "text-slate-500" : "font-semibold text-slate-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function getStatusLabel(variantCount: number, pending: boolean): string {
  if (variantCount > 0) return "ready to preview";
  if (pending) return "generating variants";
  return "waiting for fixes";
}

function personaSignalLabel(count: number): string {
  if (count === 1) return "1 persona signal";
  return `${count} persona signals`;
}
