# Variant Studio Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a leadership-demo-ready Variant Studio that turns persona feedback into evidence-backed A/B copy variants.

**Architecture:** Extend the existing post-run synthesis path with typed copy variants, stream them over SSE, persist them in run artifacts, and render them in the dashboard beside ranked fixes. Keep the demo safe by generating preview variants only; do not modify source files or deploy generated copy automatically.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zod, Claude Agent SDK, Vitest.

---

### Task 1: Add Typed Variant Synthesis

**Files:**
- Modify: `lib/schemas.ts`
- Create: `lib/variants.ts`
- Create: `lib/variants.test.ts`

**Steps:**
1. Add `copyVariantSchema`, `copyVariantsEventSchema`, and `CopyVariant` types.
2. Build deterministic fallback variants from recommendations.
3. Add `generateCopyVariants` that asks Claude for two variants and falls back deterministically.
4. Test evidence mapping, variant count, and fallback behavior with Vitest.

### Task 2: Stream and Persist Variants

**Files:**
- Modify: `lib/agent/orchestrator.ts`
- Modify: `app/api/runs/[id]/sse/route.ts`
- Modify: `data/runs/fixture/run.json`

**Steps:**
1. Generate variants after recommendations.
2. Publish a `copy_variants` event.
3. Store `copyVariants` in run artifacts.
4. Replay fixture variants after recommendations.

### Task 3: Render Variant Studio

**Files:**
- Modify: `app/dash/components/types.ts`
- Modify: `app/dash/components/dash-app.tsx`
- Create: `app/dash/components/variant-studio.tsx`

**Steps:**
1. Track `copyVariants` in client run state.
2. Apply `copy_variants` stream events.
3. Add a clean Variant Studio panel below Ranked fixes.
4. Include links to `/demo?variant=a` and `/demo?variant=b`.

### Task 4: Support Demo Preview Links

**Files:**
- Modify: `app/demo/page.tsx`
- Modify: `app/demo/components/hero.tsx`
- Modify: `app/demo/components/pricing.tsx`
- Modify: `app/demo/components/faq.tsx`

**Steps:**
1. Read the `variant` search param.
2. Render preview copy for Variant A and Variant B.
3. Keep unchanged behavior for the default page.

### Task 5: Verify

**Commands:**
- `pnpm test`
- `pnpm lint`
- `pnpm build`

**Browser checks:**
- `http://localhost:3011/dash?runId=fixture&paced=1`
- `http://localhost:3011/demo?variant=a`
- `http://localhost:3011/demo?variant=b`
