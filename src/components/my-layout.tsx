"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, DragEvent } from "react";
import type { AppDefinition, AppRuntimeStatus, StatusResponse } from "@/lib/apps/types";
import { canPlace, placeBlock, readLayout, starterLayout, updateBlock } from "@/lib/layout/grid";
import type { GridLayout, LayoutBlock } from "@/lib/layout/grid";
import { useWebStatus, webStatusLabel } from "./use-web-status";

const STORAGE_KEY = "local-dev-hub:my-layout:v1";
const PRESET_SIZES = [{ width: 1, height: 1 }, { width: 3, height: 1 }, { width: 2, height: 2 }];

type Props = { apps: AppDefinition[]; initialStatuses: AppRuntimeStatus[] };

export function MyLayout({ apps, initialStatuses }: Props) {
  const webStatuses = useWebStatus();
  const [layout, setLayout] = useState<GridLayout>(() => starterLayout(apps.map((app) => app.id)));
  const [loaded, setLoaded] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [message, setMessage] = useState("ブロックをドラッグするか、アプリを選んで空きマスを押してください。");
  const [statuses, setStatuses] = useState(initialStatuses);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [failedFavicons, setFailedFavicons] = useState<string[]>([]);
  const appById = useMemo(() => new Map(apps.map((app) => [app.id, app])), [apps]);
  const statusById = useMemo(() => new Map(statuses.map((status) => [status.id, status])), [statuses]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? readLayout(JSON.parse(stored), new Set(apps.map((app) => app.id))) : null;
        if (parsed) setLayout(parsed);
      } catch { /* Use the starter layout when storage is unavailable. */ }
      setLoaded(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [apps]);

  useEffect(() => {
    if (!loaded) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout)); }
    catch { window.setTimeout(() => setMessage("このブラウザでは配置を保存できません。"), 0); }
  }, [layout, loaded]);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/apps/status", { cache: "no-store" });
      if (!response.ok) return;
      setStatuses(((await response.json()) as StatusResponse).statuses);
    } catch { /* Keep the last known state. */ }
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => void refresh(), 15_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const selectedBlock = layout.blocks.find((block) => block.appId === selectedAppId);
  const unplacedApps = apps.filter((app) => !layout.blocks.some((block) => block.appId === app.id));

  function commit(next: GridLayout | null, failure: string) {
    if (!next) { setMessage(failure); return; }
    setLayout(next);
    setMessage("配置を保存しました。");
  }

  function addAt(appId: string, column: number, row: number) {
    const existing = layout.blocks.find((block) => block.appId === appId);
    const block: LayoutBlock = { appId, column, row, width: existing?.width ?? 1, height: existing?.height ?? 1 };
    commit(existing ? updateBlock(layout, block) : placeBlock(layout, block), "その位置には置けません。空きマスを選んでください。");
  }

  function resize(width: number, height: number) {
    if (!selectedBlock) return;
    commit(updateBlock(layout, { ...selectedBlock, width, height }), "そのサイズでは他のブロックと重なります。");
  }

  function addFirstFree() {
    if (!selectedAppId || selectedBlock) return;
    for (let row = 1; row <= layout.rows; row++) {
      for (let column = 1; column <= layout.columns; column++) {
        const next = placeBlock(layout, { appId: selectedAppId, column, row, width: 1, height: 1 });
        if (next) { commit(next, "空きマスがありません。"); return; }
      }
    }
    setMessage("空きマスがありません。行を追加してください。");
  }

  function onDrop(event: DragEvent<HTMLButtonElement>, column: number, row: number) {
    event.preventDefault();
    const appId = event.dataTransfer.getData("text/plain");
    if (appById.has(appId)) { setSelectedAppId(appId); addAt(appId, column, row); }
  }

  const occupied = new Set<string>();
  for (const block of layout.blocks) {
    for (let row = block.row; row < block.row + block.height; row++) {
      for (let column = block.column; column < block.column + block.width; column++) occupied.add(`${column}:${row}`);
    }
  }

  return (
    <main className="layout-shell">
      <header className="layout-header">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>マイレイアウト</h1>
          <p>よく使うアプリを、好きな位置と大きさで並べる。</p>
        </div>
      </header>

      <div className="layout-workspace">
        <section className="layout-main" aria-label="マイレイアウトの編集">
          <div className="layout-toolbar">
            <span>{layout.columns}列 × {layout.rows}行 <small>このブラウザに自動保存{layout.columns > 4 ? " · 横にスクロールして列を見る" : ""}</small></span>
            <div className="layout-toolbar-actions">
              <button type="button" onClick={() => setLayout((current) => ({ ...current, rows: Math.min(12, current.rows + 1) }))} disabled={layout.rows >= 12}>行を追加</button>
              <button type="button" onClick={() => setLayout((current) => ({ ...current, columns: Math.min(6, current.columns + 1) }))} disabled={layout.columns >= 6}>列を追加</button>
              <button type="button" onClick={() => { setLayout(starterLayout(apps.map((app) => app.id))); setSelectedAppId(null); }}>初期配置に戻す</button>
            </div>
          </div>
          <div className="layout-grid" style={{ "--layout-columns": layout.columns, "--layout-rows": layout.rows } as CSSProperties}>
            {Array.from({ length: layout.rows * layout.columns }, (_, index) => {
              const column = index % layout.columns + 1;
              const row = Math.floor(index / layout.columns) + 1;
              if (occupied.has(`${column}:${row}`)) return null;
              const canDropSelected = selectedAppId ? canPlace(layout, { appId: selectedAppId, column, row, width: selectedBlock?.width ?? 1, height: selectedBlock?.height ?? 1 }, selectedBlock?.appId) : false;
              return <button key={`${column}:${row}`} className="layout-cell" style={{ gridColumn: column, gridRow: row }} type="button" aria-label={`${column}列 ${row}行の空きマス`} data-can-place={canDropSelected} onClick={() => selectedAppId ? addAt(selectedAppId, column, row) : setMessage("右の一覧からアプリを選んでください。") } onDragOver={(event) => event.preventDefault()} onDrop={(event) => onDrop(event, column, row)}><span>＋</span></button>;
            })}
            {[...layout.blocks].sort((a, b) => a.row - b.row || a.column - b.column).map((block) => {
              const app = appById.get(block.appId);
              if (!app) return null;
              const isOpenable = app.kind === "web" || statusById.get(app.id)?.state === "running";
              const previewUrl = app.previewUrl ?? (app.kind === "web" ? `/api/apps/preview/${app.id}?checked=${Date.parse(webStatuses.get(app.id)?.checkedAt ?? "") || 0}` : undefined);
              const isSelected = selectedAppId === app.id;
              return <article key={app.id} className="layout-block" data-size={`${block.width}x${block.height}`} data-selected={isSelected} style={{ gridColumn: `${block.column} / span ${block.width}`, gridRow: `${block.row} / span ${block.height}` }} draggable onDragStart={(event) => { event.dataTransfer.setData("text/plain", app.id); setSelectedAppId(app.id); }} onClick={() => setSelectedAppId(app.id)}>
                <div className="layout-block-top"><span className="layout-block-kind" data-unreachable={app.kind === "web" && webStatusLabel(webStatuses.get(app.id)) === "接続不可"} title={app.kind === "web" && webStatuses.get(app.id) ? `最終確認: ${new Date(webStatuses.get(app.id)!.checkedAt).toLocaleString("ja-JP")}` : undefined}>{app.kind === "web" ? webStatusLabel(webStatuses.get(app.id)) : statusById.get(app.id)?.state === "running" ? "RUNNING" : "STOPPED"}</span><span className="layout-drag-hint" aria-hidden="true">⠿</span></div>
                {block.width >= 2 && block.height >= 2 && (previewUrl && !failedImages.includes(app.id) ? <Image className="layout-block-preview" src={previewUrl} alt="" width={320} height={180} unoptimized onError={() => setFailedImages((ids) => [...ids, app.id])} /> : <div className="layout-block-preview-placeholder" aria-hidden="true"><div><span /><span /><span /></div><strong>{app.name.slice(0, 1).toUpperCase()}</strong><small>プレビュー未登録</small></div>)}
                <div className="layout-block-body">{block.width >= 3 && block.height === 1 && previewUrl && !failedImages.includes(app.id) ? <Image className="layout-block-inline-preview" src={previewUrl} alt="" width={112} height={70} unoptimized onError={() => setFailedImages((ids) => [...ids, app.id])} /> : <span className="layout-block-icon" aria-hidden="true">{app.kind === "web" && !failedFavicons.includes(app.id) ? <Image src={`/api/apps/favicon/${app.id}?v=2`} alt="" width={26} height={26} unoptimized onError={() => setFailedFavicons((ids) => [...ids, app.id])} /> : app.name.slice(0, 1).toUpperCase()}</span>}<div><h2>{app.name}</h2><p>{app.description}</p></div></div>
                <div className="layout-block-bottom"><span>{block.width}×{block.height}</span>{isOpenable ? <a href={app.url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>開く ↗</a> : <span>停止中</span>}</div>
              </article>;
            })}
          </div>
          <p className="layout-message" role="status">{message}</p>
        </section>

        <aside className="layout-sidebar" aria-label="配置するアプリとブロック設定">
          <h2>アプリを配置</h2>
          <p>選択して空きマスを押すか、そこへドラッグ。</p>
          <p className="layout-mobile-help">狭い画面ではアプリを選んで追加し、列・行の設定で位置を変えられます。</p>
          <div className="layout-app-list">
            {apps.map((app) => <button key={app.id} type="button" draggable className="layout-app-option" data-selected={selectedAppId === app.id} onDragStart={(event) => event.dataTransfer.setData("text/plain", app.id)} onClick={() => setSelectedAppId(app.id)}><span>{app.name.slice(0, 1).toUpperCase()}</span><span>{app.name}<small>{layout.blocks.some((block) => block.appId === app.id) ? "配置済み" : "未配置"}</small></span></button>)}
          </div>
          {selectedAppId && !selectedBlock && <button type="button" className="layout-add" onClick={addFirstFree}>選択したアプリを空きマスへ追加</button>}
          {selectedBlock && <div className="layout-selection">
            <h3>{appById.get(selectedBlock.appId)?.name}</h3>
            <p>ブロックの大きさ</p>
            <div className="layout-size-options">{PRESET_SIZES.map((size) => <button key={`${size.width}x${size.height}`} type="button" aria-pressed={selectedBlock.width === size.width && selectedBlock.height === size.height} onClick={() => resize(size.width, size.height)}>{size.width}×{size.height}</button>)}</div>
            <div className="layout-position"><label>幅 <select value={selectedBlock.width} onChange={(event) => resize(Number(event.target.value), selectedBlock.height)}>{Array.from({ length: layout.columns }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label><label>高さ <select value={selectedBlock.height} onChange={(event) => resize(selectedBlock.width, Number(event.target.value))}>{Array.from({ length: layout.rows }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label></div>
            <div className="layout-position"><label>列 <select value={selectedBlock.column} onChange={(event) => commit(updateBlock(layout, { ...selectedBlock, column: Number(event.target.value) }), "その位置には置けません。")}>{Array.from({ length: layout.columns }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label><label>行 <select value={selectedBlock.row} onChange={(event) => commit(updateBlock(layout, { ...selectedBlock, row: Number(event.target.value) }), "その位置には置けません。")}>{Array.from({ length: layout.rows }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label></div>
            <button type="button" className="layout-remove" onClick={() => { setLayout((current) => ({ ...current, blocks: current.blocks.filter((block) => block.appId !== selectedBlock.appId) })); setSelectedAppId(null); }}>配置から外す</button>
          </div>}
          {unplacedApps.length === 0 && <p className="layout-all-placed">すべて配置済みです。</p>}
        </aside>
      </div>
    </main>
  );
}
