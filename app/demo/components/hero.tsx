export function DemoHero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-16 pb-6">
      <div className="grid gap-10 md:grid-cols-2 md:gap-14">
        <div className="flex flex-col justify-center">
          <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-wider text-slate-600">
            Unified observability platform
          </span>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 md:text-5xl">
            FlowLens: unified observability with async pipelines
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            Leverage best-in-class distributed primitives, AI-native streaming,
            and a composable control-plane architecture built for modern
            cloud-native workloads.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#pricing"
              className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Book a demo
            </a>
            <a
              href="#features"
              className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              How it works
            </a>
          </div>
          <div className="mt-8 flex items-center gap-6 text-xs text-slate-500">
            <span>Trusted by 500+ teams</span>
            <span>•</span>
            <span>4.8 on G2</span>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-200 via-sky-100 to-fuchsia-200 p-6 md:aspect-[4/4.8]">
            <div className="grid h-full place-items-center rounded-xl bg-white/60 backdrop-blur">
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500" />
                <span className="text-sm">Product illustration</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
