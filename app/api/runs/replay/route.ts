import { NextResponse } from "next/server";
import { replayFixture } from "@/lib/runs/replay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const runId = await replayFixture();
  return NextResponse.json({ runId });
}
