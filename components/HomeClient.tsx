"use client";

import { useEffect, useRef, useState } from "react";
import ModeTabs from "@/components/ModeTabs";
import CreateFlow from "@/components/CreateFlow";
import ImproveFlow from "@/components/ImproveFlow";
import AuditFlow from "@/components/AuditFlow";
import ProvidersBadge from "@/components/ProvidersBadge";
import HistoryDrawer from "@/components/HistoryDrawer";
import ByokSettings from "@/components/ByokSettings";
import OnboardingTour from "@/components/OnboardingTour";
import ThemeToggle from "@/components/ThemeToggle";
import ShortcutsHelp from "@/components/ShortcutsHelp";
import { readSharedFromHash, clearShareHash } from "@/lib/client/shareLink";
import type { ProvidersStatus } from "@/lib/llm/orchestrator";
import type {
  CreateResult,
  ImproveResult,
  AuditResult,
  GenerateResult,
  UserApiKeys,
} from "@/lib/types";
import type { HistoryEntry } from "@/lib/client/useKitHistory";

type Mode = "create" | "improve" | "audit";

export default function HomeClient({
  providersStatus,
}: {
  providersStatus: ProvidersStatus;
}) {
  const [mode, setMode] = useState<Mode>("create");
  const [restored, setRestored] = useState<HistoryEntry | null>(null);
  const [userKeys, setUserKeys] = useState<UserApiKeys>({});
  const [byokActive, setByokActive] = useState(false);
  const saveRef = useRef<
    ((e: Omit<HistoryEntry, "id" | "createdAt">) => HistoryEntry) | null
  >(null);

  useEffect(() => {
    const shared = readSharedFromHash();
    if (!shared) return;
    const fakeEntry: HistoryEntry = {
      id: `shared-${Date.now()}`,
      createdAt: Date.now(),
      mode: shared.mode,
      title: "Kit partagé",
      request: {},
      result: shared,
    };
    setMode(shared.mode);
    setRestored(fakeEntry);
    clearShareHash();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "1") {
        e.preventDefault();
        setMode("create");
        setRestored(null);
      } else if (e.key === "2") {
        e.preventDefault();
        setMode("improve");
        setRestored(null);
      } else if (e.key === "3") {
        e.preventDefault();
        setMode("audit");
        setRestored(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
    const { userKeys: _stripped, ...safeRequest } =
      (request as Record<string, unknown>) ?? {};
    saveRef.current({ mode: kind, request: safeRequest, result, title });
  };

  const onTabChange = (m: Mode) => {
    setMode(m);
    setRestored(null);
  };

  const effectiveStatus: ProvidersStatus = {
    anthropic: providersStatus.anthropic || Boolean(userKeys.anthropic),
    openai: providersStatus.openai || Boolean(userKeys.openai),
    google: providersStatus.google || Boolean(userKeys.google),
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <OnboardingTour />
      <header className="mb-8 text-center relative no-print">
        <div className="absolute right-0 top-0 flex items-center gap-2">
          <ThemeToggle />
          <ByokSettings
            onChange={(keys, hasAny) => {
              setUserKeys(keys);
              setByokActive(hasAny);
            }}
          />
          <HistoryDrawer onRestore={onRestore} registerSave={registerSave} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50">
          Prompt Kit pour Claude Code
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Décris ce que tu veux faire en français normal. On te donne le bon
          prompt, le bon modèle et le kit mémoire à coller dans Claude Code.
        </p>
        <div className="mt-4 flex justify-center items-center gap-2 flex-wrap">
          <ProvidersBadge status={effectiveStatus} />
          {byokActive && (
            <span
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800"
              title="Tes clés locales sont utilisées à la place des clés serveur."
            >
              🔑 Tes clés locales sont utilisées
            </span>
          )}
        </div>
      </header>

      <div className="no-print">
        <ModeTabs mode={mode} onChange={onTabChange} />
      </div>

      <main className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
        {mode === "create" && (
          <CreateFlow
            key={restored?.mode === "create" ? restored.id : "fresh-create"}
            userKeys={userKeys}
            initialResult={
              restored?.mode === "create"
                ? (restored.result as CreateResult)
                : null
            }
            onGenerated={(req, res, title) =>
              handleGenerated("create", req, res, title)
            }
          />
        )}
        {mode === "improve" && (
          <ImproveFlow
            key={restored?.mode === "improve" ? restored.id : "fresh-improve"}
            userKeys={userKeys}
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
        {mode === "audit" && (
          <AuditFlow
            key={restored?.mode === "audit" ? restored.id : "fresh-audit"}
            userKeys={userKeys}
            initialResult={
              restored?.mode === "audit"
                ? (restored.result as AuditResult)
                : null
            }
            onGenerated={(req, res, title) =>
              handleGenerated("audit", req, res, title)
            }
          />
        )}
      </main>

      <ShortcutsHelp />

      <footer className="text-center text-xs text-slate-400 mt-8 no-print">
        Open source · 100 % en français · orchestration multi-IA spécialisée
      </footer>
    </div>
  );
}
