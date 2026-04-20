const features = [
  {
    title: "Streaming primitives",
    body: "Composable event streams with at-least-once delivery and backpressure.",
  },
  {
    title: "Control plane",
    body: "A unified control plane for pipeline orchestration across clouds.",
  },
  {
    title: "AI-native connectors",
    body: "Native connectors for vector stores, LLM providers, and fine-tune jobs.",
  },
  {
    title: "Schema registry",
    body: "Centralized schema governance with evolution-safe serialization.",
  },
  {
    title: "Observability",
    body: "Distributed traces, logs, and metrics correlated across hops.",
  },
  {
    title: "Governance",
    body: "Policy-as-code guardrails, lineage, and fine-grained audit.",
  },
];

export function DemoFeatures() {
  return (
    <section id="features" className="border-t border-slate-200 bg-slate-50 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
          Platform
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-slate-900">
          Everything you need for modern async data flow
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <div className="h-5 w-5 rounded bg-gradient-to-br from-indigo-500 to-fuchsia-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
