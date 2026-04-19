"use client";

type Mode = "create" | "improve" | "audit";

const TABS: { value: Mode; label: string }[] = [
  { value: "create", label: "✨ Créer un kit" },
  { value: "improve", label: "🔧 Améliorer un prompt" },
  { value: "audit", label: "🩺 Auditer mon projet" },
];

export default function ModeTabs({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  const base = "flex-1 text-xs sm:text-sm font-medium py-2 px-2 sm:px-3 rounded-lg transition";
  const active = "bg-indigo-600 text-white";
  const inactive = "text-slate-600 hover:bg-slate-50";

  return (
    <div className="flex gap-1 mb-4 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
      {TABS.map((t) => (
        <button
          key={t.value}
          className={`${base} ${mode === t.value ? active : inactive}`}
          onClick={() => onChange(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
