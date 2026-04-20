import { promises as fs } from "node:fs";
import path from "node:path";
import { personaSchema, type Persona } from "@/lib/schemas";

const PERSONAS_DIR = path.join(process.cwd(), "data", "personas");

export async function loadPersonas(): Promise<Persona[]> {
  const entries = await fs.readdir(PERSONAS_DIR);
  const files = entries.filter((f) => f.endsWith(".json")).sort();
  const loaded: Persona[] = [];
  for (const f of files) {
    const raw = await fs.readFile(path.join(PERSONAS_DIR, f), "utf-8");
    loaded.push(personaSchema.parse(JSON.parse(raw)));
  }
  return loaded;
}
