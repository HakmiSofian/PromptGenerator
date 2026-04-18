"use client";

type Mode = "create" | "improve";

export default function ModeTabs({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  const base = "flex-1 text-sm font-medium py-2 px-3 rounded-lg transition";
  const active = "bg-indigo-600 text-white";
  const inactive = "text-slate-600 hover:bg-slate-50";

  return (
    <div className="flex gap-1 mb-4 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
      <button
        className={`${base} ${mode === "create" ? active : inactive}`}
        onClick={() => onChange("create")}
      >
        ✨ Créer un kit
      </button>
      <button
        className={`${base} ${mode === "improve" ? active : inactive}`}
        onClick={() => onChange("improve")}
      >
        🔧 Améliorer un prompt
      </button>
    </div>
  );
}
