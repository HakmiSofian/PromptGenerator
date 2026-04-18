"use client";

import { useState } from "react";
import type { ImproveResult } from "@/lib/types";
import ImproveResultView from "./ImproveResultView";

export default function ImproveFlow() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImproveResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = prompt.trim().length >= 5 && !loading;

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "improve", prompt, response }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erreur inconnue");
      setResult(data as ImproveResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const restart = () => {
    setPrompt("");
    setResponse("");
    setResult(null);
    setError(null);
  };

  if (result) {
    return <ImproveResultView result={result} onRestart={restart} />;
  }

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">
        Améliore un prompt qui n&apos;a pas donné ce que tu voulais
      </h2>
      <p className="text-slate-500 text-sm mb-4">
        Colle ton prompt initial. Ajoute la réponse de Claude si tu l&apos;as,
        ça améliore le diagnostic.
      </p>

      <label className="block text-sm font-medium mb-1">Ton prompt original</label>
      <textarea
        rows={5}
        className="w-full border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Colle ici le prompt que tu as envoyé à Claude Code…"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <label className="block text-sm font-medium mb-1 mt-4">
        Réponse de Claude (optionnel)
      </label>
      <textarea
        rows={4}
        className="w-full border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Colle la réponse que tu as obtenue (ou ce que tu aurais voulu à la place)…"
        value={response}
        onChange={(e) => setResponse(e.target.value)}
      />

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="flex justify-end mt-4">
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Diagnostic…" : "Diagnostiquer et améliorer"}
        </button>
      </div>
    </section>
  );
}
