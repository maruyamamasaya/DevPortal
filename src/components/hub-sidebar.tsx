"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { bookmarkChangeEvent, bookmarkFoldersStorageKey, bookmarkStorageKey, defaultFolderId, readBookmarkFolders, readBookmarks, type Bookmark, type BookmarkFolder } from "@/lib/bookmarks";

const links = [
  { href: "/", label: "アプリ一覧", icon: "▦" },
  { href: "/my-layout", label: "マイレイアウト", icon: "▥" },
  { href: "/icons", label: "アイコン表示", icon: "◫" },
];

export function HubSidebar() {
  const pathname = usePathname();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [failedIcons, setFailedIcons] = useState<string[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [bookmarkSearch, setBookmarkSearch] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<{ url: string; status: "copied" | "failed" } | null>(null);

  useEffect(() => {
    const update = () => {
      setBookmarks(readBookmarks(window.localStorage.getItem(bookmarkStorageKey)));
      setFolders(readBookmarkFolders(window.localStorage.getItem(bookmarkFoldersStorageKey)));
    };
    const timer = window.setTimeout(update, 0);
    window.addEventListener(bookmarkChangeEvent, update);
    window.addEventListener("storage", update);
    return () => { window.clearTimeout(timer); window.removeEventListener(bookmarkChangeEvent, update); window.removeEventListener("storage", update); };
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setActiveFolderId(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const activeFolder = folders.find((folder) => folder.id === activeFolderId);
  const visibleBookmarks = activeFolder ? bookmarks.filter((item) =>
    (item.folderId === activeFolder.id || (activeFolder.id === defaultFolderId && !folders.some((folder) => folder.id === item.folderId))) &&
    `${item.title} ${item.url}`.toLocaleLowerCase().includes(bookmarkSearch.trim().toLocaleLowerCase())) : [];

  async function copyBookmarkUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopyFeedback({ url, status: "copied" });
    } catch {
      setCopyFeedback({ url, status: "failed" });
    }
  }

  return <aside className="hub-sidebar" aria-label="表示メニュー">
    <Link className="hub-sidebar-brand" href="/"><Image className="hub-sidebar-mark" src="/icon.svg" alt="" width={31} height={31} /><span>Local Dev Hub<small>YOUR LOCAL WORKSPACE</small></span></Link>
    <nav aria-label="表示を切り替える">{links.map((link) => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}><span aria-hidden="true">{link.icon}</span>{link.label}</Link>)}</nav>
    <section className="hub-bookmarks" aria-label="ブックマーク">
      <h2>ブックマーク</h2>
      <div className="hub-bookmark-list">{folders.map((folder) => <button type="button" className="hub-bookmark-folder-button" key={folder.id} aria-expanded={activeFolderId === folder.id} aria-controls="hub-bookmark-panel" onClick={() => { setActiveFolderId(activeFolderId === folder.id ? null : folder.id); setBookmarkSearch(""); setCopyFeedback(null); }}>
        <span aria-hidden="true">▱</span><span className="hub-bookmark-folder-name">{folder.name}</span><span className="hub-bookmark-folder-count">{bookmarks.filter((item) => item.folderId === folder.id || (folder.id === defaultFolderId && !folders.some((candidate) => candidate.id === item.folderId))).length}</span><span aria-hidden="true">›</span>
      </button>)}</div>
      {activeFolder && <div className="hub-bookmark-panel" id="hub-bookmark-panel" aria-label={`${activeFolder.name}のブックマーク`}>
        <div className="hub-bookmark-panel-header"><h3>{activeFolder.name}</h3><button type="button" onClick={() => setActiveFolderId(null)} aria-label="ブックマーク一覧を閉じる">×</button></div>
        <label className="sr-only" htmlFor="hub-bookmark-search">ブックマークを検索</label><input id="hub-bookmark-search" type="search" placeholder="このフォルダーを検索" value={bookmarkSearch} onChange={(event) => setBookmarkSearch(event.target.value)} />
        <div className="hub-bookmark-panel-list">{visibleBookmarks.map((bookmark) => {
        const iconUrl = new URL("/favicon.ico", bookmark.url).href;
        return <div className="hub-bookmark-row" key={bookmark.url}>
          <a href={bookmark.url} target="_blank" rel="noopener noreferrer" title={bookmark.title}>
            <span className="hub-bookmark-icon" aria-hidden="true">{failedIcons.includes(bookmark.url) ? bookmark.title.slice(0, 1).toUpperCase() : <Image src={iconUrl} loader={({ src }) => src} alt="" width={20} height={20} unoptimized onError={() => setFailedIcons((items) => [...items, bookmark.url])} />}</span>
            <span className="hub-bookmark-title">{bookmark.title}</span>
          </a>
          <button type="button" className="hub-bookmark-copy" onClick={() => void copyBookmarkUrl(bookmark.url)} aria-label={`${bookmark.title}のURLをコピー`} title="URLをコピー">{copyFeedback?.url === bookmark.url && copyFeedback.status === "copied" ? "✓" : "⧉"}</button>
        </div>;
      })}{visibleBookmarks.length === 0 && <p className="hub-bookmark-panel-empty">ブックマークがありません。</p>}</div>
        <p className="hub-bookmark-copy-feedback" role="status">{copyFeedback?.status === "copied" ? "URLをコピーしました。" : copyFeedback?.status === "failed" ? "コピーできませんでした。" : ""}</p>
      </div>}
    </section>
    <Link className="hub-settings-link" href="/settings" aria-current={pathname.startsWith("/settings") ? "page" : undefined} aria-label="設定を開く" title="設定"><span aria-hidden="true">⚙</span>設定</Link>
  </aside>;
}
