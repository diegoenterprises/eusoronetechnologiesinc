import React, { createContext, useContext, useEffect, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
  theme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * EusoTrip is a DARK-MODE-ONLY brand.
 * Light mode is disabled permanently. All resolved themes return "dark".
 */
function applyDark() {
  const root = document.documentElement;
  root.setAttribute("data-theme", "dark");
  root.classList.add("dark");
  root.classList.remove("light");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always dark — brand identity
  const mode: ThemeMode = "dark";
  const theme: ResolvedTheme = "dark";

  // No-op setters (kept for API compat so nothing crashes)
  const setMode = useCallback((_newMode: ThemeMode) => {}, []);
  const toggleTheme = useCallback(() => {}, []);

  // Force dark on mount + clear any stale light preference
  useEffect(() => {
    applyDark();
    try { localStorage.setItem("eusotrip-theme-mode", "dark"); } catch {}
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
