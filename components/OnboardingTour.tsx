"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "prompt-kit-onboarding-v1";

type Step = {
  title: string;
  body: string;
  emoji: string;
};

const STEPS: Step[] = [
  {
    emoji: "👋",
    title: "Bienvenue",
    body: "Cette appli te livre un kit prêt-à-coller pour Claude Code, à partir d'une simple description en français. Pas besoin d'être développeur.",
  },
  {
    emoji: "✨",
    title: "Trois modes",
    body: "« Créer un kit » pour démarrer un projet, « Améliorer un prompt » quand un de tes prompts a foiré, et « Auditer mon projet » quand un projet Claude Code commence à dériver.",
  },
  {
    emoji: "🤖",
    title: "Plusieurs IA travaillent en équipe",
    body: "Au lieu d'un seul appel, on enchaîne un analyste, un rédacteur, et un critique — chacun joue son rôle. Tu vois la progression en direct.",
  },
  {
    emoji: "📦",
    title: "Tout est récupérable",
    body: "Chaque kit peut être téléchargé en ZIP, retrouvé dans l'historique, et tu vois le coût exact à chaque génération. Tes données restent dans ton navigateur.",
  },
];

export default function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      if (!seen) setOpen(true);
    } catch {
      // localStorage disabled — show once per page anyway
      setOpen(true);
    }
  }, []);

  const close = (markSeen: boolean) => {
    setOpen(false);
    if (markSeen && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // ignore
      }
    }
  };

  if (!open) return null;
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full">
        <div className="p-6">
          <div className="text-5xl mb-3 text-center">{current.emoji}</div>
          <h2 className="text-xl font-bold text-center text-slate-900">
            {current.title}
          </h2>
          <p className="text-sm text-slate-600 text-center mt-3 leading-relaxed">
            {current.body}
          </p>

          <div className="flex items-center justify-center gap-1.5 mt-5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`inline-block rounded-full transition ${
                  i === step
                    ? "h-2 w-6 bg-indigo-600"
                    : "h-2 w-2 bg-slate-300"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button
            onClick={() => close(true)}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Passer
          </button>

          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="text-sm px-3 py-1.5 text-slate-700 hover:text-slate-900"
              >
                ← Retour
              </button>
            )}
            {isLast ? (
              <button
                onClick={() => close(true)}
                className="text-sm px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
              >
                C&apos;est parti !
              </button>
            ) : (
              <button
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                className="text-sm px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
              >
                Suivant →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
