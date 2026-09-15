import type { AppDefinition } from "@/lib/apps/types";

export type WidgetDefinition = { id: string; appId: string; name: string; path: string; url: string };

export function parseWidgets(value: unknown, apps: AppDefinition[]): WidgetDefinition[] {
  if (!Array.isArray(value)) throw new Error("widgets.json must contain an array.");
  const locals = new Map(apps.filter((app) => app.kind === "local").map((app) => [app.id, app]));
  const ids = new Set<string>();
  return value.map((entry, index) => {
    const prefix = `widgets.json[${index}]`;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new Error(`${prefix} must be an object.`);
    const widget = entry as Record<string, unknown>;
    if (typeof widget.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(widget.id)) throw new Error(`${prefix}.id must be kebab-case.`);
    if (ids.has(widget.id)) throw new Error(`${prefix}.id must be unique.`);
    ids.add(widget.id);
    if (typeof widget.appId !== "string" || !locals.has(widget.appId)) throw new Error(`${prefix}.appId must identify a registered local app.`);
    if (typeof widget.name !== "string" || !widget.name.trim()) throw new Error(`${prefix}.name is required.`);
    if (typeof widget.path !== "string" || !/^\/[a-zA-Z0-9/_-]+(?:\?[a-zA-Z0-9=&_.-]+)?$/.test(widget.path) || widget.path.startsWith("//") || widget.path.includes("..")) throw new Error(`${prefix}.path must be a local absolute path without navigation segments.`);
    const app = locals.get(widget.appId)!;
    return { id: widget.id, appId: widget.appId, name: widget.name.trim(), path: widget.path, url: new URL(widget.path, `${app.url}/`).toString() };
  });
}
