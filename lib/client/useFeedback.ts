"use client";

import { useCallback, useEffect, useState } from "react";
import type { GenerateResult } from "@/lib/types";

export type Rating = "up" | "down";

export type Feedback = {
  rating: Rating;
  note?: string;
  at: number;
};

const STORAGE_KEY = "prompt-kit-feedback-v1";

function readAll(): Record<string, Feedback> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, Feedback>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function djb2(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return hash >>> 0;
}

export function feedbackKeyOf(result: GenerateResult): string {
  let main = "";
  if (result.mode === "create") {
    main = (result.claudeMd ?? "") + "|" + (result.initialPrompt ?? "");
  } else if (result.mode === "improve") {
    main = result.improvedPrompt ?? "";
  } else {
    main = (result.newClaudeMd ?? "") + "|" + (result.recoveryPrompt ?? "");
  }
  return result.mode + ":" + djb2(main.slice(0, 4000)).toString(36);
}

export function useFeedback(key: string) {
  const [current, setCurrent] = useState<Feedback | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const all = readAll();
    setCurrent(all[key] ?? null);
    setHydrated(true);
  }, [key]);

  const set = useCallback(
    (rating: Rating, note?: string) => {
      const all = readAll();
      const entry: Feedback = { rating, note, at: Date.now() };
      all[key] = entry;
      writeAll(all);
      setCurrent(entry);
    },
    [key]
  );

  const clear = useCallback(() => {
    const all = readAll();
    delete all[key];
    writeAll(all);
    setCurrent(null);
  }, [key]);

  return { current, hydrated, set, clear };
}
