import { NextRequest, NextResponse } from "next/server";
import { readArtifact } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artifact = await readArtifact(id);
  if (!artifact) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(artifact);
}
