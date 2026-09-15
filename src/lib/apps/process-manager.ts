import "server-only";

import { spawn, type ChildProcess } from "node:child_process";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";
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

export async function openDesktopApp(app: LocalAppDefinition): Promise<void> {
  await withLock(app.id, async () => {
    const relativeExecutable = app.launch?.desktopExecutable;
    if (!relativeExecutable) throw new ProcessActionError("このアプリにはデスクトップ画面の設定がありません。", 400);
    if (process.platform !== "win32") throw new ProcessActionError("デスクトップ画面の操作はWindows専用です。", 400);
    if ((await checkAppStatus(app)).state !== "running") {
      throw new ProcessActionError("先にアプリをStartしてください。", 409);
    }
    const executable = resolve(app.localPath, relativeExecutable);
    try {
      if (!(await stat(executable)).isFile()) throw new Error("not a file");
    } catch {
      throw new ProcessActionError("開発用デスクトップアプリが見つかりません。TauriをStartしてビルドしてください。", 404);
    }
    const processName = relativeExecutable.split("/").at(-1)!.slice(0, -4);
    const escapedPath = executable.replaceAll("'", "''");
    const escapedName = processName.replaceAll("'", "''");
    const script = `
Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class HubWindow { [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow); [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd); }'
$target = Get-Process -Name '${escapedName}' -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq '${escapedPath}' -and $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if ($target) { [HubWindow]::ShowWindowAsync($target.MainWindowHandle, 9) | Out-Null; [HubWindow]::SetForegroundWindow($target.MainWindowHandle) | Out-Null; 'focused' }
elseif (Get-Process -Name '${escapedName}' -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq '${escapedPath}' }) { 'process-without-window' }
else { 'missing' }
`;
    const findWindow = () => new Promise<string>((resolveOutput, reject) => {
      const helper = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(script, "utf16le").toString("base64")], { windowsHide: true });
      let output = "";
      helper.stdout.on("data", (chunk: Buffer) => { output += chunk.toString(); });
      helper.once("error", reject);
      helper.once("exit", (code) => code === 0 ? resolveOutput(output.trim()) : reject(new Error("window lookup failed")));
    }).catch(() => { throw new ProcessActionError("デスクトップ画面の確認に失敗しました。", 500); });
    const result = await findWindow();
    if (result === "focused") return;
    if (result === "process-without-window") {
      throw new ProcessActionError("Tauriプロセスは動作中ですが画面が見つかりません。Command Manager側の起動状態を確認してください。", 409);
    }
    await new Promise<void>((resolveSpawn, reject) => {
      const child = spawn(executable, [], { cwd: app.localPath, detached: true, stdio: "ignore" });
      child.once("spawn", () => { child.unref(); resolveSpawn(); });
      child.once("error", reject);
    }).catch(() => { throw new ProcessActionError("デスクトップ画面を起動できませんでした。", 500); });
    await new Promise((done) => setTimeout(done, 1_000));
    const opened = await findWindow();
    if (opened !== "focused") {
      throw new ProcessActionError("exeを起動しましたがデスクトップ画面が見つかりません。Command Manager側の起動状態を確認してください。", 500);
    }
  });
}
