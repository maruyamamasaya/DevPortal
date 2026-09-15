import { describe, expect, it } from "vitest";
import { parseWidgets } from "./widgets";
import type { AppDefinition } from "@/lib/apps/types";

const apps = [{ id: "tool", kind: "local", url: "http://127.0.0.1:4000", port: 4000 }] as AppDefinition[];
describe("widget registration", () => {
  it("binds a local path to the registered app's origin", () => {
    expect(parseWidgets([{ id: "summary", appId: "tool", name: "Summary", path: "/widgets/summary" }], apps)[0].url).toBe("http://127.0.0.1:4000/widgets/summary");
  });
  it("rejects unknown apps and paths that can leave the registered origin", () => {
    expect(() => parseWidgets([{ id: "summary", appId: "missing", name: "Summary", path: "/widgets/summary" }], apps)).toThrow();
    for (const path of ["https://example.com", "//example.com", "/../admin", "/widgets/%2f%2fexample.com"]) {
      expect(() => parseWidgets([{ id: "summary", appId: "tool", name: "Summary", path }], apps)).toThrow();
    }
  });
});
