export type Bookmark = { url: string; title: string; folderId: string };
export type BookmarkFolder = { id: string; name: string };
export const defaultFolderId = "uncategorized";
export const defaultFolder: BookmarkFolder = { id: defaultFolderId, name: "未分類" };
export const bookmarkStorageKey = "local-dev-hub-bookmarks";
export const bookmarkFoldersStorageKey = "local-dev-hub-bookmark-folders";
export const bookmarkChangeEvent = "local-dev-hub-bookmarks-changed";

export function saveBookmarks(bookmarks: Bookmark[]) {
  window.localStorage.setItem(bookmarkStorageKey, JSON.stringify(bookmarks));
  window.dispatchEvent(new Event(bookmarkChangeEvent));
}

export function saveBookmarkFolders(folders: BookmarkFolder[]) {
  window.localStorage.setItem(bookmarkFoldersStorageKey, JSON.stringify(folders));
  window.dispatchEvent(new Event(bookmarkChangeEvent));
}

export function readBookmarkFolders(value: string | null): BookmarkFolder[] {
  if (!value) return [defaultFolder];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [defaultFolder];
    const seen = new Set([defaultFolderId]);
    const folders = parsed.filter((item): item is BookmarkFolder => {
      if (typeof item !== "object" || item === null || typeof item.id !== "string" ||
        typeof item.name !== "string" || !item.name.trim() || item.name.length > 100 ||
        !/^[a-z0-9-]+$/.test(item.id) || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    return [defaultFolder, ...folders];
  } catch { return [defaultFolder]; }
}

export function parseBookmarkUrl(input: string): URL | null {
  try {
    const url = new URL(input.trim());
    if ((url.protocol !== "http:" && url.protocol !== "https:") || !url.hostname || url.username || url.password) return null;
    return url;
  } catch { return null; }
}

export function readBookmarks(value: string | null): Bookmark[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is Bookmark =>
      typeof item === "object" && item !== null && typeof item.url === "string" &&
      parseBookmarkUrl(item.url) !== null && typeof item.title === "string" &&
      item.title.trim().length > 0 && item.title.length <= 100 &&
      (item.folderId === undefined || (typeof item.folderId === "string" && /^[a-z0-9-]+$/.test(item.folderId))))
      .map((item) => ({ ...item, folderId: item.folderId || defaultFolderId }));
  } catch { return []; }
}
