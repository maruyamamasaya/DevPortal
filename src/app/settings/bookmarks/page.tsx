import type { Metadata } from "next";
import Link from "next/link";
import { BookmarkSettings } from "@/components/bookmark-settings";

export const metadata: Metadata = { title: "ブックマーク | Local Dev Hub" };

export default function BookmarksPage() {
  return <main className="settings-shell">
    <header className="settings-header"><Link className="settings-back" href="/settings">‹ 設定</Link><h1>ブックマーク</h1><p>追加とフォルダー管理を行い、編集するブックマークを選びます。</p></header>
    <BookmarkSettings />
  </main>;
}
