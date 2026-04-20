import { promises as fs } from "node:fs";
import path from "node:path";
import type { RunArtifact, RunEvent, Recommendation } from "@/lib/schemas";

const RUNS_DIR = path.join(process.cwd(), "data", "runs");

export function runDir(runId: string): string {
  return path.join(RUNS_DIR, runId);
}

export function screenshotsDir(runId: string): string {
  return path.join(runDir(runId), "screenshots");
}

export function artifactPath(runId: string): string {
  return path.join(runDir(runId), "run.json");
}

export async function ensureRunDirs(runId: string): Promise<void> {
  await fs.mkdir(screenshotsDir(runId), { recursive: true });
}

export async function writeArtifact(artifact: RunArtifact): Promise<void> {
  await ensureRunDirs(artifact.runId);
  await fs.writeFile(artifactPath(artifact.runId), JSON.stringify(artifact, null, 2), "utf-8");
}

export async function readArtifact(runId: string): Promise<RunArtifact | null> {
  try {
    const raw = await fs.readFile(artifactPath(runId), "utf-8");
    return JSON.parse(raw) as RunArtifact;
  } catch {
    return null;
  }
}

export async function appendEvent(runId: string, event: RunEvent): Promise<void> {
  const existing = await readArtifact(runId);
  if (!existing) return;
  existing.events.push(event);
  await writeArtifact(existing);
}

export async function setRunStatus(
  runId: string,
  status: RunArtifact["status"],
  extras?: Partial<Pick<RunArtifact, "completedAt">>,
): Promise<void> {
  const existing = await readArtifact(runId);
  if (!existing) return;
  existing.status = status;
  if (extras?.completedAt) existing.completedAt = extras.completedAt;
  await writeArtifact(existing);
}

export async function setRecommendations(
  runId: string,
  recommendations: Recommendation[],
): Promise<void> {
  const existing = await readArtifact(runId);
  if (!existing) return;
  existing.recommendations = recommendations;
  await writeArtifact(existing);
}

export async function listRunIds(): Promise<string[]> {
  try {
    const entries = await fs.readdir(RUNS_DIR);
    const filtered: string[] = [];
    for (const e of entries) {
      const stat = await fs.stat(path.join(RUNS_DIR, e));
      if (stat.isDirectory()) filtered.push(e);
    }
    return filtered.sort().reverse();
  } catch {
    return [];
  }
}

export function newRunId(): string {
  return `${new Date().toISOString().replace(/[:.]/g, "-")}-${Math.random().toString(36).slice(2, 8)}`;
}
