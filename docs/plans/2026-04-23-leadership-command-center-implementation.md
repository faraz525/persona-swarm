# Leadership Command Center Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn Persona Swarm into a clean, minimal, polished leadership demo with a credible live command center and evidence-backed payoff.

**Architecture:** Keep the existing Next.js App Router, SSE stream, fixture replay, personas, and recommendation API. Add small frontend-only derivation helpers for executive metrics, emerging themes, and focus selection, then compose those signals into a redesigned homepage and dashboard. Avoid backend changes unless a UI bug exposes a real data contract problem.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, pnpm, Vitest for focused helper tests, in-app browser verification.

---

## Preconditions

Before implementing, create an isolated git worktree or confirm that implementation should continue in the current working tree.

Use `superpowers:using-git-worktrees` if creating a worktree. If no worktree directory preference exists, ask whether to use `.worktrees/` or a global worktree directory.

Baseline checks from the project root:

```bash
pnpm install
pnpm lint
pnpm build
```

Expected: dependencies install, lint passes, production build passes.

If `pnpm build` fails because the local environment lacks required browser/Claude runtime state, capture the exact failure and continue only after deciding whether it is unrelated to the UI work.

---

### Task 1: Add Focused Test Harness

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Step 1: Add Vitest**

Run:

```bash
pnpm add -D vitest
```

Expected: `vitest` is added to `devDependencies` and `pnpm-lock.yaml` updates.

**Step 2: Add test script**

In `package.json`, add:

```json
"test": "vitest run --passWithNoTests"
```

Keep existing scripts unchanged.

**Step 3: Verify empty test command**

Run:

```bash
pnpm test
```

Expected: Vitest exits successfully with no tests found.

**Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "test: add vitest harness"
```

---

### Task 2: Build Dashboard Insight Derivation

**Files:**
- Create: `app/dash/components/insights.ts`
- Create: `app/dash/components/insights.test.ts`
- Read: `app/dash/components/types.ts`

**Step 1: Write failing tests**

Create `app/dash/components/insights.test.ts` with tests for:
- summary metrics: launched, completed, converted, bounced, blocked buyers, conversion rate
- top blocker from recommendations when available
- fallback top blocker from verdict/theme keywords while a run is still live
- focus selection preferring selected persona, then newest verdict, then highest confusion, then newest active persona
- emerging theme extraction from thoughts, verdicts, and recommendations

Example test shape:

```ts
import { describe, expect, it } from "vitest";
import type { PersonaLive, RunState } from "./types";
import {
  deriveExecutiveSummary,
  deriveEmergingThemes,
  selectFocusPersona,
} from "./insights";

const persona = (id: string, overrides: Partial<PersonaLive> = {}): PersonaLive => ({
  persona: {
    id,
    name: id,
    role: "Buyer",
    primary_goal: "Evaluate the page",
    time_budget_seconds: 60,
    objections: [],
    technical_level: "medium",
    voice: "direct",
    success_criteria: "understands value",
  },
  status: "running",
  steps: [],
  ...overrides,
});

describe("deriveExecutiveSummary", () => {
  it("summarizes buyer outcomes and recommendation readiness", () => {
    const state: RunState = {
      runId: "fixture",
      status: "complete",
      personas: new Map([
        ["a", persona("a", { status: "done", outcome: "converted" })],
        ["b", persona("b", { status: "done", outcome: "bounced" })],
        ["c", persona("c", { status: "done", outcome: "confused" })],
      ]),
      recommendations: [
        {
          id: "pricing",
          severity: "high",
          affectedPersonas: ["b", "c"],
          title: "Pricing opacity blocks evaluation",
          detail: "Buyers cannot model costs.",
          suggestedChange: "Show clear pricing.",
        },
      ],
    };

    expect(deriveExecutiveSummary(state)).toMatchObject({
      launched: 3,
      completed: 3,
      converted: 1,
      blocked: 2,
      conversionRate: 33,
      topBlocker: "Pricing opacity blocks evaluation",
      recommendationsReady: true,
    });
  });
});
```

**Step 2: Run tests to verify failure**

Run:

```bash
pnpm test app/dash/components/insights.test.ts
```

Expected: FAIL because `./insights` does not exist.

**Step 3: Implement `insights.ts`**

Create exported helpers:

```ts
export type ExecutiveSummary = {
  launched: number;
  completed: number;
  converted: number;
  bounced: number;
  confused: number;
  blocked: number;
  conversionRate: number;
  topBlocker: string;
  recommendationsReady: boolean;
};

