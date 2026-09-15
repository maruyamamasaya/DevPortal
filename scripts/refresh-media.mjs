import { execFile } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = process.cwd();
const mediaRoot = join(root, ".cache", "media");
const definitions = JSON.parse(await readFile(join(root, "config", "apps.json"), "utf8"));
const apps = definitions.filter((app) => app.kind === "web");
const localApps = definitions.filter((app) => app.kind === "local" && !app.previewUrl && app.launch?.script !== "tauri");
const imageTypes = new Set(["image/png", "image/x-icon", "image/vnd.microsoft.icon", "image/svg+xml", "image/webp", "image/jpeg", "image/gif", "image/avif"]);

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:["']([^"']+)["']|([^\\s>]+))`, "i"));
  return match?.[1] ?? match?.[2] ?? null;
}

async function fetchSameOrigin(url) {
  let current = url;
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(current, { redirect: "manual", signal: AbortSignal.timeout(10_000) });
    if (![301, 302, 303, 307, 308].includes(response.status)) return { response, url: current };
    const location = response.headers.get("location");
    if (!location) return null;
    const next = new URL(location, current);
    if (next.protocol !== "https:" || next.origin !== url.origin) return null;
    current = next;
  }
  return null;
}

async function readIcon(url) {
  try {
    const result = await fetchSameOrigin(url);
    if (!result) return null;
    const { response } = result;
    const type = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
    if (!response.ok || !imageTypes.has(type)) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    return bytes.length > 0 && bytes.length <= 1_500_000 ? { bytes, type } : null;
  } catch { return null; }
}

async function findIcon(pageUrl) {
  try {
    const result = await fetchSameOrigin(pageUrl);
    if (!result) return null;
    const { response, url: effectiveUrl } = result;
    if (response.ok) {
      const html = (await response.text()).slice(0, 128_000);
      for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
        const rel = attribute(tag, "rel")?.toLowerCase().split(/\s+/) ?? [];
        if (!rel.includes("icon") && !rel.includes("apple-touch-icon")) continue;
        const href = attribute(tag, "href");
        if (!href) continue;
        const url = new URL(href, effectiveUrl);
        if (url.protocol !== "https:" || url.origin !== pageUrl.origin) continue;
        const icon = await readIcon(url);
        if (icon) return icon;
      }
    }
  } catch { /* Try the default location. */ }
  return readIcon(new URL("/favicon.ico", pageUrl.origin));
}

async function browserPath() {
  const paths = [process.env.DEV_HUB_CHROME_PATH, "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].filter(Boolean);
  for (const path of paths) { try { await access(path); return path; } catch { /* Continue. */ } }
  return null;
}

const chrome = await browserPath();
await mkdir(join(mediaRoot, "icons"), { recursive: true });
await mkdir(join(mediaRoot, "previews"), { recursive: true });
const observations = [];

for (const app of apps) {
  const url = new URL(app.url);
  let reachable = false;
  try {
    const result = await fetchSameOrigin(url);
    reachable = Boolean(result && (result.response.status < 500));
  } catch { /* The site could not be reached. */ }
  const checkedAt = new Date().toISOString();
  observations.push({ id: app.id, reachable, checkedAt });
  if (!reachable) { process.stdout.write(`${app.id}: unreachable; keeping cached images\n`); continue; }

  let iconIsFresh = false;
  try {
    const metadata = JSON.parse(await readFile(join(mediaRoot, "icons", `${app.id}.json`), "utf8"));
    await access(join(mediaRoot, "icons", `${app.id}.bin`));
    iconIsFresh = metadata.sourceUrl === url.toString() && Date.now() - metadata.updatedAt < 6 * 60 * 60 * 1000;
  } catch { /* No valid cached icon. */ }
  const icon = iconIsFresh ? null : await findIcon(url);
  if (icon) {
    await writeFile(join(mediaRoot, "icons", `${app.id}.bin`), icon.bytes);
    await writeFile(join(mediaRoot, "icons", `${app.id}.json`), JSON.stringify({ type: icon.type, sourceUrl: url.toString(), updatedAt: Date.now() }));
    process.stdout.write(`${app.id}: icon ${icon.type}\n`);
  } else if (!iconIsFresh) process.stdout.write(`${app.id}: favicon not provided by site\n`);

  if (!chrome) { process.stdout.write(`${app.id}: browser unavailable\n`); continue; }
  const profile = await mkdtemp(join(tmpdir(), "dev-hub-media-"));
  const output = join(mediaRoot, "previews", `${app.id}.png`);
  const temporary = join(mediaRoot, "previews", `${app.id}-${Date.now()}.png`);
  try {
    await run(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--user-data-dir=${profile}`, "--window-size=1280,720", "--virtual-time-budget=6000", `--screenshot=${temporary}`, url.toString()], { windowsHide: true, timeout: 25_000, maxBuffer: 1024 * 1024 });
    const info = await stat(temporary);
    if (info.size === 0 || info.size > 4 * 1024 * 1024) throw new Error("Invalid screenshot size");
    await rename(temporary, output);
    process.stdout.write(`${app.id}: preview ${info.size} bytes\n`);
  } catch (error) { process.stdout.write(`${app.id}: preview failed (${error.message})\n`); }
  finally { await rm(temporary, { force: true }).catch(() => undefined); await rm(profile, { recursive: true, force: true }).catch(() => undefined); }
}
const statusPath = join(mediaRoot, "web-status.json");
const temporaryStatusPath = join(mediaRoot, `web-status-${process.pid}.json`);
await writeFile(temporaryStatusPath, JSON.stringify(observations));
await rename(temporaryStatusPath, statusPath);

for (const app of localApps) {
  let reachable = false;
  try {
    const response = await fetch(app.url, { signal: AbortSignal.timeout(5_000) });
    reachable = response.status < 500;
  } catch { /* Only capture a responsive local page. */ }
  if (!reachable) { process.stdout.write(`${app.id}: local page unavailable; keeping cached preview\n`); continue; }
  if (!chrome) { process.stdout.write(`${app.id}: browser unavailable\n`); continue; }
  const profile = await mkdtemp(join(tmpdir(), "dev-hub-local-media-"));
  const temporary = join(mediaRoot, "previews", `${app.id}-${process.pid}-${Date.now()}.png`);
  try {
    const captureUrl = app.id === "local-dev-hub" ? `${app.url.replace(/\/$/, "")}/?capture=1` : app.url;
    await run(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--user-data-dir=${profile}`, "--window-size=1280,720", "--virtual-time-budget=6000", `--screenshot=${temporary}`, captureUrl], { windowsHide: true, timeout: 25_000, maxBuffer: 1024 * 1024 });
    const info = await stat(temporary);
    if (info.size === 0 || info.size > 4 * 1024 * 1024) throw new Error("Invalid screenshot size");
    await rename(temporary, join(mediaRoot, "previews", `${app.id}.png`));
    process.stdout.write(`${app.id}: local preview ${info.size} bytes\n`);
  } catch (error) { process.stdout.write(`${app.id}: local preview failed (${error.message})\n`); }
  finally { await rm(temporary, { force: true }).catch(() => undefined); await rm(profile, { recursive: true, force: true }).catch(() => undefined); }
}
