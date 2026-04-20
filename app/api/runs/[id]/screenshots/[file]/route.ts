import { NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { screenshotsDir } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; file: string }> },
) {
  const { id, file } = await params;
  if (!/^[a-zA-Z0-9._-]+\.png$/.test(file)) {
    return new Response("bad filename", { status: 400 });
  }
  const abs = path.join(screenshotsDir(id), file);
  try {
    const data = await fs.readFile(abs);
    return new Response(new Uint8Array(data), {
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=3600, immutable",
      },
    });
  } catch {
    return new Response("not found", { status: 404 });
  }
}
