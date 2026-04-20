import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import type { Page } from "playwright";
import { promises as fs } from "node:fs";
import path from "node:path";
import { screenshotsDir } from "@/lib/storage";
import { runEventBus } from "@/lib/event-bus";
import type { Persona, RunEvent } from "@/lib/schemas";

export type ToolContext = {
  page: Page;
  runId: string;
  persona: Persona;
  onFinish: (verdict: { outcome: "converted" | "bounced" | "confused"; reasons: string[]; rating: number }) => void;
};

type StepCounter = { current: number };

function now(): string {
  return new Date().toISOString();
}

function publish(runId: string, e: RunEvent): void {
  runEventBus.publish(runId, e);
}

async function captureScreenshot(page: Page, runId: string, personaId: string, step: number): Promise<string> {
  const dir = screenshotsDir(runId);
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${personaId}-${String(step).padStart(3, "0")}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return `/api/runs/${runId}/screenshots/${personaId}-${String(step).padStart(3, "0")}.png`;
}

async function readViewport(page: Page): Promise<{
  url: string;
  title: string;
  scrollY: number;
  pageHeight: number;
  visibleText: string;
}> {
  return await page.evaluate(() => {
    const clip = (s: string, n: number): string =>
      s.length > n ? s.slice(0, n) + "…[truncated]" : s;
    const visible = (document.body?.innerText ?? "").replace(/\s+/g, " ").trim();
    return {
      url: location.href,
      title: document.title,
      scrollY: window.scrollY,
      pageHeight: document.documentElement.scrollHeight,
      visibleText: clip(visible, 4000),
    };
  });
}

