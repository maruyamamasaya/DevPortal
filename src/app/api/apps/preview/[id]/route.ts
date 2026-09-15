import { execFile } from "node:child_process";
import { mkdtemp, rename, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { getAppDefinitions } from "@/lib/apps/definitions";
import { checkAppStatus } from "@/lib/apps/status-checker";
import { MEDIA_TTL_MS, chromeExecutable, ensurePreviewDirectory, previewPath, readCachedPreview } from "@/lib/apps/media-cache";
import type { CachedPreview } from "@/lib/apps/media-cache";

export const runtime = "nodejs";

const run = promisify(execFile);
const inFlight = new Map<string, Promise<CachedPreview | null>>();

function responseFor(preview: CachedPreview, maxAge: number): Response {
  return new Response(new Uint8Array(preview.bytes), { headers: { "Content-Type": "image/png", "Cache-Control": `public, max-age=${maxAge}` } });
}

async function capturePreview(id: string, url: string): Promise<CachedPreview | null> {
  const existing = inFlight.get(id);
  if (existing) return existing;
  const work = (async () => {
    const chrome = await chromeExecutable();
    if (!chrome) return null;
    await ensurePreviewDirectory();
    const profile = await mkdtemp(join(tmpdir(), "dev-hub-preview-"));
    const temporary = previewPath(`${id}-${process.pid}-${Date.now()}`);
    const captureUrl = id === "local-dev-hub" ? `${url.replace(/\/$/, "")}/?capture=1` : url;
    try {
      await run(chrome, [
        "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
        `--user-data-dir=${profile}`, "--window-size=1280,720", "--virtual-time-budget=6000",
        `--screenshot=${temporary}`, captureUrl,
      ], { windowsHide: true, timeout: 25_000, maxBuffer: 1024 * 1024 });
      const info = await stat(temporary);
      if (info.size === 0 || info.size > 4 * 1024 * 1024) return null;
      await rename(temporary, previewPath(id));
      return readCachedPreview(id);
    } catch { return null; }
    finally {
      await rm(temporary, { force: true }).catch(() => undefined);
      await rm(profile, { recursive: true, force: true }).catch(() => undefined);
    }
  })();
  inFlight.set(id, work);
  try { return await work; } finally { inFlight.delete(id); }
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const app = getAppDefinitions().find((item) => item.id === id);
  if (!app) return new Response(null, { status: 404 });
  if (app.kind === "local" && app.previewUrl) return new Response(null, { status: 404 });
  const cached = await readCachedPreview(id);
  if (cached) {
    if (Date.now() - cached.updatedAt >= (app.kind === "web" ? MEDIA_TTL_MS : 30 * 60 * 1000)) {
      if (app.kind === "web") void capturePreview(id, app.url);
      else void checkAppStatus(app).then((status) => { if (status.state === "running") return capturePreview(id, app.url); });
    }
    return responseFor(cached, 60);
  }
  if (app.kind === "local" && (await checkAppStatus(app)).state !== "running") return new Response(null, { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
  const preview = await capturePreview(id, app.url);
  return preview ? responseFor(preview, 60) : new Response(null, { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
}
