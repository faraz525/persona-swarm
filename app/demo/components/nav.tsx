export function DemoNav() {
  return (
    <header className="h-16 border-b border-slate-200 bg-white">
      <nav className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-indigo-500 to-fuchsia-500" />
          <span className="text-lg font-semibold tracking-tight">FlowLens</span>
        </div>
        <div className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
          <a href="#features" className="hover:text-slate-900">
            Features
          </a>
          <a href="#pricing" className="hover:text-slate-900">
            Pricing
          </a>
          <a href="#" className="hover:text-slate-900">
            Customers
          </a>
          <a href="#" className="hover:text-slate-900">
            Blog
          </a>
        </div>
        <div className="flex items-center gap-3">
          <a href="#" className="text-sm text-slate-600 hover:text-slate-900">
            Sign in
          </a>
          <a
            href="#pricing"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Book a demo
          </a>
        </div>
      </nav>
    </header>
  );
}
