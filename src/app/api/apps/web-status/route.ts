import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getAppDefinitions } from "@/lib/apps/definitions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const ids = new Set(getAppDefinitions().filter((app) => app.kind === "web").map((app) => app.id));
  try {
    const entries = JSON.parse(await readFile(join(process.cwd(), ".cache", "media", "web-status.json"), "utf8")) as { id: string; reachable: boolean; checkedAt: string }[];
    return Response.json(entries.filter((entry) => ids.has(entry.id)), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json([], { headers: { "Cache-Control": "no-store" } });
  }
}
