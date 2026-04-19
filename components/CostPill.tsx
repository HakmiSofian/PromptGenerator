"use client";

import type { CostBreakdown } from "@/lib/types";
import { formatUsd } from "@/lib/llm/pricing";

export default function CostPill({ cost }: { cost: CostBreakdown }) {
  if (cost.cached) {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800"
        title="Ce kit vient du cache : aucun appel IA, aucun coût."
      >
        ⚡ Cache · 0 €
      </span>
    );
  }

  const tokens = cost.inputTokens + cost.outputTokens;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700"
      title={`${cost.inputTokens.toLocaleString("fr-FR")} tokens en entrée · ${cost.outputTokens.toLocaleString("fr-FR")} tokens en sortie`}
    >
      💰 ≈ {formatUsd(cost.totalUsd)}
      <span className="text-slate-400">·</span>
      <span className="text-slate-500">
        {tokens.toLocaleString("fr-FR")} tokens
      </span>
    </span>
  );
}
