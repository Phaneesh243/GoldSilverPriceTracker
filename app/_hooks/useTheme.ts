"use client";
import { useSyncExternalStore } from "react";

export type Theme = "dark" | "light";
export function getTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}
export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem("gsp-theme", theme); } catch { /* Theme still works when storage is blocked. */ }
}
function subscribe(listener: () => void) {
  const observer = new MutationObserver(listener);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const storage = (event: StorageEvent) => {
    if (event.key === "gsp-theme" || event.key === null) document.documentElement.dataset.theme = event.newValue === "light" ? "light" : "dark";
  };
  window.addEventListener("storage", storage);
  return () => { observer.disconnect(); window.removeEventListener("storage", storage); };
}
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark" as const);
  return { theme, toggleTheme: () => setTheme(getTheme() === "dark" ? "light" : "dark") };
}
