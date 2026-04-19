"use client";

import { useRef, useState } from "react";
import ModeTabs from "@/components/ModeTabs";
import CreateFlow from "@/components/CreateFlow";
import ImproveFlow from "@/components/ImproveFlow";
import ProvidersBadge from "@/components/ProvidersBadge";
import HistoryDrawer from "@/components/HistoryDrawer";
import type { ProvidersStatus } from "@/lib/llm/orchestrator";
import type {
  CreateResult,
  ImproveResult,
  GenerateResult,
} from "@/lib/types";
import type { HistoryEntry } from "@/lib/client/useKitHistory";

type Mode = "create" | "improve";

export default function HomeClient({
  providersStatus,
}: {
  providersStatus: ProvidersStatus;
}) {
  const [mode, setMode] = useState<Mode>("create");
  const [restored, setRestored] = useState<HistoryEntry | null>(null);
  const saveRef = useRef<
    ((e: Omit<HistoryEntry, "id" | "createdAt">) => HistoryEntry) | null
  >(null);

  const registerSave: Parameters<typeof HistoryDrawer>[0]["registerSave"] = (
    fn
  ) => {
    saveRef.current = fn;
  };

  const onRestore = (entry: HistoryEntry) => {
    setMode(entry.mode);
    setRestored(entry);
  };

  const handleGenerated = (
    kind: Mode,
    request: unknown,
    result: GenerateResult,
    title: string
  ) => {
    if (!saveRef.current) return;
    saveRef.current({ mode: kind, request, result, title });
  };

  const onTabChange = (m: Mode) => {
    setMode(m);
    setRestored(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <header className="mb-8 text-center relative">
        <div className="absolute right-0 top-0">
          <HistoryDrawer onRestore={onRestore} registerSave={registerSave} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          Prompt Kit pour Claude Code
        </h1>
        <p className="mt-2 text-slate-600">
          Décris ce que tu veux faire en français normal. On te donne le bon
          prompt, le bon modèle et le kit mémoire à coller dans Claude Code.
        </p>
        <div className="mt-4 flex justify-center">
          <ProvidersBadge status={providersStatus} />
        </div>
      </header>

      <ModeTabs mode={mode} onChange={onTabChange} />

      <main className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        {mode === "create" ? (
          <CreateFlow
            key={restored?.mode === "create" ? restored.id : "fresh-create"}
            initialResult={
              restored?.mode === "create"
                ? (restored.result as CreateResult)
                : null
            }
            onGenerated={(req, res, title) =>
              handleGenerated("create", req, res, title)
            }
          />
        ) : (
          <ImproveFlow
            key={restored?.mode === "improve" ? restored.id : "fresh-improve"}
            initialResult={
              restored?.mode === "improve"
                ? (restored.result as ImproveResult)
                : null
            }
            onGenerated={(req, res, title) =>
              handleGenerated("improve", req, res, title)
            }
          />
        )}
      </main>

      <footer className="text-center text-xs text-slate-400 mt-8">
        Open source · 100 % en français · orchestration multi-IA spécialisée
      </footer>
    </div>
  );
}
