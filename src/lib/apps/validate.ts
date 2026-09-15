import type { AppDefinition, LocalAppDefinition } from "./types";

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(
  value: unknown,
  field: string,
  index: number,
): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`apps.json[${index}].${field} must be a non-empty string.`);
  }

  return value.trim();
}

function parseUrl(value: unknown, index: number): URL {
  const rawUrl = requiredString(value, "url", index);
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`apps.json[${index}].url must be a valid URL.`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`apps.json[${index}].url must use http or https.`);
  }

  return parsed;
}

function parseLocalUrl(value: unknown, port: number, index: number): string {
  const parsed = parseUrl(value, index);

  if (!LOOPBACK_HOSTS.has(parsed.hostname)) {
    throw new Error(`apps.json[${index}].url must use localhost or a loopback IP.`);
  }

  const urlPort = parsed.port
    ? Number(parsed.port)
    : parsed.protocol === "https:"
      ? 443
      : 80;

  if (urlPort !== port) {
    throw new Error(`apps.json[${index}].url port must match port.`);
  }

  return parsed.toString().replace(/\/$/, "");
}

function parseWebUrl(value: unknown, index: number): string {
  const parsed = parseUrl(value, index);

  if (parsed.protocol !== "https:" || LOOPBACK_HOSTS.has(parsed.hostname)) {
    throw new Error(`apps.json[${index}].url must be an external https URL for a web app.`);
  }

  return parsed.toString();
}

function parseRepositoryUrl(value: unknown, index: number): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const rawUrl = requiredString(value, "repositoryUrl", index);
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`apps.json[${index}].repositoryUrl must be a valid URL.`);
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`apps.json[${index}].repositoryUrl must use http or https.`);
  }

  return parsed.toString().replace(/\/$/, "");
}

export function parseAppDefinitions(value: unknown): AppDefinition[] {
  if (!Array.isArray(value)) {
    throw new Error("apps.json must contain an array.");
  }

  const ids = new Set<string>();
  const ports = new Set<number>();

  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`apps.json[${index}] must be an object.`);
    }

    const id = requiredString(item.id, "id", index);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      throw new Error(`apps.json[${index}].id must use lowercase kebab-case.`);
    }
    if (ids.has(id)) {
      throw new Error(`apps.json contains duplicate id: ${id}.`);
    }
    ids.add(id);

    const base = {
      id,
      name: requiredString(item.name, "name", index),
      description: requiredString(item.description, "description", index),
      category: requiredString(item.category, "category", index),
      repositoryUrl: parseRepositoryUrl(item.repositoryUrl, index),
      ...(item.previewUrl === undefined ? {} : { previewUrl: parsePreviewUrl(item.previewUrl, index) }),
    };

    if (item.kind === "web") {
      if (item.port !== undefined || item.localPath !== undefined || item.launch !== undefined) {
        throw new Error(`apps.json[${index}] web apps must not have port, localPath or launch.`);
      }
      return {
        ...base,
        kind: "web",
        url: parseWebUrl(item.url, index),
      };
    }

    if (item.kind !== "local" && item.kind !== undefined) {
      throw new Error(`apps.json[${index}].kind must be local or web.`);
    }

    if (!Number.isInteger(item.port) || Number(item.port) < 1 || Number(item.port) > 65535) {
      throw new Error(`apps.json[${index}].port must be an integer from 1 to 65535.`);
    }
    const port = Number(item.port);
    if (ports.has(port)) {
      throw new Error(`apps.json contains duplicate local port: ${port}.`);
    }
    ports.add(port);

    let launch: LocalAppDefinition["launch"];
    if (item.launch !== undefined) {
      if (!isRecord(item.launch)) {
        throw new Error(`apps.json[${index}].launch must be an object.`);
      }
      const script = item.launch.script;
      if (script !== "dev" && script !== "edit" && script !== "tauri") {
        throw new Error(`apps.json[${index}].launch.script must be dev, edit or tauri.`);
      }
      const portEnv = item.launch.portEnv;
      if (portEnv !== undefined && (typeof portEnv !== "string" || !/^[A-Z][A-Z0-9_]*$/.test(portEnv))) {
        throw new Error(`apps.json[${index}].launch.portEnv must be an uppercase environment variable name.`);
      }
      const portArg = item.launch.portArg;
      if (portArg !== undefined && portArg !== "-p" && portArg !== "--port") {
        throw new Error(`apps.json[${index}].launch.portArg must be -p or --port.`);
      }
      if (portArg !== undefined && portEnv !== undefined) {
        throw new Error(`apps.json[${index}].launch cannot use both portArg and portEnv.`);
      }
      const tauriDevUrl = item.launch.tauriDevUrl;
      if (tauriDevUrl !== undefined && typeof tauriDevUrl !== "boolean") {
        throw new Error(`apps.json[${index}].launch.tauriDevUrl must be boolean.`);
      }
      if (tauriDevUrl && (script !== "tauri" || !portEnv)) {
        throw new Error(`apps.json[${index}].launch.tauriDevUrl requires tauri and portEnv.`);
      }
      const astroForeground = item.launch.astroForeground;
      if (astroForeground !== undefined && typeof astroForeground !== "boolean") {
        throw new Error(`apps.json[${index}].launch.astroForeground must be boolean.`);
      }
      if (astroForeground && script !== "dev") {
        throw new Error(`apps.json[${index}].launch.astroForeground requires dev.`);
      }
      const desktopExecutable = item.launch.desktopExecutable;
      if (desktopExecutable !== undefined && (script !== "tauri" || typeof desktopExecutable !== "string" || !/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\.exe$/.test(desktopExecutable))) {
        throw new Error(`apps.json[${index}].launch.desktopExecutable must be a relative Tauri exe path.`);
      }
      launch = { script, ...(portEnv ? { portEnv } : {}), ...(portArg ? { portArg } : {}), ...(tauriDevUrl ? { tauriDevUrl } : {}), ...(astroForeground ? { astroForeground } : {}), ...(desktopExecutable ? { desktopExecutable } : {}) };
    }

    return {
      ...base,
      kind: "local",
      url: parseLocalUrl(item.url, port, index),
      port,
      localPath: requiredString(item.localPath, "localPath", index),
      ...(launch ? { launch } : {}),
    };
  });
}

function parsePreviewUrl(value: unknown, index: number): string {
  const path = requiredString(value, "previewUrl", index);
  if (!/^\/previews\/[a-z0-9][a-z0-9-]*\.(?:png|webp|jpg)$/.test(path)) {
    throw new Error(`apps.json[${index}].previewUrl must be an image path under /previews/.`);
  }
  return path;
}
