"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppDefinition, AppRuntimeStatus, StatusResponse } from "@/lib/apps/types";

const REFRESH_INTERVAL_MS = 15_000;

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.1.68-.22.68-.48v-1.87c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.58 9.58 0 0 1 12 6.82c.85 0 1.71.12 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86V21c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 6v5h-5M4 18v-5h5m9.49-4A7 7 0 0 0 6.7 6.7L4 9m16 6-2.7 2.3A7 7 0 0 1 5.51 15" />
    </svg>
  );
}

function formatCheckedAt(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

type DevHubProps = {
  apps: AppDefinition[];
  initialStatuses: AppRuntimeStatus[];
};

export function DevHub({ apps, initialStatuses }: DevHubProps) {
  const [statuses, setStatuses] = useState(initialStatuses);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);

  const statusById = useMemo(
    () => new Map(statuses.map((status) => [status.id, status])),
    [statuses],
  );
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(apps.map((app) => app.category))).sort()],
    [apps],
  );
  const filteredApps = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return apps.filter(
      (app) =>
        (category === "All" || app.category === category) &&
        (query === "" || app.name.toLocaleLowerCase().includes(query)),
    );
  }, [apps, category, search]);

  const runningApps = apps.filter((app) => statusById.get(app.id)?.state === "running");
  const stoppedCount = apps.length - runningApps.length;
  const lastCheckedAt = statuses[0]?.checkedAt;

  const refreshStatuses = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshError(false);
    try {
      const response = await fetch("/api/apps/status", { cache: "no-store" });
      if (!response.ok) throw new Error("Status refresh failed");
      const data = (await response.json()) as StatusResponse;
      setStatuses(data.statuses);
    } catch {
      setRefreshError(true);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => void refreshStatuses(), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [refreshStatuses]);

  return (
    <main className="shell">
      <header className="hero">
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <p className="eyebrow">LOCAL WORKSPACE</p>
            <h1>Local Dev Hub</h1>
          </div>
        </div>
        <p className="hero-copy">いま動いているアプリを確認して、すぐに開く。</p>
      </header>

      <section className="summary" aria-label="アプリ状態の概要">
        <div className="summary-stat">
          <span className="summary-value">{apps.length}</span>
          <span className="summary-label">Apps</span>
        </div>
        <div className="summary-stat running-stat">
          <span className="summary-value">{runningApps.length}</span>
          <span className="summary-label"><i />Running</span>
        </div>
        <div className="summary-stat">
          <span className="summary-value">{stoppedCount}</span>
          <span className="summary-label"><i className="stopped-dot" />Stopped</span>
        </div>
        <div className="port-summary">
          <span className="summary-label">ACTIVE PORTS</span>
          <div className="port-list">
            {runningApps.length > 0 ? (
              runningApps.map((app) => <code key={app.id}>:{app.port}</code>)
            ) : (
              <span className="muted">None</span>
            )}
          </div>
        </div>
      </section>

      <section className="toolbar" aria-label="アプリの絞り込み">
        <label className="search-field">
          <SearchIcon />
          <span className="sr-only">アプリ名で検索</span>
          <input
            type="search"
            placeholder="Search apps..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="category-field">
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <div className="refresh-area">
          <span className={refreshError ? "refresh-time error-text" : "refresh-time"} role="status">
            {refreshError
              ? "更新に失敗しました"
              : lastCheckedAt
                ? `Updated ${formatCheckedAt(lastCheckedAt)}`
                : "Not checked"}
          </span>
          <button className="refresh-button" type="button" onClick={() => void refreshStatuses()} disabled={isRefreshing}>
            <RefreshIcon />
            {isRefreshing ? "Checking..." : "Refresh"}
          </button>
        </div>
      </section>

      <section className="app-grid">
        {filteredApps.map((app) => {
          const status = statusById.get(app.id);
          const isRunning = status?.state === "running";
          return (
            <article className="app-card" key={app.id}>
              <div className="card-accent" data-running={isRunning} />
              <div className="card-head">
                <span className="category-badge">{app.category}</span>
                <span className={isRunning ? "status-badge is-running" : "status-badge"}>
                  <i />{isRunning ? "Running" : "Stopped"}
                </span>
              </div>
              <div className="card-title-row">
                <div className="app-icon" aria-hidden="true">{app.name.slice(0, 1).toUpperCase()}</div>
                <div>
                  <h2>{app.name}</h2>
                  <p>{app.description}</p>
                </div>
              </div>
              <dl className="app-details">
                <div>
                  <dt>LOCAL URL</dt>
                  <dd>
                    {isRunning ? (
                      <a href={app.url} target="_blank" rel="noreferrer">{app.url}</a>
                    ) : (
                      app.url
                    )}
                  </dd>
                </div>
                <div>
                  <dt>PORT</dt>
                  <dd><code>:{app.port}</code></dd>
                </div>
                <div className="path-row">
                  <dt>DIRECTORY</dt>
                  <dd title={app.localPath}>{app.localPath}</dd>
                </div>
                <div className="path-row">
                  <dt>GITHUB</dt>
                  <dd title={app.repositoryUrl ?? undefined}>{app.repositoryUrl ?? "Not configured"}</dd>
                </div>
              </dl>
              <div className="card-actions">
                {isRunning ? (
                  <a className="primary-action" href={app.url} target="_blank" rel="noreferrer">
                    Open <ArrowIcon />
                  </a>
                ) : (
                  <span className="primary-action is-disabled" aria-disabled="true">Open <ArrowIcon /></span>
                )}
                {app.repositoryUrl ? (
                  <a className="secondary-action" href={app.repositoryUrl} target="_blank" rel="noreferrer">
                    <GithubIcon /> GitHub
                  </a>
                ) : (
                  <span className="secondary-action is-disabled" aria-disabled="true"><GithubIcon /> GitHub</span>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {filteredApps.length === 0 && (
        <div className="empty-state">
          <p>一致するアプリはありません。</p>
          <button type="button" onClick={() => { setSearch(""); setCategory("All"); }}>絞り込みを解除</button>
        </div>
      )}

      <footer>
        <span><i /> Status checks run locally every 15 seconds</span>
        <span>Local Dev Hub · v1</span>
      </footer>
    </main>
  );
}
