import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem("sj_theme");
      return stored === "light" ? "light" : "dark";
    }
    catch { return "dark"; }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
      root.style.setProperty("--bg-primary", "#f8f9ff");
      root.style.setProperty("--bg-secondary", "#eef0ff");
      root.style.setProperty("--text-primary", "#0b0521");
      root.style.setProperty("--text-secondary", "#352e64");
      root.style.setProperty("--glass-bg", "rgba(255,255,255,0.7)");
      root.style.setProperty("--glass-border", "rgba(108,61,232,0.15)");
      document.body.style.background = "#f0f0ff";
      document.body.style.color = "#0b0521";
    } else {
      root.setAttribute("data-theme", "dark");
      root.style.setProperty("--bg-primary", "#07091d");
      root.style.setProperty("--bg-secondary", "#0d1240");
      root.style.setProperty("--text-primary", "rgba(255,255,255,0.92)");
      root.style.setProperty("--text-secondary", "rgba(255,255,255,0.6)");
      root.style.setProperty("--glass-bg", "rgba(255,255,255,0.04)");
      root.style.setProperty("--glass-border", "rgba(255,255,255,0.09)");
      document.body.style.background = "#07091d";
      document.body.style.color = "white";
    }
    try { localStorage.setItem("sj_theme", theme); }
    catch {}
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");


  const themeState = { theme, toggleTheme, setTheme, isDark: theme === "dark" };

  return (
    <ThemeContext.Provider value={themeState}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext must be used within ThemeProvider");
  return ctx;
}
