const items = [
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

export function DemoFAQ() {
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
