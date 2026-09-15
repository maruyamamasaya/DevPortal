import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "設定 | Local Dev Hub" };

export default function SettingsPage() {
  return <main className="settings-shell">
    <header className="settings-header"><p className="eyebrow">LOCAL DEV HUB</p><h1>設定</h1><p>変更したい項目を選んでください。</p></header>
    <nav className="settings-menu" aria-label="設定項目">
      <Link className="settings-card settings-menu-link" href="/settings/bookmarks"><span><strong>ブックマーク</strong><small>追加、フォルダー管理、各ブックマークの編集</small></span><span aria-hidden="true">›</span></Link>
      <Link className="settings-card settings-menu-link" href="/settings/theme"><span><strong>テーマ</strong><small>画面の明るさを選択</small></span><span aria-hidden="true">›</span></Link>
    </nav>
  </main>;
}
