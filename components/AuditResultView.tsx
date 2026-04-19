"use client";

import type { AuditResult, Diagnosis } from "@/lib/types";
import { CopyButton, DownloadButton } from "./CopyButton";
import CostPill from "./CostPill";
import ShareButton from "./ShareButton";

const SEVERITY: Record<
  Diagnosis["severity"],
  { bg: string; border: string; dot: string; label: string }
> = {
  critical: { bg: "bg-rose-50", border: "border-rose-200", dot: "bg-rose-500", label: "Critique" },
  warning: { bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", label: "À corriger" },
  info: { bg: "bg-slate-50", border: "border-slate-200", dot: "bg-slate-400", label: "Info" },
};

const CATEGORY_LABEL: Record<Diagnosis["category"], string> = {
  "claude-md": "CLAUDE.md",
  prompts: "Prompts",
  memory: "Mémoire",
  model: "Modèle",
  scope: "Périmètre",
  other: "Autre",
};

export default function AuditResultView({
  result,
  onRestart,
}: {
  result: AuditResult;
  onRestart: () => void;
}) {
  const score = result.healthScore;
  const scoreColor =
    score >= 80
      ? "text-emerald-600"
      : score >= 50
        ? "text-amber-600"
        : "text-rose-600";

  return (
    <section>
      <div className="flex items-start justify-between mb-2 gap-2">
        <h2 className="text-xl font-semibold">Diagnostic du projet</h2>
        <div className="flex flex-col items-end gap-1">
          <SourceBadge source={result.source} />
          {result.cost && <CostPill cost={result.cost} />}
        </div>
      </div>
      <p className="text-slate-500 text-sm mb-6">
        Voici l&apos;état de ton projet et ce qu&apos;il faut faire pour le remettre sur les rails.
      </p>

      <div className="mb-6 p-5 rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50">
        <div className="flex items-center gap-5">
          <div className={`text-5xl font-bold ${scoreColor}`}>{score}</div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
              Santé du projet · sur 100
            </div>
            <p className="text-slate-800 mt-1">{result.summary}</p>
            <p className="text-xs text-slate-500 mt-2">
              <strong>Cause principale :</strong> {result.rootCause}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex justify-end">
        <ShareButton result={result} />
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">🔬 Ce qu&apos;on a détecté</h3>
        <div className="space-y-2">
          {result.diagnosis.map((d, i) => {
            const s = SEVERITY[d.severity];
            return (
              <div
                key={i}
                className={`flex gap-3 p-3 rounded-lg border ${s.bg} ${s.border}`}
              >
                <span className={`inline-block w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${s.dot}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{d.label}</span>
                    <span className="text-[10px] uppercase tracking-wide text-slate-500">
                      {s.label}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-slate-500 bg-white border border-slate-200 rounded px-1.5">
                      {CATEGORY_LABEL[d.category] ?? d.category}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mt-0.5">{d.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">📋 Plan d&apos;action</h3>
        <ol className="space-y-2">
          {result.actionItems.map((a, i) => (
            <li
              key={i}
              className="p-3 rounded-lg border border-slate-200 bg-white"
            >
              <div className="flex items-start gap-3">
                <span className="bg-indigo-100 text-indigo-700 rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{a.label}</div>
                  <p className="text-sm text-slate-600 mt-0.5">{a.detail}</p>
                  {a.command && (
                    <code className="inline-block mt-1.5 text-xs bg-slate-900 text-slate-100 rounded px-2 py-0.5">
                      {a.command}
                    </code>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">📄 Nouveau CLAUDE.md</h3>
          <div className="flex gap-2">
            <DownloadButton text={result.newClaudeMd} filename="CLAUDE.md" />
            <CopyButton text={result.newClaudeMd} />
          </div>
        </div>
        <pre className="bg-slate-900 text-slate-100 text-sm p-4 rounded-lg overflow-x-auto">
          {result.newClaudeMd}
        </pre>
        <p className="text-xs text-slate-500 mt-2">
          Remplace ton CLAUDE.md actuel par ce contenu.
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">🚀 Prompt de remise sur les rails</h3>
          <CopyButton text={result.recoveryPrompt} />
        </div>
        <pre className="bg-slate-900 text-slate-100 text-sm p-4 rounded-lg overflow-x-auto">
          {result.recoveryPrompt}
        </pre>
        <p className="text-xs text-slate-500 mt-2">
          Tape <code>/clear</code> dans Claude Code, puis colle ce prompt.
        </p>
      </div>

      <div className="flex justify-center mt-8">
        <button
          onClick={onRestart}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-lg"
        >
          Auditer un autre projet
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
