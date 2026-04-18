"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [label, setLabel] = useState("Copier");
  return (
    <button
      className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded hover:bg-slate-700"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setLabel("Copié ✓");
        setTimeout(() => setLabel("Copier"), 1500);
      }}
    >
      {label}
    </button>
  );
}

export function DownloadButton({
  text,
  filename,
}: {
  text: string;
  filename: string;
}) {
  const [label, setLabel] = useState("Télécharger");
  return (
    <button
      className="text-xs bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded hover:bg-slate-50"
      onClick={() => {
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setLabel("Téléchargé ✓");
        setTimeout(() => setLabel("Télécharger"), 1500);
      }}
    >
      {label}
    </button>
  );
}
