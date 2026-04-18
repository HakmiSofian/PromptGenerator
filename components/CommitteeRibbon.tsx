"use client";

import type { ProviderName, ProvidersUsed } from "@/lib/types";

const LABEL: Record<ProviderName, string> = {
  anthropic: "Claude",
  openai: "GPT",
  google: "Gemini",
};

export default function CommitteeRibbon({
  providers,
}: {
  providers: ProvidersUsed;
}) {
  const steps: { emoji: string; role: string; provider?: ProviderName }[] = [
    { emoji: "🔍", role: "Analyste", provider: providers.analyst },
    { emoji: "✍️", role: "Rédacteur", provider: providers.writer },
  ];
  if (providers.critic) {
    steps.push({ emoji: "🔎", role: "Critique", provider: providers.critic });
  }

  const unique = new Set(Object.values(providers).filter(Boolean));
  const isDiverse = unique.size > 1;

  return (
    <div className="mb-6 p-3 rounded-lg border border-slate-200 bg-slate-50">
      <div className="text-[11px] uppercase tracking-wide font-semibold text-slate-600 mb-2">
        Comité multi-IA {isDiverse ? "· diversifié ✨" : ""}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {steps.map((s, i) => (
          <span key={s.role} className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-2.5 py-1">
              <span>{s.emoji}</span>
              <span className="text-slate-700">{s.role}</span>
              {s.provider && (
                <span className="text-slate-400">·</span>
              )}
              {s.provider && (
                <span className="font-medium text-slate-900">
                  {LABEL[s.provider]}
                </span>
              )}
            </span>
            {i < steps.length - 1 && (
              <span className="text-slate-300">→</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