export type EmergingTheme = {
  id: string;
  label: string;
  count: number;
  severity: "high" | "medium" | "low";
};
```

Implement deterministic keyword theme buckets:
- pricing: `pricing`, `price`, `cost`, `seat`, `billing`, `trial`, `credit card`
- trust: `soc`, `gdpr`, `security`, `compliance`, `dpa`, `data residency`
- integrations: `integration`, `hubspot`, `segment`, `marketo`, `salesforce`
- product proof: `screenshot`, `illustration`, `placeholder`, `generic`, `buzzword`
- developer proof: `docs`, `api`, `developer`, `reference`

Use recommendation severity when recommendations exist. Otherwise infer severity from repeated live signals.

**Step 4: Run focused tests**

Run:

```bash
pnpm test app/dash/components/insights.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add app/dash/components/insights.ts app/dash/components/insights.test.ts
git commit -m "feat(dash): derive leadership demo insights"
```

---

### Task 3: Redesign Dashboard Shell

**Files:**
- Modify: `app/dash/page.tsx`
- Modify: `app/dash/components/dash-app.tsx`
- Modify: `app/dash/components/run-header.tsx`
- Create: `app/dash/components/executive-summary.tsx`
- Create: `app/dash/components/emerging-themes.tsx`
- Create: `app/dash/components/focus-rail.tsx`
- Modify: `app/dash/components/persona-grid.tsx`
- Modify: `app/dash/components/persona-detail.tsx`
- Modify: `app/dash/components/funnel-chart.tsx`
- Modify: `app/dash/components/recommendations-panel.tsx`

**Step 1: Update dashboard page background**

In `app/dash/page.tsx`, use a light minimal surface:

```tsx
export default function DashPage() {
  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <DashApp />
    </div>
  );
}
```

**Step 2: Refactor `DashApp` layout**

Use `deriveExecutiveSummary`, `deriveEmergingThemes`, and `selectFocusPersona`.

Layout target:
- max width: `max-w-[1500px]`
- top mission header
- executive summary band
- two-column workspace: `lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]`
- recommendations below

Auto-select focus:
- if user clicked a persona, keep manual selection
- otherwise use `selectFocusPersona(personas)`
- when no personas exist, show a pre-run focus preview with fixture scenario language

**Step 3: Redesign `RunHeader`**

Make it concise and polished:
- product eyebrow: `Persona Swarm`
- H1: `Buyer friction command center`
- copy: `Evaluate FlowLens with seven synthetic buyer lenses, live browser evidence, and ranked fixes.`
- target link: `/demo`
- status pill
- controls aligned right
- primary CTA should be `Replay flagship run`
- secondary CTA should be `Run live`

Use only subtle slate/indigo accents.

**Step 4: Create `ExecutiveSummary`**

Props:

```ts
type Props = {
  summary: ExecutiveSummary;
  status: RunState["status"];
  themes: EmergingTheme[];
};
```

Render five compact metric cells:
- `Personas launched`
- `Conversion`
- `Buyers blocked`
- `Top blocker`
- `Recommendations`

For pre-run/idle, show scenario preview values without implying a completed live result.

**Step 5: Create `EmergingThemes`**

Render a small panel or strip of chips:
- label
- count
- severity dot

When no live themes exist, show planned lenses:
- Pricing clarity
- Product proof
- Compliance trust
- Integrations
- Developer proof

**Step 6: Create `FocusRail`**

Props:

```ts
type Props = {
  live: PersonaLive | null;
  status: RunState["status"];
};
```

Content:
- focused persona name, role, and goal
- latest screenshot if available
- latest thought/action/verdict
- verdict reasons if complete
- short “Why it matters” line derived from outcome or objection
- compact journey list using the existing step row pattern, but not a wall of logs

For no selected/live persona, show a pre-run flagship scenario preview.

**Step 7: Redesign `PersonaGrid`**

Keep the component functional but reduce density:
- compact heading: `Buyer lenses`
- status/outcome pill
- latest signal line clamped to 2 lines
- small progress line: steps and rating
- use consistent avatar circles without loud gradients
- cards should look selectable but not heavy

**Step 8: Tune supporting panels**

Update `FunnelChart`, `PersonaDetail`, and `RecommendationsPanel` to match the new visual system:
- white panels
- thin borders
- subtle shadow
- fewer dashed empty boxes
- concise headings
- severity-coded recommendation bars
- no nested-card appearance

`PersonaDetail` can remain as a lower-priority evidence surface if `FocusRail` now carries the promoted story.

**Step 9: Run checks**

Run:

```bash
pnpm test app/dash/components/insights.test.ts
pnpm lint
pnpm build
```

Expected: tests pass, lint passes, build passes.

**Step 10: Commit**

```bash
git add app/dash
git commit -m "feat(dash): redesign leadership command center"
```

---

### Task 4: Redesign Homepage And Metadata

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

**Step 1: Update metadata**

In `app/layout.tsx`:

```ts
export const metadata: Metadata = {
  title: "Persona Swarm",
  description: "Synthetic buyer personas reveal landing-page friction with live browser evidence.",
};
```

**Step 2: Fix global light theme**

In `app/globals.css`, remove the dark color-scheme override so the app does not render low-contrast black backgrounds on systems using dark mode.

Set:

```css
:root {
  --background: #f6f7f9;
  --foreground: #0f172a;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

Keep the existing Geist CSS variables.

**Step 3: Redesign `app/page.tsx`**

Use a minimal leadership launch surface:
- H1: `Reveal why buyers bounce before you ship`
- supporting copy about synthetic buyer personas browsing in real browsers
- CTA: `Open command center` to `/dash?runId=fixture&paced=1`
- secondary CTA: `Inspect target page` to `/demo`
- right-side dashboard preview with fixture stats
- proof strip with `7 personas`, `5 blockers`, `2/7 converted`, `ranked fixes`
- three-step process row
- compact leadership framing section

Avoid decorative gradients and fake product claims.

**Step 4: Run checks**

Run:

```bash
pnpm lint
pnpm build
```

Expected: lint and build pass.

**Step 5: Commit**

```bash
git add app/page.tsx app/layout.tsx app/globals.css
git commit -m "feat: redesign leadership launch page"
```

---

### Task 5: Browser Verification And Polish

**Files:**
- Modify as needed based on verification findings.

**Step 1: Start dev server**

Run:

```bash
pnpm dev
```

If port 3000 is unavailable, use:

```bash
pnpm exec next dev --port 3002
```

**Step 2: Verify homepage in browser**

Open:

```text
http://localhost:3002/
```

Check:
- first viewport is light, clean, and readable
- text contrast is strong
- CTAs are visible
- dashboard preview does not look like a fake illustration
- no text overlaps at desktop width

**Step 3: Verify dashboard idle/replay path**

Open:

```text
http://localhost:3002/dash
```

Then click `Replay flagship run`.

Check:
- first viewport explains the mission before events arrive
- summary band updates quickly
- persona board shows live movement
- focus rail has screenshot/evidence content
- emerging theme chips appear during the run
- final recommendations read as the executive payoff

**Step 4: Verify direct replay deep link**

Open:

```text
http://localhost:3002/dash?runId=fixture&paced=1
```

Check:
- no broken initial state
- run events hydrate correctly
- status progresses to complete
- recommendations render

**Step 5: Verify responsive behavior**

Check widths around:
- 1440px desktop recording
- 1024px laptop
- 390px mobile

Expected:
- no overlapping text
- no horizontal overflow
- cards and focus rail stack cleanly on narrow screens
- buttons wrap cleanly

**Step 6: Final checks**

Run:

```bash
pnpm test
pnpm lint
pnpm build
git status --short
```

Expected:
- tests pass
- lint passes
- build passes
- only intentional files are modified

**Step 7: Final commit**

If polish changes were required:

```bash
git add <changed-files>
git commit -m "polish: refine leadership demo experience"
```

---

## Done Criteria

The implementation is complete when:
- `/` presents a clean launch surface with strong CTA into the command center
- `/dash` has a polished mission header, executive summary, persona board, focus rail, emerging themes, and elevated recommendations
- fixture replay remains reliable through `/dash?runId=fixture&paced=1`
- the app no longer suffers from dark-mode homepage contrast issues
- `pnpm test`, `pnpm lint`, and `pnpm build` pass or any environment-specific exception is documented
- the in-app browser has verified the desktop and mobile layouts
