"use client";

import { useState } from "react";
import ModeTabs from "@/components/ModeTabs";
import CreateFlow from "@/components/CreateFlow";
import ImproveFlow from "@/components/ImproveFlow";

export default function Home() {
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
      </header>

      <ModeTabs mode={mode} onChange={setMode} />

      <main className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        {mode === "create" ? <CreateFlow /> : <ImproveFlow />}
      </main>

      <footer className="text-center text-xs text-slate-400 mt-8">
        Phase 1 · backend prêt · clés API à connecter
      </footer>
    </div>
  );
}
