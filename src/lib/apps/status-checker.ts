import "server-only";

import net from "node:net";
import type { AppDefinition, AppRuntimeStatus, LocalAppDefinition } from "./types";

const CHECK_TIMEOUT_MS = 1_500;

function checkPort(host: string, port: number): Promise<number | null> {
  return new Promise((resolve) => {
    const startedAt = performance.now();
    const socket = net.createConnection({ host, port });
    let settled = false;

    const finish = (responseTimeMs: number | null) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(responseTimeMs);
    };

    socket.setTimeout(CHECK_TIMEOUT_MS);
    socket.once("connect", () => finish(Math.max(1, Math.round(performance.now() - startedAt))));
    socket.once("timeout", () => finish(null));
    socket.once("error", () => finish(null));
  });
}

export async function checkAppStatus(app: LocalAppDefinition): Promise<AppRuntimeStatus> {
  const url = new URL(app.url);
  const host = url.hostname === "[::1]" ? "::1" : url.hostname;
  const responseTimeMs = await checkPort(host, app.port);

  return {
    id: app.id,
    state: responseTimeMs === null ? "stopped" : "running",
    checkedAt: new Date().toISOString(),
    responseTimeMs: responseTimeMs ?? 0,
  };
}

export async function checkAllAppStatuses(apps: AppDefinition[]) {
  return Promise.all(apps.filter((app): app is LocalAppDefinition => app.kind === "local").map(checkAppStatus));
}
