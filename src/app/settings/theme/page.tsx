import type { Metadata } from "next";
import Link from "next/link";
import { ThemeSettings } from "@/components/theme-settings";

export const metadata: Metadata = { title: "テーマ | Local Dev Hub" };

export default function ThemePage() {
  return <main className="settings-shell">
    <header className="settings-header"><Link className="settings-back" href="/settings">‹ 設定</Link><h1>テーマ</h1><p>このブラウザで使う表示を選びます。</p></header>
    <ThemeSettings />
  </main>;
}
