import { describe, expect, it } from "vitest";
import { placeBlock, readLayout, starterLayout, updateBlock } from "./grid";

describe("layout grid", () => {
  it("places differently sized blocks without overlap", () => {
    const layout = starterLayout(["a", "b", "c", "d"]);
    expect(placeBlock(layout, { appId: "e", column: 1, row: 4, width: 3, height: 1 })).not.toBeNull();
    expect(placeBlock(layout, { appId: "e", column: 2, row: 2, width: 1, height: 1 })).toBeNull();
    expect(updateBlock(layout, { appId: "a", column: 2, row: 1, width: 3, height: 1 })).toBeNull();
  });

  it("restores only valid saved blocks", () => {
    const saved = { columns: 4, rows: 4, blocks: [
      { appId: "a", column: 1, row: 1, width: 2, height: 2 },
      { appId: "b", column: 2, row: 1, width: 1, height: 1 },
      { appId: "removed", column: 4, row: 4, width: 1, height: 1 },
      { appId: "c", column: 4, row: 4, width: -1, height: 1 },
    ] };
    expect(readLayout(saved, new Set(["a", "b", "c"]))?.blocks.map((item) => item.appId)).toEqual(["a"]);
  });

  it("migrates an older saved preset size", () => {
    const saved = { columns: 4, rows: 4, blocks: [{ appId: "a", column: 1, row: 1, size: "3x1" }] };
    expect(readLayout(saved, new Set(["a"]))?.blocks[0]).toMatchObject({ width: 3, height: 1 });
  });
});
