import type { DemoVariant } from "./variant-copy";

type Props = {
  variant?: DemoVariant;
};

const controlItems = [
  {
    q: "What does FlowLens actually do?",
    a: "FlowLens ingests events from your services, normalizes them through schema-registered pipelines, and surfaces anomalies across the stack.",
  },
  {
    q: "Is there really a free tier?",
    a: "We offer a 30-day free trial. After that, you'll be billed $29/month unless you cancel.",
  },
  {
    q: "Do you integrate with HubSpot or Segment?",
    a: "Integrations are available via our Team plan and above.",
  },
  {
    q: "Are you SOC 2 compliant?",
    a: "We are in the process of SOC 2 Type II attestation. Please contact sales for details.",
  },
];

const variantItems = [
  {
    q: "What does FlowLens actually do?",
    a: "FlowLens connects traces, events, retries, schema changes, and pipeline spend so teams can spot customer-impacting async failures from one workspace.",
  },
  {
    q: "What happens after the Starter trial?",
    a: "The Starter trial runs for 30 days. After that it renews at $29/month unless you cancel before the renewal date.",
  },
  {
    q: "How does Team pricing work for 50 users?",
    a: "The Team plan is $199/month flat rate with up to 50 users included. There are no per-seat fees inside that limit.",
  },
  {
    q: "Do you integrate with HubSpot, Segment, and Marketo?",
    a: "Yes. HubSpot, Segment, Marketo, Salesforce, Snowflake, and Datadog are available on Team and Enterprise plans.",
  },
  {
    q: "Are you SOC 2 compliant?",
    a: "SOC 2 Type II is in progress. Enterprise evaluators can request the security packet, DPA, audit-log overview, and data residency details.",
  },
  {
    q: "Can students or small teams use FlowLens?",
    a: "Students can request academic access, and small teams can use Starter for one pipeline before moving to Team.",
  },
];

export function DemoFAQ({ variant = "control" }: Props) {
  const items = variant === "control" ? controlItems : variantItems;

  return (
    <section id="faq" className="border-t border-slate-200 bg-slate-50 py-20">
      <div className="mx-auto max-w-4xl px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
          FAQ
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
          Frequently asked questions
        </h2>
        <div className="mt-10 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {items.map((it) => (
            <details key={it.q} className="group open:bg-slate-50">
              <summary className="cursor-pointer list-none px-5 py-4 text-base font-medium text-slate-900">
                {it.q}
              </summary>
              <div className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{it.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
