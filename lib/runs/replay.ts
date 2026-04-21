import { runEventBus } from "@/lib/event-bus";
import { readArtifact } from "@/lib/storage";
import type { RunEvent } from "@/lib/schemas";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function replayFixture(opts?: { speed?: number }): Promise<string> {
  const speed = opts?.speed ?? 1;

  void (async () => {
    const artifact = await readArtifact("fixture");
    if (!artifact) return;

    runEventBus.forget("fixture");

    runEventBus.publish("fixture", {
      type: "run_status",
      ts: new Date().toISOString(),
      runId: "fixture",
      status: "running",
    });

    const events = [...artifact.events].sort(
      (a, b) => new Date((a as { ts: string }).ts).getTime() - new Date((b as { ts: string }).ts).getTime(),
    );

    let prevTs = events.length > 0 ? new Date((events[0] as { ts: string }).ts).getTime() : 0;

    for (const event of events) {
      const eventTs = new Date((event as { ts: string }).ts).getTime();
      const raw = eventTs - prevTs;
      const delay = Math.min(Math.max(raw / speed, 50), 2000);
      await sleep(delay);
      prevTs = eventTs;

      const published: RunEvent = { ...event, ts: new Date().toISOString() } as RunEvent;
      runEventBus.publish("fixture", published);
    }

    runEventBus.publish("fixture", {
      type: "run_status",
      ts: new Date().toISOString(),
      runId: "fixture",
      status: "aggregating",
    });

    await sleep(500);

    runEventBus.publish("fixture", {
      type: "recommendations",
      ts: new Date().toISOString(),
      runId: "fixture",
      recommendations: artifact.recommendations,
    });

    runEventBus.publish("fixture", {
      type: "run_status",
      ts: new Date().toISOString(),
      runId: "fixture",
      status: "complete",
    });
  })();

  return "fixture";
}
