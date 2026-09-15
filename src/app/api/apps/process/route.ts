import { getAppDefinitions } from "@/lib/apps/definitions";
import { ProcessActionError, openDesktopApp, startApp, stopApp } from "@/lib/apps/process-manager";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const host = request.headers.get("host");
  const origin = request.headers.get("origin");
  const validLoopbackHost = host && /^(127\.0\.0\.1|localhost):[1-9][0-9]{0,4}$/.test(host);
  if (!validLoopbackHost || origin !== `http://${host}`) {
    return Response.json({ error: "Invalid origin." }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return Response.json({ error: "JSON is required." }, { status: 415 });
  }
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const { id, action } = body as Record<string, unknown>;
  if (typeof id !== "string" || (action !== "start" && action !== "stop" && action !== "open-desktop")) {
    return Response.json({ error: "Invalid id or action." }, { status: 400 });
  }
  const app = getAppDefinitions().find((item) => item.id === id);
  if (!app || app.kind !== "local") return Response.json({ error: "Local app not found." }, { status: 404 });
  try {
    if (action === "start") await startApp(app);
    else if (action === "stop") await stopApp(app);
    else await openDesktopApp(app);
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ProcessActionError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Process action failed." }, { status: 500 });
  }
}
