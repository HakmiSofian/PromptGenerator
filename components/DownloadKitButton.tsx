"use client";

import { useState } from "react";
import { buildKitZip, downloadBlob } from "@/lib/client/buildKitZip";
import type { CreateResult } from "@/lib/types";

export default function DownloadKitButton({
  result,
  titleHint,
}: {
  result: CreateResult;
  titleHint?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState("📦 Télécharger tout le kit (.zip)");

  const onClick = async () => {
    setBusy(true);
    try {
      const { blob, filename } = await buildKitZip(result, titleHint);
      downloadBlob(blob, filename);
      setLabel("✓ Téléchargé");
      setTimeout(() => setLabel("📦 Télécharger tout le kit (.zip)"), 2000);
    } catch {
      setLabel("Erreur — réessayer");
      setTimeout(() => setLabel("📦 Télécharger tout le kit (.zip)"), 2000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="w-full md:w-auto bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-60"
      title="CLAUDE.md + prompt initial + prompts de suivi + README dans un seul fichier ZIP"
    >
      {busy ? "Préparation…" : label}
    </button>
  );
}
