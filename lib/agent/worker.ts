import { query } from "@anthropic-ai/claude-agent-sdk";
import { chromium, type Browser } from "playwright";
import { createPersonaToolServer, PERSONA_ALLOWED_TOOLS } from "@/lib/agent/tools";
import { runEventBus } from "@/lib/event-bus";
import type { Persona } from "@/lib/schemas";

const MAX_STEPS = 15;
const PERSONA_TIMEOUT_MS = 120_000;
const DEMO_URL_DEFAULT = "http://localhost:3000/demo";

function buildSystemPrompt(persona: Persona): string {
  return [
    `You are ${persona.name}, ${persona.role}.`,
    `Voice: ${persona.voice}.`,
    `Your goal right now: ${persona.primary_goal}.`,
    `You have about ${persona.time_budget_seconds} seconds of patience; act like someone who will leave when frustrated.`,
    `Common objections you raise: ${persona.objections.join("; ")}.`,
    `Success criterion: ${persona.success_criteria}.`,
    "",
    "You are visiting a web page inside a browser I control for you. You cannot talk to humans or open other sites. You have these MCP tools:",
    "- snapshot: capture the current page (screenshot + visible text). You MUST call snapshot first, and again after every action that changes the page.",
    "- narrate: emit a thought without acting. Use to read aloud or explain your reasoning.",
    "- click: click at pixel (x, y) in the viewport. Use the screenshot to locate the element, then estimate coordinates.",
    "- scroll: scroll by dy pixels (positive = down).",
    "- type_text: type into the focused field (click a field first).",
    "- finish: end the session. Call this with outcome 'converted' (you completed your goal), 'bounced' (you gave up in frustration), or 'confused' (you couldn't figure it out).",
    "",
    "Rules:",
    "1. Stay strictly in character. Do not break the fourth wall.",
    "2. Do NOT be agreeable by default. If something is confusing, opaque, missing, or annoying, say so in your rationale and sentiment.",
    "3. Give every click / scroll / type_text a 'rationale' in first person, your voice.",
    "4. Provide 'sentiment' (-1..+1) and 'confusion' (0..1) on action and narrate calls so we know how you feel.",
    `5. Do not exceed ${MAX_STEPS} actions. Once you have enough to judge, call finish.`,
    "6. After finish, stop producing output immediately.",
  ].join("\n");
}

function buildUserPrompt(persona: Persona, demoUrl: string): string {
  return [
    `Visit ${demoUrl}. Explore it as ${persona.name}.`,
    "Start by calling snapshot to see the page. Then narrate your first impressions, take an action, snapshot again, and continue.",
    "When you've reached a verdict (or given up), call finish with outcome, reasons, and a 1-5 rating.",
  ].join(" ");
}

export type PersonaRunResult = {
  personaId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  reason: "verdict" | "timeout" | "step_cap" | "error";
  error?: string;
};

export async function runPersona(params: {
  runId: string;
  persona: Persona;
  demoUrl?: string;
  browser: Browser;
}): Promise<PersonaRunResult> {
  const { runId, persona, browser } = params;
  const demoUrl = params.demoUrl ?? DEMO_URL_DEFAULT;
  const startedAt = new Date().toISOString();
  const startedMs = Date.now();

  runEventBus.publish(runId, {
    type: "persona_started",
    personaId: persona.id,
    step: 0,
    ts: startedAt,
    persona,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 agent-simulations-persona",
  });
  const page = await context.newPage();

  let finished = false;
  const state: { reason: PersonaRunResult["reason"] } = { reason: "step_cap" };
  let errorMessage: string | undefined;

  const stepCounter = { current: 0 };
  const onFinish = () => {
    finished = true;
    state.reason = "verdict";
  };

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    if (!finished) {
      state.reason = "timeout";
      abortController.abort();
    }
  }, PERSONA_TIMEOUT_MS);

  try {
    await page.goto(demoUrl, { waitUntil: "domcontentloaded", timeout: 15_000 });

    const toolServer = createPersonaToolServer({ page, runId, persona, onFinish }, stepCounter);

    const q = query({
      prompt: buildUserPrompt(persona, demoUrl),
      options: {
        systemPrompt: buildSystemPrompt(persona),
        mcpServers: { persona: toolServer },
        allowedTools: PERSONA_ALLOWED_TOOLS,
        tools: [],
        maxTurns: MAX_STEPS * 2,
        abortController,
        cwd: process.cwd(),
        permissionMode: "default",
      },
    });

    for await (const message of q) {
      if (finished) break;
      if (stepCounter.current > MAX_STEPS + 3) {
        state.reason = "step_cap";
        break;
      }
      if (message.type === "result") {
        if (message.subtype !== "success" && !finished) {
          state.reason = "error";
          errorMessage = message.subtype;
        }
        break;
      }
    }

    if (!finished) {
      const outcome = state.reason === "timeout" ? "confused" : "bounced";
      const reasonText =
        state.reason === "timeout"
          ? "ran out of time"
          : state.reason === "step_cap"
            ? "ran out of steps without reaching a verdict"
            : `early stop: ${errorMessage ?? state.reason}`;
      runEventBus.publish(runId, {
        type: "verdict",
        personaId: persona.id,
        step: ++stepCounter.current,
        ts: new Date().toISOString(),
        outcome,
        reasons: [reasonText],
        rating: 2,
      });
    }
  } catch (e) {
    state.reason = "error";
    errorMessage = e instanceof Error ? e.message : String(e);
    if (!finished) {
      runEventBus.publish(runId, {
        type: "verdict",
        personaId: persona.id,
        step: ++stepCounter.current,
        ts: new Date().toISOString(),
        outcome: "confused",
        reasons: [`internal error: ${errorMessage}`],
        rating: 1,
      });
    }
  } finally {
    clearTimeout(timeoutId);
    await context.close().catch(() => {});
  }

  const finishedAt = new Date().toISOString();
  const durationMs = Date.now() - startedMs;
  runEventBus.publish(runId, {
    type: "persona_finished",
    personaId: persona.id,
    step: stepCounter.current,
    ts: finishedAt,
    durationMs,
    reason: state.reason,
  });

  return {
    personaId: persona.id,
    startedAt,
    finishedAt,
    durationMs,
    reason: state.reason,
    error: errorMessage,
  };
}

export async function launchBrowser(): Promise<Browser> {
  return chromium.launch({ headless: true });
}
