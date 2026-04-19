"use client";

import { useMemo, useState } from "react";
import { scoreClaudeMd } from "@/lib/client/scoreClaudeMd";

const LEVEL_META: Record<
  ReturnType<typeof scoreClaudeMd>["level"],
  { color: string; tag: string; description: string }
> = {
  empty: { color: "text-slate-400", tag: "vide", description: "Pas encore de contenu." },
  weak: { color: "text-rose-600", tag: "à revoir", description: "Plusieurs règles essentielles manquent." },
  okay: { color: "text-amber-600", tag: "moyen", description: "Bases en place, des manques importants." },
  good: { color: "text-emerald-600", tag: "bon", description: "Solide. Quelques optimisations possibles." },
  great: { color: "text-emerald-600", tag: "excellent", description: "Bien structuré, peu d'angle mort." },
};

export default function ClaudeMdScoreCard({ value }: { value: string }) {
  const [open, setOpen] = useState(false);
  const result = useMemo(() => scoreClaudeMd(value), [value]);

  if (!value.trim()) return null;

  const meta = LEVEL_META[result.level];
  const failing = result.checks.filter((c) => !c.ok);
  const passing = result.checks.filter((c) => c.ok);

  return (
    <div className="mt-2 border border-slate-200 rounded-lg bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 rounded-lg"
      >
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-bold ${meta.color}`}>{result.score}</span>
          <div className="text-left">
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
              Score CLAUDE.md · {meta.tag}
            </div>
            <div className="text-xs text-slate-500">{meta.description}</div>
          </div>
        </div>
        <span className="text-xs text-indigo-600">
          {open ? "Masquer le détail" : "Voir le détail"}
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3">
          {failing.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wide font-semibold text-rose-700 mb-1">
                À ajouter ({failing.length})
              </div>
              <ul className="space-y-1.5">
                {failing.map((c, i) => (
                  <li key={i} className="text-sm text-slate-700 flex gap-2">
                    <span className="text-rose-500 shrink-0">✗</span>
                    <span>
                      <span className="font-medium">{c.label}</span>
                      {c.hint && (
                        <span className="text-slate-500"> — {c.hint}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {passing.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wide font-semibold text-emerald-700 mb-1">
                Déjà présent ({passing.length})
              </div>
              <ul className="space-y-1">
                {passing.map((c, i) => (
                  <li key={i} className="text-xs text-slate-600 flex gap-2">
                    <span className="text-emerald-600 shrink-0">✓</span>
                    <span>{c.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[11px] text-slate-400">
            Score 100 % local · 0 appel IA · purement heuristique pour te donner une intuition rapide.
          </p>
        </div>
      )}
    </div>
  );
}
