"use client";

import { useState } from "react";
import type { AuditResult, GenerateResult, UserApiKeys } from "@/lib/types";
import AuditResultView from "./AuditResultView";
import GenerationProgress from "./GenerationProgress";
import { useGenerateStream } from "@/lib/client/useGenerateStream";
import { titleFromRequest } from "@/lib/client/useKitHistory";

export default function AuditFlow({
  initialResult,
  onGenerated,
  userKeys,
}: {
  initialResult?: AuditResult | null;
  onGenerated?: (
    request: unknown,
    result: GenerateResult,
    title: string
  ) => void;
  userKeys?: UserApiKeys;
}) {
  const [whatsWrong, setWhatsWrong] = useState("");
  const [currentClaudeMd, setCurrentClaudeMd] = useState("");
  const [recentPrompts, setRecentPrompts] = useState("");
  const [recentResponses, setRecentResponses] = useState("");
  const [stackHint, setStackHint] = useState("");
  const [result, setResult] = useState<AuditResult | null>(initialResult ?? null);
  const { progress, error, run, reset } = useGenerateStream();
  const loading = progress.active;

  const canSubmit = whatsWrong.trim().length >= 5 && !loading;

  const submit = async () => {
    const request = {
      mode: "audit",
      whatsWrong,
      currentClaudeMd,
      recentPrompts,
      recentResponses,
      stackHint,
      userKeys,
    };
    await run(request, (res) => {
      if (res.mode !== "audit") return;
      setResult(res);
      onGenerated?.(request, res, titleFromRequest("audit", request));
    });
  };

  const restart = () => {
    setWhatsWrong("");
    setCurrentClaudeMd("");
    setRecentPrompts("");
    setRecentResponses("");
    setStackHint("");
    setResult(null);
    reset();
  };

  if (result) {
    return <AuditResultView result={result} onRestart={restart} />;
  }

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">
        Audite un projet Claude Code en difficulté
      </h2>
      <p className="text-slate-500 text-sm mb-4">
        Tu as commencé un projet avec Claude Code et ça part en vrille ? Décris la situation,
        on diagnostique et on te livre un kit de remise sur les rails.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Qu&apos;est-ce qui ne va pas ? <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            className="w-full border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Exemple : Claude n'écoute plus mes consignes, il refait à chaque fois la même erreur, il ajoute des fichiers que je ne demande pas, la conversation est devenue énorme."
            value={whatsWrong}
            onChange={(e) => setWhatsWrong(e.target.value)}
          />
        </div>

        <details className="border border-slate-200 rounded-lg" open>
          <summary className="px-3 py-2 text-sm font-medium cursor-pointer select-none">
            📄 Ton CLAUDE.md actuel <span className="text-slate-400 font-normal">(optionnel mais très utile)</span>
          </summary>
          <div className="p-3 pt-0">
            <textarea
              rows={5}
              className="w-full border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
              placeholder="Colle ici le contenu de ton CLAUDE.md (laisse vide si tu n'en as pas)…"
              value={currentClaudeMd}
              onChange={(e) => setCurrentClaudeMd(e.target.value)}
            />
          </div>
        </details>

        <details className="border border-slate-200 rounded-lg">
          <summary className="px-3 py-2 text-sm font-medium cursor-pointer select-none">
            💬 Tes derniers prompts envoyés <span className="text-slate-400 font-normal">(optionnel)</span>
          </summary>
          <div className="p-3 pt-0">
            <textarea
              rows={4}
              className="w-full border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Colle 1 à 3 prompts récents, séparés par une ligne vide."
              value={recentPrompts}
              onChange={(e) => setRecentPrompts(e.target.value)}
            />
          </div>
        </details>

        <details className="border border-slate-200 rounded-lg">
          <summary className="px-3 py-2 text-sm font-medium cursor-pointer select-none">
            🤖 Les réponses récentes de Claude <span className="text-slate-400 font-normal">(optionnel)</span>
          </summary>
          <div className="p-3 pt-0">
            <textarea
              rows={4}
              className="w-full border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Colle ce que Claude t'a répondu pour les prompts ci-dessus."
              value={recentResponses}
              onChange={(e) => setRecentResponses(e.target.value)}
            />
          </div>
        </details>

        <div>
          <label className="block text-sm font-medium mb-1">
            Stack / techno du projet <span className="text-slate-400 font-normal">(optionnel)</span>
          </label>
          <input
            type="text"
            className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ex : Next.js 16 + Supabase, Python + Streamlit, WordPress…"
            value={stackHint}
            onChange={(e) => setStackHint(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800">
          {error}
        </div>
      )}

      <GenerationProgress progress={progress} mode="audit" />

      <div className="flex justify-end mt-6">
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Diagnostic en cours…" : "Lancer l'audit"}
        </button>
      </div>
    </section>
  );
}
