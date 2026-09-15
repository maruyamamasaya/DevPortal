import { getAppDefinitions } from "@/lib/apps/definitions";
import { MEDIA_TTL_MS, readCachedIcon, writeCachedIcon } from "@/lib/apps/media-cache";
import type { CachedIcon } from "@/lib/apps/media-cache";

export const runtime = "nodejs";

const MAX_BYTES = 1_500_000;
const IMAGE_TYPES = new Set(["image/png", "image/x-icon", "image/vnd.microsoft.icon", "image/svg+xml", "image/webp", "image/jpeg", "image/gif", "image/avif"]);
const inFlight = new Map<string, Promise<CachedIcon | null>>();

async function fetchSameOrigin(url: URL): Promise<{ response: Response; url: URL } | null> {
  let current = url;
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(current, { cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(7000) });
    if (![301, 302, 303, 307, 308].includes(response.status)) return { response, url: current };
    const location = response.headers.get("location");
    if (!location) return null;
    const next = new URL(location, current);
    if (next.protocol !== "https:" || next.origin !== url.origin) return null;
    current = next;
  }
  return null;
}

function attribute(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:["']([^"']+)["']|([^\\s>]+))`, "i"));
  return match?.[1] ?? match?.[2] ?? null;
}

async function readIcon(url: URL): Promise<{ bytes: Buffer; type: string } | null> {
  try {
    const result = await fetchSameOrigin(url);
    if (!result) return null;
    const { response } = result;
    const type = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
    if (!response.ok || !IMAGE_TYPES.has(type) || Number(response.headers.get("content-length")) > MAX_BYTES) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_BYTES) return null;
    return { bytes, type };
  } catch { return null; }
}

async function findIcon(pageUrl: URL): Promise<{ bytes: Buffer; type: string } | null> {
  try {
    const result = await fetchSameOrigin(pageUrl);
    if (!result) return null;
    const { response, url: effectiveUrl } = result;
    if (response.ok && response.headers.get("content-type")?.includes("text/html")) {
      const html = (await response.text()).slice(0, 128_000);
      for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
        const rel = attribute(tag, "rel")?.toLowerCase().split(/\s+/) ?? [];
        if (!rel.includes("icon") && !rel.includes("apple-touch-icon")) continue;
        const href = attribute(tag, "href");
        if (!href) continue;
        const iconUrl = new URL(href, effectiveUrl);
        if (iconUrl.protocol !== "https:" || iconUrl.origin !== pageUrl.origin) continue;
        const icon = await readIcon(iconUrl);
        if (icon) return icon;
      }
    }
  } catch { /* Try the conventional path. */ }
  return readIcon(new URL("/favicon.ico", pageUrl.origin));
}

function responseFor(icon: CachedIcon, maxAge: number): Response {
  return new Response(new Uint8Array(icon.bytes), { headers: { "Content-Type": icon.type, "Cache-Control": `public, max-age=${maxAge}` } });
}

async function refreshIcon(id: string, sourceUrl: string): Promise<CachedIcon | null> {
  const current = inFlight.get(id);
  if (current) return current;
  const work = (async () => {
    const icon = await findIcon(new URL(sourceUrl));
    if (!icon) return null;
    const cached: CachedIcon = { ...icon, sourceUrl, updatedAt: Date.now() };
    try { await writeCachedIcon(id, cached); } catch { /* An in-memory response still works. */ }
    return cached;
  })();
  inFlight.set(id, work);
  try { return await work; } finally { inFlight.delete(id); }
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const app = getAppDefinitions().find((item) => item.id === id && item.kind === "web");
  if (!app) return new Response(null, { status: 404 });
  const cached = await readCachedIcon(id, app.url);
  if (cached) {
    if (Date.now() - cached.updatedAt >= MEDIA_TTL_MS) void refreshIcon(id, app.url);
    return responseFor(cached, Date.now() - cached.updatedAt < MEDIA_TTL_MS ? 21_600 : 300);
  }
  const icon = await refreshIcon(id, app.url);
  return icon ? responseFor(icon, 21_600) : new Response(null, { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
}
