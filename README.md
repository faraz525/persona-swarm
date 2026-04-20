# Persona Swarm

LLM-driven synthetic personas open a landing page in real headless browsers, narrate what they see and why they act, and surface **actionable** copy and layout recommendations — not just heatmaps.

One click: a swarm of 5–10 curated personas fans out, each with their own goals, objections, and voice. Live events stream into a dashboard. When the dust settles, an aggregator clusters friction across personas and produces 3–5 concrete fixes.

## How it works

```
 Dashboard (/dash) ──POST /api/runs──► Orchestrator
                                         │
                                         ├─ spawns N Claude Code subprocesses (Claude Agent SDK)
                                         │  each with:
                                         │    • persona-tailored system prompt
                                         │    • in-process MCP tools that wrap Playwright
                                         │         (snapshot / click / scroll / type / narrate / finish)
                                         │    • the demo page URL as the task
                                         │
                                         ├─ tools emit structured events (perceive / think / act / verdict)
                                         │  to an in-memory event bus
                                         │
                                         ├─ SSE endpoint fans events out to the dashboard live
                                         │
                                         └─ when all personas finish:
                                            aggregator clusters friction → Claude polish pass
                                            → 3–5 recommendations with severity + suggestedChange
```

Inference runs via [`@anthropic-ai/claude-agent-sdk`](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk), which spawns the `claude` CLI as a subprocess per persona — tokens come from your Claude Code auth, not a separate `ANTHROPIC_API_KEY`.

Browser driving uses Playwright directly via MCP tools we define in [`lib/agent/tools.ts`](lib/agent/tools.ts), not `browser-use` or `browser-harness`. The tool surface is deliberately narrow so persona voice dominates the narration.

## Prerequisites

- Node 20+
- `pnpm`
- The `claude` CLI installed and logged in ([install guide](https://docs.claude.com/en/docs/claude-code/setup))

## Run it

```bash
pnpm install
pnpm exec playwright install chromium   # one-time
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Open dashboard**, then **Run simulation**. First persona events stream within ~20 s; a full 7-persona swarm completes in ~2–3 min.

## Repo layout

```
app/
  page.tsx                       # home / welcome
  demo/                          # bundled FlowLens SaaS landing page (target of simulations)
  dash/                          # live dashboard
  api/runs/                      # POST runs, SSE stream, artifact + screenshot serving
lib/
  schemas.ts                     # zod schemas for events, personas, run artifacts
  personas.ts                    # persona loader
  storage.ts                     # per-run artifact persistence
  event-bus.ts                   # in-process pub/sub for SSE fanout
  aggregator.ts                  # friction clustering + Claude polish pass
  agent/
    tools.ts                     # MCP tool server factory (Playwright wrappers)
    worker.ts                    # one persona = one Claude Code session
    orchestrator.ts              # run manager, concurrency, staggered launches
data/
  personas/*.json                # 7 seed personas
  runs/fixture/                  # saved run used as offline fallback (gitignored otherwise)
```

## Seeded personas

- **Miriam, Fractional CFO** — terse, cost-anchored, wants a 50-seat cost without talking to sales.
- **Arjun, Junior Backend Engineer** — impatient, compares to CompetitorX, bounces on marketing fluff.
- **Priya, Solo Founder** — decisive, 45-second patience, annoyed by sales-gated CTAs.
- **David, Head of Enterprise Compliance** — scans for SOC 2, GDPR, DPAs.
- **Sara, Growth Marketing Lead** — skims for HubSpot / Segment / Marketo integrations.
- **Lena, Senior Product Designer** — judges polish in 30 s, bounces on generic illustrations.
- **Tomo, CS Student** — curious, patient, reads the FAQ.

## Seeded friction in the demo page

The bundled FlowLens page (`app/demo/`) plants six deliberate flaws so the recommendation engine has signal:

1. Hero copy is feature-names-no-outcomes.
2. Primary CTA below the fold on smaller viewports.
3. Enterprise tier is "Contact sales" with no self-serve cost signal.
4. No annual-billing toggle.
5. FAQ buried below the footer.
6. `$0 free forever*` footnote reveals "30-day trial, then $29/month. Credit card required."

A real run surfaces these as high / medium severity recommendations named explicitly (pricing opacity, placeholder graphic, dark-pattern CTA, missing billing FAQ, missing integrations).

## Extending it

- **New personas:** drop a JSON file in `data/personas/` matching the shape in [`lib/schemas.ts`](lib/schemas.ts).
- **New target page:** change the `demoUrl` passed to `POST /api/runs` or point the worker at an external URL.
- **Tighten the tool surface:** edit [`lib/agent/tools.ts`](lib/agent/tools.ts). Each tool is a `tool(name, description, zodSchema, handler)` — handlers emit structured events and execute Playwright calls.
- **Tune the aggregator:** [`lib/aggregator.ts`](lib/aggregator.ts) has a keyword-bucket cluster step and a single Claude polish pass. Swap the clusterer for embeddings if you need semantic grouping.
