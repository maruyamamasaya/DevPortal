"use client";

import { useEffect, useState } from "react";

export type WebStatus = { id: string; reachable: boolean; checkedAt: string };

export function webStatusLabel(status: WebStatus | undefined) {
  if (!status || Date.now() - Date.parse(status.checkedAt) > 75 * 60 * 1000) return "未確認";
  return status.reachable ? "接続中" : "接続不可";
}

export function useWebStatus() {
  const [statuses, setStatuses] = useState<WebStatus[]>([]);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/apps/web-status", { cache: "no-store" });
        if (response.ok && active) setStatuses((await response.json()) as WebStatus[]);
      } catch { /* Keep the last observation. */ }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  return new Map(statuses.map((status) => [status.id, status]));
}
