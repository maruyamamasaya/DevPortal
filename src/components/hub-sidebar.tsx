"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "アプリ一覧", icon: "▦" },
  { href: "/my-layout", label: "マイレイアウト", icon: "▥" },
  { href: "/icons", label: "アイコン表示", icon: "◫" },
];

export function HubSidebar() {
  const pathname = usePathname();
  return <aside className="hub-sidebar" aria-label="表示メニュー">
    <Link className="hub-sidebar-brand" href="/"><span className="hub-sidebar-mark">◎</span><span>Local Dev Hub<small>YOUR LOCAL WORKSPACE</small></span></Link>
    <nav aria-label="表示を切り替える">{links.map((link) => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}><span aria-hidden="true">{link.icon}</span>{link.label}</Link>)}</nav>
    <p>表示を切り替えても、登録済みアプリは同じです。</p>
  </aside>;
}
