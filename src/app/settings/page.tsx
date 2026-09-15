import type { Metadata } from "next";
import { BookmarkSettings } from "@/components/bookmark-settings";

export const metadata: Metadata = { title: "設定 | Local Dev Hub" };

export default function SettingsPage() {
  return <main className="settings-shell">
    <header className="settings-header"><p className="eyebrow">LOCAL DEV HUB</p><h1>設定</h1><p>このブラウザで使う設定を管理します。</p></header>
    <BookmarkSettings />
  </main>;
}
