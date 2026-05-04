import type { DemoVariant } from "./variant-copy";

type Props = {
  variant?: DemoVariant;
};

const controlTiers = [
  {
    id: "free",
    name: "Starter",
    price: "$0",
    period: "free forever*",
    description: "For exploring FlowLens on a single service.",
    features: [
      "1 pipeline",
      "7-day retention",
      "Community support",
      "Up to 10k events / day",
    ],
    cta: "Start free",
    highlight: false,
    footnote: "*30-day free trial, then $29/month. Credit card required at signup.",
  },
  {
    id: "team",
    name: "Team",
    price: "$199",
    period: "per month",
    description: "For growing teams shipping production pipelines.",
    features: [
      "Unlimited pipelines",
      "30-day retention",
      "Email support (48h SLA)",
      "Up to 2M events / day",
    ],
    cta: "Start Team trial",
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Contact sales",
    period: " ",
    description: "For organizations with custom security and scale needs.",
    features: [
      "Unlimited retention",
      "24/7 support",
      "SSO, audit logs",
      "Custom contracts",
    ],
    cta: "Contact sales",
    highlight: false,
  },
];

const variantTiers = [
  {
    id: "starter",
    name: "Starter Trial",
    price: "$0",
    period: "for 30 days",
    description: "For validating FlowLens on one service before paid rollout.",
    features: [
      "1 pipeline",
      "7-day retention",
      "No charge during trial",
      "$29/month after trial unless canceled",
    ],
    cta: "Start 30-day trial",
    highlight: false,
    footnote: "Credit card required. Cancel any time before renewal.",
  },
  {
    id: "team",
    name: "Team",
    price: "$199",
    period: "per month flat rate",
    description: "For teams monitoring production pipelines without per-seat surprises.",
    features: [
      "Unlimited pipelines",
      "30-day retention",
      "Up to 50 users included",
      "2M events/day included",
    ],
    cta: "Start Team trial",
    highlight: true,
    footnote: "Example: 50 users = $199/month total, about $4/user.",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "From $1,500",
    period: "per month",
    description: "For organizations with procurement, SSO, and data residency needs.",
    features: [
      "Custom retention",
      "SSO, audit logs, DPA",
      "Regional data controls",
      "24/7 support",
    ],
    cta: "Contact sales",
    highlight: false,
    footnote: "SOC 2 Type II in progress. Security packet available on request.",
  },
];

export function DemoPricing({ variant = "control" }: Props) {
  const tiers = variant === "control" ? controlTiers : variantTiers;

  return (
    <section id="pricing" className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
          Pricing
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-slate-900">
          Simple, seat-agnostic plans
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.id}
              className={`rounded-2xl border p-6 ${
                t.highlight
                  ? "border-indigo-500 bg-indigo-50/40 shadow-md"
                  : "border-slate-200 bg-white"
              }`}
            >
              <h3 className="text-xl font-semibold text-slate-900">{t.name}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-slate-900">{t.price}</span>
                <span className="text-sm text-slate-500">{t.period}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{t.description}</p>
              <ul className="mt-5 space-y-2 text-sm text-slate-700">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold ${
                  t.highlight
                    ? "bg-indigo-600 text-white hover:bg-indigo-500"
                    : "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                } transition-transform active:scale-[0.96]`}
              >
                {t.cta}
              </button>
              {t.footnote && (
                <p className="mt-3 text-[11px] leading-relaxed text-slate-400">{t.footnote}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
