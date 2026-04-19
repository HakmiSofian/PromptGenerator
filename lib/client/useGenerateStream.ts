"use client";

import { useCallback, useRef, useState } from "react";
import type { GenerateResult } from "@/lib/types";

export type ClientStreamEvent =
  | { type: "status"; message: string }
  | { type: "cache-hit"; message: string }
  | {
      type: "role-start";
      role: "analyst" | "writer" | "critic";
      label: string;
    }
  | {
      type: "role-complete";
      role: "analyst" | "writer" | "critic";
    }
  | { type: "warning"; message: string }
  | { type: "result"; result: GenerateResult }
  | { type: "error"; message: string };

export type RoleStatus = "pending" | "running" | "done";

export type Progress = {
  active: boolean;
  statusMessage: string | null;
  warning: string | null;
  currentRole: "analyst" | "writer" | "critic" | null;
  currentLabel: string | null;
  roles: {
    analyst: RoleStatus;
    writer: RoleStatus;
    critic: RoleStatus;
  };
};

const initialProgress: Progress = {
  active: false,
  statusMessage: null,
  warning: null,
  currentRole: null,
  currentLabel: null,
  roles: { analyst: "pending", writer: "pending", critic: "pending" },
};

export function useGenerateStream() {
  const [progress, setProgress] = useState<Progress>(initialProgress);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setProgress(initialProgress);
    setError(null);
  }, []);

  const run = useCallback(
    async (
      body: unknown,
      onResult: (result: GenerateResult) => void
    ): Promise<void> => {
      reset();
      setProgress({ ...initialProgress, active: true });

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error ?? `HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";

          for (const chunk of chunks) {
            const line = chunk.trim();
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload) continue;

            let event: ClientStreamEvent;
            try {
              event = JSON.parse(payload) as ClientStreamEvent;
            } catch {
              continue;
            }
            applyEvent(event, setProgress, setError, onResult);
          }
        }
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return;
        const message = e instanceof Error ? e.message : "Erreur inconnue";
        setError(message);
        setProgress((p) => ({ ...p, active: false }));
      }
    },
    [reset]
  );

  return { progress, error, run, reset };
}

function applyEvent(
  event: ClientStreamEvent,
  setProgress: React.Dispatch<React.SetStateAction<Progress>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  onResult: (result: GenerateResult) => void
) {
  switch (event.type) {
    case "status":
      setProgress((p) => ({ ...p, statusMessage: event.message }));
      break;
    case "cache-hit":
      setProgress((p) => ({ ...p, statusMessage: event.message }));
      break;
    case "role-start":
      setProgress((p) => ({
        ...p,
        currentRole: event.role,
        currentLabel: event.label,
        roles: { ...p.roles, [event.role]: "running" },
      }));
      break;
    case "role-complete":
      setProgress((p) => ({
        ...p,
        roles: { ...p.roles, [event.role]: "done" },
      }));
      break;
    case "warning":
      setProgress((p) => ({ ...p, warning: event.message }));
      break;
    case "error":
      setError(event.message);
      setProgress((p) => ({ ...p, active: false }));
      break;
    case "result":
      setProgress((p) => ({ ...p, active: false, currentRole: null }));
      onResult(event.result);
      break;
  }
}
