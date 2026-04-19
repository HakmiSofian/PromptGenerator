"use client";

import type { ImproveResult, Issue } from "@/lib/types";
import { CopyButton } from "./CopyButton";
import CommitteeRibbon from "./CommitteeRibbon";
import CostPill from "./CostPill";
import ShareButton from "./ShareButton";
import FeedbackBar from "./FeedbackBar";

const SEVERITY_STYLES: Record<
  Issue["severity"],
  { bg: string; border: string; dot: string; label: string }
> = {
  high: { bg: "bg-rose-50", border: "border-rose-200", dot: "bg-rose-500", label: "Bloquant" },
  medium: { bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", label: "À améliorer" },
  low: { bg: "bg-slate-50", border: "border-slate-200", dot: "bg-slate-400", label: "Mineur" },
};

export default function ImproveResultView({
  result,
  onRestart,
}: {
  result: ImproveResult;
  onRestart: () => void;
}) {
  return (
    <section>
      <div className="flex items-start justify-between mb-2 gap-2">
        <h2 className="text-xl font-semibold">Diagnostic &amp; prompt amélioré</h2>
        <div className="flex flex-col items-end gap-1">
          <SourceBadge source={result.source} />
          {result.cost && <CostPill cost={result.cost} />}
        </div>
      </div>
      <p className="text-slate-500 text-sm mb-6">
        Voici ce qui manquait et la version corrigée.
      </p>

      {result.providersUsed && <CommitteeRibbon providers={result.providersUsed} />}

      <div className="mb-6 flex justify-end">
        <ShareButton result={result} />
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">🩺 Ce qui clochait</h3>
        <div className="space-y-2">
          {result.issues.map((i, idx) => {
            const s = SEVERITY_STYLES[i.severity];
            return (
              <div
                key={idx}
                className={`flex gap-3 p-3 rounded-lg border ${s.bg} ${s.border}`}
              >
                <span className={`inline-block w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${s.dot}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{i.label}</span>
                    <span className="text-[10px] uppercase tracking-wide text-slate-500">
                      {s.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mt-0.5">{i.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">✨ Prompt amélioré</h3>
          <CopyButton text={result.improvedPrompt} />
        </div>
        <pre className="bg-slate-900 text-slate-100 text-sm p-4 rounded-lg overflow-x-auto">
          {result.improvedPrompt}
        </pre>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
        <p className="font-semibold mb-1">Comment utiliser ce prompt amélioré ?</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Ouvre une nouvelle conversation dans Claude Code (ou tape <code>/clear</code>).</li>
          <li>Colle le prompt amélioré et envoie.</li>
          <li>Claude devrait commencer par un plan : valide-le avant qu&apos;il code.</li>
        </ol>
      </div>

      <FeedbackBar result={result} />

      <div className="flex justify-center mt-8">
        <button
          onClick={onRestart}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-lg"
        >
          Améliorer un autre prompt
        </button>
      </div>
    </section>
  );
}

function SourceBadge({ source }: { source: "llm" | "template" }) {
  const isLlm = source === "llm";
  return (
    <span
      className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-1 rounded ${
        isLlm ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
      }`}
    >
      {isLlm ? "Multi-IA" : "Template"}
    </span>
  );
}
