import "server-only";

import { access, mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";

export const MEDIA_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_ROOT = join(process.cwd(), ".cache", "media");

export type CachedIcon = { bytes: Buffer; type: string; sourceUrl: string; updatedAt: number };
export type CachedPreview = { bytes: Buffer; updatedAt: number };

export async function readCachedIcon(id: string, sourceUrl: string): Promise<CachedIcon | null> {
  try {
    const directory = join(CACHE_ROOT, "icons");
    const meta = JSON.parse(await readFile(join(directory, `${id}.json`), "utf8")) as { type: string; sourceUrl: string; updatedAt: number };
    if (meta.sourceUrl !== sourceUrl || !["image/png", "image/x-icon", "image/vnd.microsoft.icon", "image/svg+xml", "image/webp", "image/jpeg", "image/gif", "image/avif"].includes(meta.type)) return null;
    const bytes = await readFile(join(directory, `${id}.bin`));
    if (bytes.length === 0 || bytes.length > 1_500_000) return null;
    return { bytes, ...meta };
  } catch { return null; }
}

export async function writeCachedIcon(id: string, icon: CachedIcon): Promise<void> {
  const directory = join(CACHE_ROOT, "icons");
  await mkdir(directory, { recursive: true });
  const unique = `${id}-${process.pid}-${Date.now()}`;
  const binaryTemp = join(directory, `${unique}.bin`);
  const metaTemp = join(directory, `${unique}.json`);
  await writeFile(binaryTemp, icon.bytes);
  await writeFile(metaTemp, JSON.stringify({ type: icon.type, sourceUrl: icon.sourceUrl, updatedAt: icon.updatedAt }));
  await rename(binaryTemp, join(directory, `${id}.bin`));
  await rename(metaTemp, join(directory, `${id}.json`));
}

export function previewPath(id: string): string { return join(CACHE_ROOT, "previews", `${id}.png`); }

export async function readCachedPreview(id: string): Promise<CachedPreview | null> {
  try {
    const path = previewPath(id);
    const info = await stat(path);
    if (info.size === 0 || info.size > 4 * 1024 * 1024) return null;
    return { bytes: await readFile(path), updatedAt: info.mtimeMs };
  } catch { return null; }
}

export async function ensurePreviewDirectory(): Promise<void> {
  await mkdir(join(CACHE_ROOT, "previews"), { recursive: true });
}

export async function chromeExecutable(): Promise<string | null> {
  const candidates = [process.env.DEV_HUB_CHROME_PATH, "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].filter((path): path is string => Boolean(path));
  for (const path of candidates) {
    try { await access(path, constants.X_OK); return path; } catch { /* Try the next browser. */ }
  }
  return null;
}
