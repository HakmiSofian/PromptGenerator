"use client";

import { useEffect, useState, useCallback } from "react";
import type { GenerateResult } from "@/lib/types";

export type HistoryEntry = {
  id: string;
  createdAt: number;
  mode: "create" | "improve" | "audit";
  title: string;
  request: unknown;
  result: GenerateResult;
};

const STORAGE_KEY = "prompt-kit-history-v1";
const MAX_ENTRIES = 20;

function read(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function write(entries: HistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // quota exceeded or disabled — silently ignore
  }
}

export function useKitHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEntries(read());
    setHydrated(true);
  }, []);

  const save = useCallback(
    (entry: Omit<HistoryEntry, "id" | "createdAt">): HistoryEntry => {
      const full: HistoryEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
      };
      setEntries((prev) => {
        const next = [full, ...prev].slice(0, MAX_ENTRIES);
        write(next);
        return next;
      });
      return full;
    },
    []
  );

  const remove = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      write(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    write([]);
    setEntries([]);
  }, []);

  return { entries, hydrated, save, remove, clear };
}

export function titleFromRequest(
  mode: "create" | "improve" | "audit",
  request: unknown
): string {
  if (!request || typeof request !== "object") return "Kit sans titre";
  const r = request as Record<string, unknown>;
  const raw =
    mode === "create" ? r.goal : mode === "improve" ? r.prompt : r.whatsWrong;
  if (typeof raw !== "string") return "Kit sans titre";
  const trimmed = raw.trim().replace(/\s+/g, " ");
  return trimmed.length > 60 ? trimmed.slice(0, 60) + "…" : trimmed;
}

export function formatRelativeTime(ts: number): string {
  const diffSec = Math.floor((Date.now() - ts) / 1000);
  if (diffSec < 60) return "à l'instant";
  if (diffSec < 3600) return `il y a ${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `il y a ${Math.floor(diffSec / 3600)} h`;
  const d = Math.floor(diffSec / 86400);
  if (d === 1) return "hier";
  if (d < 7) return `il y a ${d} j`;
  return new Date(ts).toLocaleDateString("fr-FR");
}
