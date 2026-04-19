"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:border-indigo-400 hover:text-indigo-700 transition"
      title="Ouvre la boîte d'impression du navigateur. Choisis « Enregistrer en PDF » comme imprimante pour avoir une copie PDF du kit."
    >
      🖨️ Imprimer / PDF
    </button>
  );
}
