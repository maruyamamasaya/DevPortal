import { describe, expect, it } from "vitest";
import { parseAppDefinitions } from "./validate";

const validApp = {
  id: "sample-app",
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

  it("rejects a non-loopback app URL", () => {
    expect(() => parseAppDefinitions([{ ...validApp, url: "http://192.168.1.5:4321" }])).toThrow(
      "must use localhost or a loopback IP",
    );
  });

  it("rejects duplicate ids", () => {
    expect(() => parseAppDefinitions([validApp, validApp])).toThrow("duplicate id");
  });

  it("rejects a URL and port mismatch", () => {
    expect(() => parseAppDefinitions([{ ...validApp, port: 5000 }])).toThrow("url port must match port");
  });
});
