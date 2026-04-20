import { NextRequest, NextResponse } from "next/server";
import { loadPersonas } from "@/lib/personas";
import { createRun, startRunInBackground } from "@/lib/agent/orchestrator";
import { listRunIds, readArtifact } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    personaIds?: string[];
    demoUrl?: string;
  };

  const all = await loadPersonas();
  const selected = body.personaIds?.length
    ? all.filter((p) => body.personaIds!.includes(p.id))
    : all;

  if (selected.length === 0) {
    return NextResponse.json({ error: "no personas selected" }, { status: 400 });
  }

  const origin = req.nextUrl.origin;
  const demoUrl = body.demoUrl ?? `${origin}/demo`;

  const runId = await createRun(selected);

  void startRunInBackground(runId, { personas: selected, demoUrl });

  return NextResponse.json({ runId });
}

export async function GET() {
  const ids = await listRunIds();
  const runs = [];
  for (const id of ids.slice(0, 50)) {
    const a = await readArtifact(id);
    if (a) {
      runs.push({
        runId: a.runId,
        createdAt: a.createdAt,
        completedAt: a.completedAt,
        status: a.status,
        personaCount: a.personas.length,
      });
    }
  }
  return NextResponse.json({ runs });
}
