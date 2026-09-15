"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { bookmarkFoldersStorageKey, bookmarkStorageKey, defaultFolderId, readBookmarkFolders, readBookmarks, saveBookmarks, type Bookmark, type BookmarkFolder } from "@/lib/bookmarks";

export function BookmarkItemSettings() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [folderId, setFolderId] = useState(defaultFolderId);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const target = new URLSearchParams(window.location.search).get("url") || "";
      const items = readBookmarks(window.localStorage.getItem(bookmarkStorageKey));
      const item = items.find((candidate) => candidate.url === target);
      setBookmarks(items);
      setFolders(readBookmarkFolders(window.localStorage.getItem(bookmarkFoldersStorageKey)));
      setUrl(target);
      if (item) { setTitle(item.title); setFolderId(item.folderId); }
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const item = bookmarks.find((candidate) => candidate.url === url);
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item || !title.trim()) return;
    saveBookmarks(bookmarks.map((candidate) => candidate.url === url ? { ...candidate, title: title.trim(), folderId } : candidate));
    router.push("/settings/bookmarks");
  }
  function remove() {
    if (!item) return;
    saveBookmarks(bookmarks.filter((candidate) => candidate.url !== url));
    router.push("/settings/bookmarks");
  }

  if (!loaded) return <div className="settings-card"><p className="settings-empty">読み込み中…</p></div>;
  if (!item) return <div className="settings-card"><p className="settings-empty">このブックマークは見つかりません。</p></div>;
  return <section className="settings-card">
    <p className="settings-item-url"><a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a></p>
    <form className="settings-item-form" onSubmit={save}>
      <label>タイトル<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} required /></label>
      <label>フォルダー<select value={folders.some((folder) => folder.id === folderId) ? folderId : defaultFolderId} onChange={(event) => setFolderId(event.target.value)}>{folders.map((folder) => <option value={folder.id} key={folder.id}>{folder.name}</option>)}</select></label>
      <div className="settings-item-actions"><button type="submit">保存</button><button type="button" onClick={remove}>削除</button></div>
    </form>
  </section>;
}
