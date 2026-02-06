import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
  theme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "eusotrip-theme-mode";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") return getSystemTheme();
  return mode;
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  if (resolved === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
  } else {
    root.classList.add("light");
    root.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "system") return stored;
    } catch {}
    return "dark";
  });

  const [theme, setTheme] = useState<ResolvedTheme>(() => resolveTheme(mode));

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    try { localStorage.setItem(STORAGE_KEY, newMode); } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(theme === "dark" ? "light" : "dark");
  }, [theme, setMode]);

  // Resolve and apply whenever mode changes
  useEffect(() => {
    const resolved = resolveTheme(mode);
    setTheme(resolved);
    applyTheme(resolved);
  }, [mode]);

  // Listen for system preference changes when in system mode
  useEffect(() => {
    if (mode !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? "dark" : "light";
      setTheme(resolved);
      applyTheme(resolved);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [mode]);

  // Apply on mount
  useEffect(() => {
    applyTheme(resolveTheme(mode));
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, theme, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
