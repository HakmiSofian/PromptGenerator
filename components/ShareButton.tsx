"use client";

import { useState } from "react";
import type { GenerateResult } from "@/lib/types";
import { buildShareUrl } from "@/lib/client/shareLink";

export default function ShareButton({ result }: { result: GenerateResult }) {
  const [label, setLabel] = useState("🔗 Copier le lien partageable");

  const onClick = async () => {
    try {
      const url = buildShareUrl(result);
      await navigator.clipboard.writeText(url);
      setLabel("✓ Lien copié");
      setTimeout(() => setLabel("🔗 Copier le lien partageable"), 2000);
    } catch {
      setLabel("Erreur — réessayer");
      setTimeout(() => setLabel("🔗 Copier le lien partageable"), 2000);
    }
  };

  return (
    <button
      onClick={onClick}
      className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:border-indigo-400 hover:text-indigo-700 transition"
      title="Crée un lien qui ouvre directement ce kit. Le contenu est encodé dans l'URL — aucun serveur ne stocke quoi que ce soit."
    >
      {label}
    </button>
  );
}
