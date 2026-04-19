"use client";

import type { CreateResult } from "@/lib/types";
import { CopyButton, DownloadButton } from "./CopyButton";
import CommitteeRibbon from "./CommitteeRibbon";
import DownloadKitButton from "./DownloadKitButton";
import CostPill from "./CostPill";
import ShareButton from "./ShareButton";
import RecommendationsCard from "./RecommendationsCard";

export default function ResultView({
  result,
  coach,
  onRestart,
}: {
  result: CreateResult;
  coach: boolean;
  onRestart: () => void;
}) {
  const { model, claudeMd, initialPrompt, followups, howto, source, providersUsed, cost } = result;

  return (
    <section>
      <div className="flex items-start justify-between mb-2 gap-2">
        <h2 className="text-xl font-semibold">Ton kit Claude Code est prêt</h2>
        <div className="flex flex-col items-end gap-1">
          <SourceBadge source={source} />
          {cost && <CostPill cost={cost} />}
        </div>
      </div>
      <p className="text-slate-500 text-sm mb-6">
        Suis les étapes dans l&apos;ordre. Chaque bloc se copie en un clic.
      </p>

      {providersUsed && <CommitteeRibbon providers={providersUsed} />}

      <div className="mb-6 p-4 rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            Tu veux tout d&apos;un coup ?
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            ZIP complet, ou lien à envoyer à un collègue qui ouvrira ce kit directement.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ShareButton result={result} />
          <DownloadKitButton result={result} />
        </div>
      </div>

      <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🧠</div>
          <div>
            <div className="text-xs uppercase tracking-wide text-indigo-700 font-semibold">
              Modèle recommandé
            </div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {model.primary}
            </div>
            {coach && (
              <p className="text-sm text-slate-700 mt-1">{model.reason}</p>
            )}
            <div className="text-xs text-slate-500 mt-2">
              Commande :{" "}
              <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {model.switchCmd}
              </code>
            </div>
          </div>
        </div>
      </div>

      <Block
        title="📄 CLAUDE.md"
        subtitle="la mémoire de ton projet"
        text={claudeMd}
        filename="CLAUDE.md"
        footer="Colle ce contenu dans un fichier nommé CLAUDE.md à la racine de ton projet. Claude Code le lira à chaque session."
      />

      <Block
        title="🚀 Prompt initial"
        subtitle="à envoyer en premier dans Claude Code"
        text={initialPrompt}
        filename="prompt-initial.md"
      />

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">
            🔁 Prompts de suivi{" "}
            <span className="text-xs font-normal text-slate-500">
              — à utiliser au fil du travail
            </span>
          </h3>
        </div>
        <div className="space-y-3">
          {followups.map((f, i) => (
            <div
              key={i}
              className="border border-slate-200 rounded-lg overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
                <span className="font-medium text-sm">{f.title}</span>
                <CopyButton text={f.body} />
              </div>
              <pre className="text-sm p-3 bg-white">{f.body}</pre>
            </div>
          ))}
        </div>
      </div>

      <RecommendationsCard result={result} />

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm whitespace-pre-line">
        {howto}
      </div>

      <div className="flex justify-center mt-8">
        <button
          onClick={onRestart}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-lg"
        >
          Générer un autre kit
        </button>
      </div>
    </section>
  );
}

function Block({
  title,
  subtitle,
  text,
  filename,
  footer,
}: {
  title: string;
  subtitle?: string;
  text: string;
  filename: string;
  footer?: string;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">
          {title}
          {subtitle && (
            <span className="text-xs font-normal text-slate-500"> — {subtitle}</span>
          )}
        </h3>
        <div className="flex gap-2">
          <DownloadButton text={text} filename={filename} />
          <CopyButton text={text} />
        </div>
      </div>
      <pre className="bg-slate-900 text-slate-100 text-sm p-4 rounded-lg overflow-x-auto">
        {text}
      </pre>
      {footer && <p className="text-xs text-slate-500 mt-2">{footer}</p>}
    </div>
  );
}

function SourceBadge({ source }: { source: "llm" | "template" }) {
  const isLlm = source === "llm";
  return (
    <span
      className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-1 rounded ${
        isLlm
          ? "bg-emerald-100 text-emerald-800"
          : "bg-slate-100 text-slate-600"
      }`}
      title={
        isLlm
          ? "Généré par orchestration multi-IA"
          : "Généré par le moteur de templates local (aucune clé API configurée)"
      }
    >
      {isLlm ? "Multi-IA" : "Template"}
    </span>
  );
}
