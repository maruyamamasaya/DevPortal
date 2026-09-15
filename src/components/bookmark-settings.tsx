"use client";

import { useEffect, useState, type FormEvent } from "react";
import { bookmarkFoldersStorageKey, bookmarkStorageKey, defaultFolderId, parseBookmarkUrl, readBookmarkFolders, readBookmarks, saveBookmarkFolders, saveBookmarks, type Bookmark, type BookmarkFolder } from "@/lib/bookmarks";

export function BookmarkSettings() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [folderName, setFolderName] = useState("");
  const [folderId, setFolderId] = useState(defaultFolderId);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBookmarks(readBookmarks(window.localStorage.getItem(bookmarkStorageKey)));
      setFolders(readBookmarkFolders(window.localStorage.getItem(bookmarkFoldersStorageKey)));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function addBookmark(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseBookmarkUrl(url);
    if (!parsed) { setError("http:// または https:// のURLを入力してください。"); return; }
    if (bookmarks.some((item) => item.url === parsed.href)) { setError("このURLは登録済みです。"); return; }
    const next = [...bookmarks, { url: parsed.href, title: title.trim() || parsed.hostname, folderId }];
    saveBookmarks(next);
    setBookmarks(next);
    setUrl(""); setTitle(""); setError("");
  }

  function updateBookmark(target: string, newTitle: string) {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    const next = bookmarks.map((item) => item.url === target ? { ...item, title: trimmed } : item);
    saveBookmarks(next);
    setBookmarks(next);
  }

  function removeBookmark(target: string) {
    const next = bookmarks.filter((item) => item.url !== target);
    saveBookmarks(next);
    setBookmarks(next);
  }

  function addFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = folderName.trim();
    if (!name || folders.some((item) => item.name === name)) return;
    const next = [...folders.filter((item) => item.id !== defaultFolderId), { id: crypto.randomUUID(), name }];
    saveBookmarkFolders(next);
    setFolders(readBookmarkFolders(window.localStorage.getItem(bookmarkFoldersStorageKey)));
    setFolderName("");
  }

  function removeFolder(target: string) {
    if (target === defaultFolderId) return;
    const nextBookmarks = bookmarks.map((item) => item.folderId === target ? { ...item, folderId: defaultFolderId } : item);
    const nextFolders = folders.filter((item) => item.id !== target && item.id !== defaultFolderId);
    saveBookmarks(nextBookmarks);
    saveBookmarkFolders(nextFolders);
    setBookmarks(nextBookmarks);
    setFolders([folders[0], ...nextFolders]);
    if (folderId === target) setFolderId(defaultFolderId);
  }

  return <section className="settings-card" aria-labelledby="bookmark-settings-heading">
    <div className="settings-card-heading"><h2 id="bookmark-settings-heading">ブックマーク</h2><p>サイドバーにアイコンとタイトルを表示します。</p></div>
    <div className="settings-folders">
      <h3>フォルダー</h3>
      <form onSubmit={addFolder}><label className="sr-only" htmlFor="settings-folder-name">フォルダー名</label><input id="settings-folder-name" value={folderName} onChange={(event) => setFolderName(event.target.value)} placeholder="フォルダー名" maxLength={100} required /><button type="submit">フォルダーを追加</button></form>
      <div className="settings-folder-list">{folders.map((folder) => <div key={folder.id}><span>▱ {folder.name}</span>{folder.id !== defaultFolderId && <button type="button" onClick={() => removeFolder(folder.id)} aria-label={`${folder.name}を削除`}>削除</button>}</div>)}</div>
    </div>
    <form className="settings-bookmark-form" onSubmit={addBookmark}>
      <label htmlFor="settings-bookmark-url">URL<input id="settings-bookmark-url" type="url" value={url} onChange={(event) => { setUrl(event.target.value); setError(""); }} placeholder="https://example.com" required /></label>
      <label htmlFor="settings-bookmark-title">タイトル<input id="settings-bookmark-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="省略時はホスト名" maxLength={100} /></label>
      <label htmlFor="settings-bookmark-folder">フォルダー<select id="settings-bookmark-folder" value={folderId} onChange={(event) => setFolderId(event.target.value)}>{folders.map((folder) => <option value={folder.id} key={folder.id}>{folder.name}</option>)}</select></label>
      <button type="submit">追加</button>
    </form>
    {error && <p className="hub-bookmark-error" role="alert">{error}</p>}
    <div className="settings-bookmark-list">{bookmarks.length === 0 ? <p className="settings-empty">まだブックマークがありません。</p> : bookmarks.map((bookmark) =>
      <div className="settings-bookmark-item" key={bookmark.url}>
        <div><a href={bookmark.url} target="_blank" rel="noopener noreferrer">{bookmark.url}</a></div>
        <label>タイトル<input key={`${bookmark.url}:${bookmark.title}`} defaultValue={bookmark.title} maxLength={100} onBlur={(event) => updateBookmark(bookmark.url, event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} /></label>
        <label>フォルダー<select value={folders.some((folder) => folder.id === bookmark.folderId) ? bookmark.folderId : defaultFolderId} onChange={(event) => { const next = bookmarks.map((item) => item.url === bookmark.url ? { ...item, folderId: event.target.value } : item); saveBookmarks(next); setBookmarks(next); }}>{folders.map((folder) => <option value={folder.id} key={folder.id}>{folder.name}</option>)}</select></label>
        <button type="button" onClick={() => removeBookmark(bookmark.url)} aria-label={`${bookmark.title}を削除`}>削除</button>
      </div>)}</div>
  </section>;
}