export function createPersonaToolServer(ctx: ToolContext, step: StepCounter) {
  const { page, runId, persona } = ctx;
  const personaId = persona.id;

  const snapshot = tool(
    "snapshot",
    "Capture the current page state: screenshot, URL, title, scroll position, and the visible text. You MUST call snapshot first and again after every action that changes the page. The screenshot is returned as an image you can look at.",
    {},
    async () => {
      const s = ++step.current;
      const vp = await readViewport(page);
      const screenshotPath = await captureScreenshot(page, runId, personaId, s);
      publish(runId, {
        type: "perceive",
        personaId,
        step: s,
        ts: now(),
        screenshotPath,
        visibleText: vp.visibleText,
        viewport: { url: vp.url, title: vp.title, scrollY: vp.scrollY, pageHeight: vp.pageHeight },
      });
      publish(runId, {
        type: "act",
        personaId,
        step: s,
        ts: now(),
        action: "snapshot",
        target: vp.url,
        rationale: "observed page state",
      });

      const abs = path.join(screenshotsDir(runId), `${personaId}-${String(s).padStart(3, "0")}.png`);
      const data = await fs.readFile(abs);
      return {
        content: [
          {
            type: "text" as const,
            text: `url: ${vp.url}\ntitle: ${vp.title}\nscrollY: ${vp.scrollY}\npageHeight: ${vp.pageHeight}\n\nvisible text:\n${vp.visibleText}`,
          },
          {
            type: "image" as const,
            data: data.toString("base64"),
            mimeType: "image/png",
          },
        ],
      };
    },
  );

  const narrate = tool(
    "narrate",
    "Emit a thought without acting. Use to narrate what you are reading, what you are about to do, or how you feel. Stay in character.",
    {
      thought: z.string().describe("First-person thought, stay in character"),
      sentiment: z.number().min(-1).max(1).describe("-1 very negative, 0 neutral, +1 very positive"),
      confusion: z.number().min(0).max(1).describe("0 fully clear, 1 very confused"),
    },
    async (args) => {
      const s = ++step.current;
      publish(runId, {
        type: "think",
        personaId,
        step: s,
        ts: now(),
        thought: args.thought,
        sentiment: args.sentiment,
        confusion: args.confusion,
      });
      return { content: [{ type: "text" as const, text: "noted" }] };
    },
  );

  const click = tool(
    "click",
    "Click at specific viewport coordinates. Prefer snapshot first so you know what's visible.",
    {
      x: z.number().describe("x in viewport pixels"),
      y: z.number().describe("y in viewport pixels"),
      target_description: z.string().describe("short human description of the element you're clicking"),
      rationale: z.string().describe("why you are clicking, in character"),
      sentiment: z.number().min(-1).max(1).default(0),
      confusion: z.number().min(0).max(1).default(0),
    },
    async (args) => {
      const s = ++step.current;
      publish(runId, {
        type: "think",
        personaId,
        step: s,
        ts: now(),
        thought: args.rationale,
        sentiment: args.sentiment,
        confusion: args.confusion,
      });
      publish(runId, {
        type: "act",
        personaId,
        step: s,
        ts: now(),
        action: "click",
        target: args.target_description,
        rationale: args.rationale,
      });
      try {
        await page.mouse.click(args.x, args.y);
        await page.waitForLoadState("domcontentloaded", { timeout: 3000 }).catch(() => {});
      } catch (e) {
        return {
          content: [{ type: "text" as const, text: `click failed: ${String(e)}` }],
          isError: true,
        };
      }
      return { content: [{ type: "text" as const, text: "clicked; call snapshot to see the new state" }] };
    },
  );

  const scroll = tool(
    "scroll",
    "Scroll the page vertically by pixels (positive = down, negative = up).",
    {
      dy: z.number().describe("pixels to scroll (positive down, negative up)"),
      rationale: z.string(),
      sentiment: z.number().min(-1).max(1).default(0),
      confusion: z.number().min(0).max(1).default(0),
    },
    async (args) => {
      const s = ++step.current;
      publish(runId, {
        type: "think",
        personaId,
        step: s,
        ts: now(),
        thought: args.rationale,
        sentiment: args.sentiment,
        confusion: args.confusion,
      });
      publish(runId, {
        type: "act",
        personaId,
        step: s,
        ts: now(),
        action: "scroll",
        target: `dy=${args.dy}`,
        rationale: args.rationale,
      });
      await page.mouse.wheel(0, args.dy);
      return { content: [{ type: "text" as const, text: "scrolled; call snapshot to see the new state" }] };
    },
  );

  const typeText = tool(
    "type_text",
    "Type text into the currently focused element (click a field first).",
    {
      text: z.string(),
      rationale: z.string(),
      sentiment: z.number().min(-1).max(1).default(0),
      confusion: z.number().min(0).max(1).default(0),
    },
    async (args) => {
      const s = ++step.current;
      publish(runId, {
        type: "think",
        personaId,
        step: s,
        ts: now(),
        thought: args.rationale,
        sentiment: args.sentiment,
        confusion: args.confusion,
      });
      publish(runId, {
        type: "act",
        personaId,
        step: s,
        ts: now(),
        action: "type",
        target: args.text.slice(0, 40),
        rationale: args.rationale,
      });
      await page.keyboard.type(args.text);
      return { content: [{ type: "text" as const, text: "typed" }] };
    },
  );

  const finish = tool(
    "finish",
    "End the session with a final verdict. Call this when you've decided converted (completed goal), bounced (gave up), or confused (could not figure it out).",
    {
      outcome: z.enum(["converted", "bounced", "confused"]),
      reasons: z.array(z.string()).min(1).max(5).describe("top reasons for this outcome, in your voice"),
      rating: z.number().int().min(1).max(5).describe("1-5 star rating of the page experience"),
    },
    async (args) => {
      const s = ++step.current;
      publish(runId, {
        type: "verdict",
        personaId,
        step: s,
        ts: now(),
        outcome: args.outcome,
        reasons: args.reasons,
        rating: args.rating,
      });
      ctx.onFinish({ outcome: args.outcome, reasons: args.reasons, rating: args.rating });
      return { content: [{ type: "text" as const, text: "verdict recorded. End your response now." }] };
    },
  );

  return createSdkMcpServer({
    name: "persona",
    version: "1.0.0",
    tools: [snapshot, narrate, click, scroll, typeText, finish],
  });
}

export const PERSONA_ALLOWED_TOOLS = [
  "mcp__persona__snapshot",
  "mcp__persona__narrate",
  "mcp__persona__click",
  "mcp__persona__scroll",
  "mcp__persona__type_text",
  "mcp__persona__finish",
];
