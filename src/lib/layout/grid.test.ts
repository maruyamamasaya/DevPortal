import { describe, expect, it } from "vitest";
import { placeBlock, readLayout, starterLayout, updateBlock } from "./grid";

describe("layout grid", () => {
  it("places differently sized blocks without overlap", () => {
    const layout = starterLayout(["a", "b", "c", "d"]);
    expect(placeBlock(layout, { appId: "e", column: 1, row: 4, size: "3x1" })).not.toBeNull();
    expect(placeBlock(layout, { appId: "e", column: 2, row: 2, size: "1x1" })).toBeNull();
    expect(updateBlock(layout, { appId: "a", column: 2, row: 1, size: "3x1" })).toBeNull();
  });

  it("restores only valid saved blocks", () => {
    const saved = { columns: 4, rows: 4, blocks: [
      { appId: "a", column: 1, row: 1, size: "2x2" },
      { appId: "b", column: 2, row: 1, size: "1x1" },
      { appId: "removed", column: 4, row: 4, size: "1x1" },
      { appId: "c", column: 4, row: 4, size: "__proto__" },
    ] };
    expect(readLayout(saved, new Set(["a", "b", "c"]))?.blocks.map((item) => item.appId)).toEqual(["a"]);
  });
});
