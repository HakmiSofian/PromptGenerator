"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "prompt-kit-theme";

type Theme = "light" | "dark";

function readInitial(): Theme {
  if (typeof window === "undefined") return "light";
  if (document.documentElement.classList.contains("dark")) return "dark";
  return "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readInitial());
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Passer en clair" : "Passer en sombre"}
      aria-label={theme === "dark" ? "Passer en clair" : "Passer en sombre"}
      className="text-xs px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
