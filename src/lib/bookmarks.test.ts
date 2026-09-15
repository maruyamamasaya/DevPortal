import { describe, expect, it } from "vitest";
import { parseBookmarkUrl, readBookmarkFolders, readBookmarks } from "./bookmarks";

describe("bookmarks", () => {
  it("accepts only navigable web URLs without credentials", () => {
    expect(parseBookmarkUrl("https://example.com/path")?.href).toBe("https://example.com/path");
    expect(parseBookmarkUrl("javascript:alert(1)")).toBeNull();
    expect(parseBookmarkUrl("https://user:pass@example.com")).toBeNull();
  });
  it("ignores invalid saved entries", () => {
    expect(readBookmarks('[{"url":"https://example.com","title":"Example"},{"url":"javascript:bad","title":"Bad"}]')).toEqual([{ url: "https://example.com", title: "Example", folderId: "uncategorized" }]);
  });
  it("retains the default folder and valid custom folders", () => {
    expect(readBookmarkFolders('[{"id":"work","name":"仕事"}]')).toEqual([{ id: "uncategorized", name: "未分類" }, { id: "work", name: "仕事" }]);
  });
});
