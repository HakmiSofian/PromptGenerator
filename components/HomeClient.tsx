"use client";

import { useState } from "react";
import ModeTabs from "@/components/ModeTabs";
import CreateFlow from "@/components/CreateFlow";
import ImproveFlow from "@/components/ImproveFlow";
import ProvidersBadge from "@/components/ProvidersBadge";
import type { ProvidersStatus } from "@/lib/llm/orchestrator";

export default function HomeClient({
  providersStatus,
}: {
  providersStatus: ProvidersStatus;
}) {
  const [mode, setMode] = useState<"create" | "improve">("create");

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <header className="mb-8 text-center">
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

      <ModeTabs mode={mode} onChange={setMode} />

      <main className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        {mode === "create" ? <CreateFlow /> : <ImproveFlow />}
      </main>

      <footer className="text-center text-xs text-slate-400 mt-8">
        Open source · 100 % en français · orchestration multi-IA spécialisée
      </footer>
    </div>
  );
}
