import { NextRequest } from "next/server";
import { runEventBus } from "@/lib/event-bus";
import { readArtifact } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PACED_GAP_CAP_MS = 1200;
const PACED_DEFAULT_SPEED = 2;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artifact = await readArtifact(id);
  if (!artifact) {
    return new Response(JSON.stringify({ error: "not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  const paced = req.nextUrl.searchParams.get("paced") === "1";
  const speedParam = Number(req.nextUrl.searchParams.get("speed"));
  const speed =
    Number.isFinite(speedParam) && speedParam > 0 ? speedParam : PACED_DEFAULT_SPEED;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const send = (event: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {}
      };

      send({ type: "hello", runId: id, status: artifact.status });

      const heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {}
      }, 15_000);

      let unsubscribe: () => void = () => {};

      const abort = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      };
      req.signal.addEventListener("abort", abort);

      if (paced && artifact.events.length) {
        void replayPaced({
          events: artifact.events,
          recommendations: artifact.recommendations,
          runId: id,
          speed,
          send,
          isClosed: () => closed,
        }).finally(abort);
        return;
      }

      const past = runEventBus.snapshot(id);
      if (past.length === 0 && artifact.events.length) {
        for (const e of artifact.events) send(e);
      }

      unsubscribe = runEventBus.subscribe(id, (event) => {
        send(event);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}

type ArtifactEvent = { ts?: string; type?: string };
type Recommendation = { id: string; severity: string; title: string; detail: string; suggestedChange: string; affectedPersonas: string[] };

async function replayPaced(opts: {
  events: ArtifactEvent[];
  recommendations: Recommendation[];
  runId: string;
  speed: number;
  send: (event: unknown) => void;
  isClosed: () => boolean;
}): Promise<void> {
  const { events, recommendations, runId, speed, send, isClosed } = opts;

  send({
    type: "run_status",
    ts: new Date().toISOString(),
    runId,
    status: "running",
    message: "replaying recorded swarm",
  });

  const firstTs = tsMs(events[0]?.ts);
  let prevTs = firstTs;

  for (const event of events) {
    if (isClosed()) return;
    const cur = tsMs(event.ts);
    if (firstTs !== null && prevTs !== null && cur !== null) {
      const gap = Math.min(cur - prevTs, PACED_GAP_CAP_MS);
      const wait = Math.max(0, Math.round(gap / speed));
      if (wait > 0) await sleep(wait);
    }
    if (isClosed()) return;
    send(event);
    prevTs = cur;
  }

  if (isClosed()) return;
  await sleep(Math.round(600 / speed));
  send({
    type: "run_status",
    ts: new Date().toISOString(),
    runId,
    status: "aggregating",
    message: "clustering friction",
  });

  await sleep(Math.round(900 / speed));
  if (isClosed()) return;
  send({
    type: "recommendations",
    ts: new Date().toISOString(),
    runId,
    recommendations,
  });

  send({
    type: "run_status",
    ts: new Date().toISOString(),
    runId,
    status: "complete",
  });
}

function tsMs(ts: string | undefined): number | null {
  if (!ts) return null;
  const n = Date.parse(ts);
  return Number.isFinite(n) ? n : null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
