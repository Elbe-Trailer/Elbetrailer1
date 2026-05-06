export const THEME_STORAGE_KEY = "theme";
export type ThemeMode = "light" | "dark";

export const themeInitScript = `
(() => {
  const storageKey = "${THEME_STORAGE_KEY}";
  const root = document.documentElement;
  const body = document.body;
  const savedTheme = localStorage.getItem(storageKey);
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = savedTheme === "light" || savedTheme === "dark"
    ? savedTheme
    : (systemPrefersDark ? "dark" : "light");

  const isDark = theme === "dark";
  root.classList.toggle("dark", isDark);
  body?.classList.toggle("dark", isDark);
})();
`;
