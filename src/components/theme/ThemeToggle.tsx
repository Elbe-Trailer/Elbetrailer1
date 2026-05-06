"use client";

import { useEffect, useState } from "react";
import { THEME_STORAGE_KEY, type ThemeMode } from "./theme";

function applyTheme(theme: ThemeMode) {
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  document.body.classList.toggle("dark", isDark);
}

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleThemeChange = (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <label htmlFor="theme-select" className="text-zinc-600 dark:text-zinc-400">
        Modus:
      </label>
      <select
        id="theme-select"
        value={theme}
        onChange={(event) => handleThemeChange(event.target.value as ThemeMode)}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-zinc-800 outline-none transition hover:border-zinc-400 focus:ring-2 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:focus:ring-zinc-700"
      >
        <option value="light">Hell</option>
        <option value="dark">Dunkel</option>
      </select>
    </div>
  );
}
