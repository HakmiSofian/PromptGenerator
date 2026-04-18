import type { ProvidersStatus } from "@/lib/llm/orchestrator";

export default function ProvidersBadge({
  status,
}: {
  status: ProvidersStatus;
}) {
  const active: string[] = [];
  if (status.anthropic) active.push("Claude");
  if (status.openai) active.push("GPT");
  if (status.google) active.push("Gemini");

  if (active.length === 0) {
    return (
      <div
        className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900"
        title="Aucune clé API n'est configurée. L'app utilise le moteur de templates local."
      >
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
        Mode fallback template — aucune clé API détectée
      </div>
    );
  }

  const label =
    active.length >= 2
      ? `Comité multi-IA diversifié · ${active.join(" + ")}`
      : `Chaîne multi-IA active · ${active[0]}`;

  return (
    <div
      className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900"
      title={`Providers actifs : ${active.join(", ")}.`}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
      </span>
      {label}
    </div>
  );
}
