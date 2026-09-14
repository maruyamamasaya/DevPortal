import type { AppDefinition } from "./types";

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

function parseLocalUrl(value: unknown, port: number, index: number): string {
  const rawUrl = requiredString(value, "url", index);
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`apps.json[${index}].url must be a valid URL.`);
  }

  if (!LOOPBACK_HOSTS.has(parsed.hostname)) {
    throw new Error(`apps.json[${index}].url must use localhost or a loopback IP.`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`apps.json[${index}].url must use http or https.`);
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

    if (!Number.isInteger(item.port) || Number(item.port) < 1 || Number(item.port) > 65535) {
      throw new Error(`apps.json[${index}].port must be an integer from 1 to 65535.`);
    }
    const port = Number(item.port);

    return {
      id,
      name: requiredString(item.name, "name", index),
      description: requiredString(item.description, "description", index),
      category: requiredString(item.category, "category", index),
      url: parseLocalUrl(item.url, port, index),
      port,
      localPath: requiredString(item.localPath, "localPath", index),
      repositoryUrl: parseRepositoryUrl(item.repositoryUrl, index),
    };
  });
}
