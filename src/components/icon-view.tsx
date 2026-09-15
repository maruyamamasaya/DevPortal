"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { AppDefinition, AppRuntimeStatus, StatusResponse } from "@/lib/apps/types";

type Props = { apps: AppDefinition[]; initialStatuses: AppRuntimeStatus[] };

export function IconView({ apps, initialStatuses }: Props) {
  const [statuses, setStatuses] = useState(initialStatuses);
  const [search, setSearch] = useState("");
  const [failedIcons, setFailedIcons] = useState<string[]>([]);
  const statusById = useMemo(() => new Map(statuses.map((status) => [status.id, status])), [statuses]);
  const filteredApps = apps.filter((app) => app.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));

  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch("/api/apps/status", { cache: "no-store" });
        if (response.ok) setStatuses(((await response.json()) as StatusResponse).statuses);
      } catch { /* Keep the last known status. */ }
    }, 15_000);
    return () => window.clearInterval(timer);
  }, []);

  return <main className="icons-shell">
    <header className="icons-header"><div><p className="eyebrow">QUICK ACCESS</p><h1>アイコン表示</h1><p>名前とアイコンだけで、すばやく選ぶ。</p></div><label className="icons-search"><span className="sr-only">アプリ名で検索</span><input type="search" placeholder="アプリを検索" value={search} onChange={(event) => setSearch(event.target.value)} /></label></header>
    <section className="icons-grid" aria-label="アプリのアイコン一覧">{filteredApps.map((app) => {
      const openable = app.kind === "web" || statusById.get(app.id)?.state === "running";
      const content = <><span className="icons-tile-image">{app.kind === "web" && !failedIcons.includes(app.id) ? <Image src={`/api/apps/favicon/${app.id}?v=2`} alt="" width={48} height={48} unoptimized onError={() => setFailedIcons((ids) => [...ids, app.id])} /> : <span aria-hidden="true">{app.name.slice(0, 1).toUpperCase()}</span>}</span><span className="icons-tile-title">{app.name}</span></>;
      return openable ? <a key={app.id} className="icons-tile" href={app.url} target="_blank" rel="noreferrer" title={`${app.name}を開く`}>{content}</a> : <div key={app.id} className="icons-tile is-stopped" aria-label={`${app.name}、停止中`}>{content}</div>;
    })}</section>
    {filteredApps.length === 0 && <p className="icons-empty">一致するアプリはありません。</p>}
  </main>;
}
