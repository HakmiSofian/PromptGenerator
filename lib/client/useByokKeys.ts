"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserApiKeys } from "@/lib/types";

const STORAGE_KEY = "prompt-kit-byok-v1";

const EMPTY: UserApiKeys = {};

function read(): UserApiKeys {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return EMPTY;
    return {
      anthropic: typeof parsed.anthropic === "string" ? parsed.anthropic : undefined,
      openai: typeof parsed.openai === "string" ? parsed.openai : undefined,
      google: typeof parsed.google === "string" ? parsed.google : undefined,
    };
  } catch {
    return EMPTY;
  }
}

function write(keys: UserApiKeys) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // ignore quota / disabled
  }
}

export function useByokKeys() {
  const [keys, setKeys] = useState<UserApiKeys>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setKeys(read());
    setHydrated(true);
  }, []);

  const update = useCallback((next: UserApiKeys) => {
    const cleaned: UserApiKeys = {
      anthropic: next.anthropic?.trim() || undefined,
      openai: next.openai?.trim() || undefined,
      google: next.google?.trim() || undefined,
    };
    setKeys(cleaned);
    write(cleaned);
  }, []);

  const clear = useCallback(() => {
    setKeys(EMPTY);
    write(EMPTY);
  }, []);

  const hasAny = Boolean(keys.anthropic || keys.openai || keys.google);

  return { keys, hydrated, hasAny, update, clear };
}

export function maskKey(key: string | undefined): string {
  if (!key) return "";
  if (key.length < 12) return "•".repeat(key.length);
  return key.slice(0, 6) + "…" + key.slice(-4);
}
