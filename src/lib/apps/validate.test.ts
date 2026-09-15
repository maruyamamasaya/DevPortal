import { describe, expect, it } from "vitest";
import { parseAppDefinitions } from "./validate";

const validApp = {
  id: "sample-app",
  kind: "local",
  name: "Sample App",
  description: "A local application",
  category: "Utilities",
  url: "http://127.0.0.1:4321",
  port: 4321,
  localPath: "C:\\Development\\sample-app",
  repositoryUrl: "https://github.com/example/sample-app",
};

describe("parseAppDefinitions", () => {
  it("parses a valid local app definition", () => {
    expect(parseAppDefinitions([validApp])).toEqual([validApp]);
  });

  it("accepts an app without a repository URL", () => {
    const result = parseAppDefinitions([{ ...validApp, repositoryUrl: null }]);
    expect(result[0]?.repositoryUrl).toBeNull();
  });

  it("accepts a local preview image and rejects an external image URL", () => {
    expect(parseAppDefinitions([{ ...validApp, previewUrl: "/previews/sample-app.png" }])[0]?.previewUrl).toBe("/previews/sample-app.png");
    expect(() => parseAppDefinitions([{ ...validApp, previewUrl: "https://example.com/image.png" }])).toThrow("under /previews/");
  });

  it("rejects a non-loopback app URL", () => {
    expect(() => parseAppDefinitions([{ ...validApp, url: "http://192.168.1.5:4321" }])).toThrow(
      "must use localhost or a loopback IP",
    );
  });

  it("rejects duplicate ids", () => {
    expect(() => parseAppDefinitions([validApp, validApp])).toThrow("duplicate id");
  });

  it("rejects duplicate local ports", () => {
    expect(() => parseAppDefinitions([validApp, { ...validApp, id: "another-app" }])).toThrow("duplicate local port");
  });

  it("accepts a structured launch setting", () => {
    const app = { ...validApp, launch: { script: "dev", portEnv: "PORT" } };
    expect(parseAppDefinitions([app])[0]).toEqual(app);
  });

  it("rejects conflicting port inputs", () => {
    const app = { ...validApp, launch: { script: "dev", portEnv: "PORT", portArg: "--port" } };
    expect(() => parseAppDefinitions([app])).toThrow("cannot use both portArg and portEnv");
  });

  it("rejects a URL and port mismatch", () => {
    expect(() => parseAppDefinitions([{ ...validApp, port: 5000 }])).toThrow("url port must match port");
  });

  it("accepts an external web app without local port and path", () => {
    const webApp = {
      id: "study-note",
      kind: "web",
      name: "study note",
      description: "Study notes",
      category: "Main Apps",
      url: "https://maruyamamasaya.github.io/study/#/",
      repositoryUrl: null,
    };
    expect(parseAppDefinitions([webApp])).toEqual([webApp]);
  });

  it("rejects a loopback URL for a web app", () => {
    expect(() => parseAppDefinitions([{ ...validApp, kind: "web", port: undefined, localPath: undefined }])).toThrow(
      "external https URL",
    );
  });

  it("rejects a port on a web app", () => {
    expect(() => parseAppDefinitions([{ ...validApp, kind: "web", url: "https://example.com" }])).toThrow(
      "must not have port, localPath or launch",
    );
  });
});
