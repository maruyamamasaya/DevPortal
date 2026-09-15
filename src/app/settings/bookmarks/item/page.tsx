import type { Metadata } from "next";
import Link from "next/link";
import { BookmarkItemSettings } from "@/components/bookmark-item-settings";

export const metadata: Metadata = { title: "ブックマークの編集 | Local Dev Hub" };

export default function BookmarkItemPage() {
  return <main className="settings-shell">
    <header className="settings-header"><Link className="settings-back" href="/settings/bookmarks">‹ ブックマーク</Link><h1>ブックマークの編集</h1></header>
    <BookmarkItemSettings />
  </main>;
}
