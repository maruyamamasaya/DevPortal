import { getAppDefinitions } from "@/lib/apps/definitions";

export const runtime = "nodejs";

const TTL_MS = 6 * 60 * 60 * 1000;
const MAX_BYTES = 256 * 1024;
const cache = new Map<string, { bytes: Uint8Array; type: string; expires: number }>();

async function readIcon(url: URL): Promise<{ bytes: Uint8Array; type: string } | null> {
  try {
    const response = await fetch(url, { cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(5000) });
    const type = response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    if (!response.ok || !["image/png", "image/x-icon", "image/vnd.microsoft.icon", "image/svg+xml", "image/webp", "image/jpeg"].includes(type)) return null;
    if (Number(response.headers.get("content-length")) > MAX_BYTES) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) return null;
    return { bytes, type };
  } catch {
    return null;
  }
}

async function findIcon(pageUrl: URL): Promise<{ bytes: Uint8Array; type: string } | null> {
  try {
    const page = await fetch(pageUrl, { cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(5000) });
    if (page.ok && page.headers.get("content-type")?.includes("text/html")) {
      const html = (await page.text()).slice(0, 128_000);
      for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
        if (!/\brel\s*=\s*["']?[^"'>]*icon/i.test(tag)) continue;
        const href = tag.match(/\bhref\s*=\s*(?:["']([^"']+)["']|([^\s>]+))/i)?.[1] ?? tag.match(/\bhref\s*=\s*(?:["']([^"']+)["']|([^\s>]+))/i)?.[2];
        if (!href) continue;
        const iconUrl = new URL(href, pageUrl);
        if (iconUrl.protocol !== "https:" || iconUrl.origin !== pageUrl.origin) continue;
        const icon = await readIcon(iconUrl);
        if (icon) return icon;
      }
    }
  } catch { /* The conventional favicon remains a fallback. */ }
  return readIcon(new URL("/favicon.ico", pageUrl.origin));
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const app = getAppDefinitions().find((item) => item.id === id && item.kind === "web");
  if (!app) return new Response(null, { status: 404 });

  const cached = cache.get(id);
  if (cached && cached.expires > Date.now()) {
    return new Response(Buffer.from(cached.bytes), { headers: { "Content-Type": cached.type, "Cache-Control": "public, max-age=21600" } });
  }

  const icon = await findIcon(new URL(app.url));
  if (!icon) {
    if (cached) return new Response(Buffer.from(cached.bytes), { headers: { "Content-Type": cached.type, "Cache-Control": "public, max-age=3600" } });
    return new Response(null, { status: 404, headers: { "Cache-Control": "public, max-age=3600" } });
  }
  cache.set(id, { ...icon, expires: Date.now() + TTL_MS });
  return new Response(Buffer.from(icon.bytes), { headers: { "Content-Type": icon.type, "Cache-Control": "public, max-age=21600" } });
}
