"use client";

import { useEffect, useState } from "react";

const storageKey = "local-dev-hub-theme";
type Theme = "system" | "light" | "dark";
const choices: { value: Theme; label: string; description: string }[] = [
  { value: "system", label: "システム", description: "OSの設定に合わせる" },
  { value: "light", label: "ライト", description: "明るい画面で表示" },
  { value: "dark", label: "ダーク", description: "暗い画面で表示" },
];

export function ThemeSettings() {
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const value = window.localStorage.getItem(storageKey);
      setTheme(value === "light" || value === "dark" ? value : "system");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function change(value: Theme) {
    setTheme(value);
    if (value === "system") window.localStorage.removeItem(storageKey);
    else window.localStorage.setItem(storageKey, value);
    if (value === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", value);
  }

  return <fieldset className="settings-card settings-theme-options"><legend className="sr-only">テーマを選択</legend>{choices.map((choice) =>
    <label key={choice.value} className="settings-theme-option"><span><strong>{choice.label}</strong><small>{choice.description}</small></span><input type="radio" name="theme" value={choice.value} checked={theme === choice.value} onChange={() => change(choice.value)} /></label>
  )}</fieldset>;
}
