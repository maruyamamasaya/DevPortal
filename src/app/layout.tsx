import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { HubSidebar } from "@/components/hub-sidebar";

export const metadata: Metadata = {
  title: "Local Dev Hub",
  description: "ローカル開発アプリの状態確認と入口をまとめるホーム画面",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ja">
      <body><div className="hub-frame"><HubSidebar /><div className="hub-frame-content">{children}</div></div></body>
    </html>
  );
}
