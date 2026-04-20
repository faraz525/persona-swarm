import { EventEmitter } from "node:events";
import type { RunEvent } from "@/lib/schemas";

type Subscriber = (event: RunEvent) => void;

class RunEventBus {
  private emitter = new EventEmitter();
  private history = new Map<string, RunEvent[]>();

  publish(runId: string, event: RunEvent): void {
    const list = this.history.get(runId) ?? [];
    list.push(event);
    this.history.set(runId, list);
    this.emitter.emit(runId, event);
  }

  subscribe(runId: string, handler: Subscriber): () => void {
    const past = this.history.get(runId) ?? [];
    for (const e of past) handler(e);
    this.emitter.on(runId, handler);
    return () => this.emitter.off(runId, handler);
  }

  snapshot(runId: string): RunEvent[] {
    return [...(this.history.get(runId) ?? [])];
  }

  forget(runId: string): void {
    this.history.delete(runId);
    this.emitter.removeAllListeners(runId);
  }
}

declare global {
  var __runEventBus: RunEventBus | undefined;
}

export const runEventBus: RunEventBus = globalThis.__runEventBus ?? new RunEventBus();
if (!globalThis.__runEventBus) {
  globalThis.__runEventBus = runEventBus;
}
