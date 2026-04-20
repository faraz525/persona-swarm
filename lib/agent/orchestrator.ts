import { runEventBus } from "@/lib/event-bus";
import {
  ensureRunDirs,
  newRunId,
  writeArtifact,
  readArtifact,
} from "@/lib/storage";
import type { Persona, RunArtifact } from "@/lib/schemas";
import { runPersona, launchBrowser } from "@/lib/agent/worker";
import { aggregate } from "@/lib/aggregator";

const MAX_CONCURRENCY = 5;
const STAGGER_MS = 500;

export type StartRunParams = {
  personas: Persona[];
  demoUrl?: string;
};

export async function createRun(personas: Persona[]): Promise<string> {
  const runId = newRunId();
  await ensureRunDirs(runId);
  const artifact: RunArtifact = {
    runId,
    createdAt: new Date().toISOString(),
    status: "queued",
    personas,
    events: [],
    recommendations: [],
  };
  await writeArtifact(artifact);
  return runId;
}

export async function startRunInBackground(runId: string, params: StartRunParams): Promise<void> {
  const initial = await readArtifact(runId);
  if (!initial) return;
  const artifact: RunArtifact = { ...initial };

  try {
    runEventBus.publish(runId, {
      type: "run_status",
      ts: new Date().toISOString(),
      runId,
      status: "running",
      message: "launching browser and persona swarm",
    });
    artifact.status = "running";
    await writeArtifact(artifact);

    const browser = await launchBrowser();
    try {
      await runWithConcurrency(
        params.personas,
        MAX_CONCURRENCY,
        async (persona, idx) => {
          if (idx > 0) await sleep(STAGGER_MS);
          await runPersona({ runId, persona, demoUrl: params.demoUrl, browser });
        },
      );
    } finally {
      await browser.close().catch(() => {});
    }

    runEventBus.publish(runId, {
      type: "run_status",
      ts: new Date().toISOString(),
      runId,
      status: "aggregating",
      message: "clustering friction and generating recommendations",
    });
    artifact.status = "aggregating";
    artifact.events = runEventBus.snapshot(runId).filter(isArtifactEvent);
    await writeArtifact(artifact);

    const recs = await aggregate(artifact);
    artifact.recommendations = recs;
    runEventBus.publish(runId, {
      type: "recommendations",
      ts: new Date().toISOString(),
      runId,
      recommendations: recs,
    });

    artifact.status = "complete";
    artifact.completedAt = new Date().toISOString();
    artifact.events = runEventBus.snapshot(runId).filter(isArtifactEvent);
    await writeArtifact(artifact);

    runEventBus.publish(runId, {
      type: "run_status",
      ts: new Date().toISOString(),
      runId,
      status: "complete",
    });
  } catch (e) {
    artifact.status = "failed";
    artifact.completedAt = new Date().toISOString();
    artifact.events = runEventBus.snapshot(runId).filter(isArtifactEvent);
    await writeArtifact(artifact);
    runEventBus.publish(runId, {
      type: "run_status",
      ts: new Date().toISOString(),
      runId,
      status: "failed",
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

function isArtifactEvent(e: ReturnType<typeof runEventBus.snapshot>[number]): boolean {
  return e.type !== "run_status" && e.type !== "recommendations";
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  const indexed = items.map((it, i) => [it, i] as const);
  const queue = [...indexed];
  const active: Promise<void>[] = [];

  const startNext = (): Promise<void> | null => {
    const next = queue.shift();
    if (!next) return null;
    const [item, idx] = next;
    const p = worker(item, idx)
      .catch(() => {})
      .then(() => {
        const i = active.indexOf(p);
        if (i >= 0) active.splice(i, 1);
      });
    active.push(p);
    return p;
  };

  while (active.length < limit) {
    if (!startNext()) break;
  }
  while (active.length > 0) {
    await Promise.race(active);
    while (active.length < limit) {
      if (!startNext()) break;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
