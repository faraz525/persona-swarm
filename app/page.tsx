import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-8 py-20">
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
        Persona Swarm
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
        Landing-page simulator
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
        LLM-driven synthetic personas open your landing page in real headless browsers,
        narrate what they see and why they act, and surface actionable copy and layout
        changes — not just heatmaps.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/dash"
          className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          Open dashboard
        </Link>
        <Link
          href="/demo"
          className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          View bundled landing page
        </Link>
      </div>
    </main>
  );
}
