import "server-only";

import { spawn, type ChildProcess } from "node:child_process";
import { stat } from "node:fs/promises";
import type { LocalAppDefinition } from "./types";
import { checkAppStatus } from "./status-checker";

type Registry = { processes: Map<string, ChildProcess>; busy: Set<string> };
const globalRegistry = globalThis as typeof globalThis & { __localDevHubRegistry?: Registry };
const registry = globalRegistry.__localDevHubRegistry ??= { processes: new Map(), busy: new Set() };

export class ProcessActionError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export function isManaged(id: string): boolean {
  const child = registry.processes.get(id);
  return Boolean(child && child.exitCode === null && child.signalCode === null);
}

function launchCommand(app: LocalAppDefinition): string {
  const launch = app.launch!;
  const argumentsAfterScript = launch.script === "tauri" ? " -- dev" : "";
  const portArgument = launch.portArg ? ` -- ${launch.portArg} ${app.port}` : "";
  const tauriConfig = launch.tauriDevUrl
    ? ` --config '${JSON.stringify({ build: { devUrl: `http://localhost:${app.port}` } })}'`
    : "";
  return `& npm.cmd run ${launch.script}${argumentsAfterScript}${portArgument}${tauriConfig}`;
}

async function withLock<T>(id: string, operation: () => Promise<T>): Promise<T> {
  if (registry.busy.has(id)) throw new ProcessActionError("このアプリは処理中です。", 409);
  registry.busy.add(id);
  try { return await operation(); } finally { registry.busy.delete(id); }
}

export async function startApp(app: LocalAppDefinition): Promise<void> {
  await withLock(app.id, async () => {
    if (!app.launch) throw new ProcessActionError("このアプリには起動設定がありません。", 400);
    if (isManaged(app.id)) throw new ProcessActionError("Hubから既に起動しています。", 409);
    if ((await checkAppStatus(app)).state === "running") {
      throw new ProcessActionError("ポートは既に使用中です。既存プロセスはHubから停止できません。", 409);
    }
    try {
      if (!(await stat(app.localPath)).isDirectory()) throw new Error("not a directory");
    } catch {
      throw new ProcessActionError("登録されたローカルディレクトリが存在しません。", 400);
    }
    // Let each framework's dev script choose its own NODE_ENV.
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== "NODE_ENV")) as NodeJS.ProcessEnv;
    if (app.launch.portEnv) env[app.launch.portEnv] = String(app.port);
    if (app.launch.astroForeground) env.ASTRO_DEV_BACKGROUND = "0"; // Astro 7 agent detection otherwise detaches the process.
    // Structured launch settings and validated numeric ports are the only command inputs.
    const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", launchCommand(app)], {
      cwd: app.localPath,
      env,
      windowsHide: true,
      stdio: "inherit",
    });
    await new Promise<void>((resolve, reject) => {
      child.once("spawn", resolve);
      child.once("error", reject);
    }).catch(() => { throw new ProcessActionError("起動コマンドを実行できませんでした。", 500); });
    registry.processes.set(app.id, child);
    child.once("exit", () => {
      if (registry.processes.get(app.id) === child) registry.processes.delete(app.id);
    });
    await new Promise<void>((resolve, reject) => {
      const onExit = (code: number | null) => {
        clearTimeout(timer);
        reject(new ProcessActionError(`起動プロセスがすぐ終了しました（exit ${code ?? "unknown"}）。Hubのターミナルを確認してください。`, 500));
      };
      const timer = setTimeout(() => { child.off("exit", onExit); resolve(); }, 1_500);
      child.once("exit", onExit);
    });
  });
}

export async function stopApp(app: LocalAppDefinition): Promise<void> {
  await withLock(app.id, async () => {
    const child = registry.processes.get(app.id);
    if (!child || !isManaged(app.id) || !child.pid) {
      throw new ProcessActionError("Hubが起動したプロセスではないため停止できません。", 409);
    }
    if (process.platform !== "win32") throw new ProcessActionError("停止操作はWindows専用です。", 400);
    const pid = child.pid;
    await new Promise<void>((resolve, reject) => {
      const killer = spawn("taskkill.exe", ["/PID", String(pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
      killer.once("error", reject);
      killer.once("exit", (code) => code === 0 ? resolve() : reject(new Error("taskkill failed")));
    }).catch(() => { throw new ProcessActionError("停止に失敗しました。プロセスを確認してください。", 500); });
    registry.processes.delete(app.id);
  });
}
