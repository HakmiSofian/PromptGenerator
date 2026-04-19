"use client";

import { useMemo, useState } from "react";
import Examples, { type Example } from "./Examples";
import ResultView from "./ResultView";
import GenerationProgress from "./GenerationProgress";
import { useGenerateStream } from "@/lib/client/useGenerateStream";
import { titleFromRequest } from "@/lib/client/useKitHistory";
import type {
  CreateResult,
  TaskType,
  Size,
  GenerateResult,
  UserApiKeys,
} from "@/lib/types";

const TASK_OPTIONS: { value: TaskType; title: string; sub: string }[] = [
  { value: "create", title: "Créer un nouveau projet", sub: "Site, app, script, outil de zéro" },
  { value: "modify", title: "Modifier un projet existant", sub: "Ajouter une fonctionnalité, changer un comportement" },
  { value: "bug", title: "Corriger un bug", sub: "Quelque chose ne marche pas comme prévu" },
  { value: "understand", title: "Comprendre du code", sub: "Expliquer, documenter, analyser" },
  { value: "script", title: "Automatiser une tâche", sub: "Script, renommage, conversion, scraping" },
  { value: "refactor", title: "Améliorer / refactorer", sub: "Code plus propre, plus rapide, mieux structuré" },
];

const SIZE_OPTIONS: { value: Size; title: string; sub: string }[] = [
  { value: "small", title: "Petit · quelques minutes", sub: "Un fichier, une fonction, une question simple" },
  { value: "medium", title: "Moyen · une session d'1-2 heures", sub: "Plusieurs fichiers, une fonctionnalité complète" },
  { value: "large", title: "Gros · plusieurs sessions", sub: "Projet entier, architecture, refonte" },
];

export default function CreateFlow({
  initialResult,
  onGenerated,
  userKeys,
}: {
  initialResult?: CreateResult | null;
  onGenerated?: (
    request: unknown,
    result: GenerateResult,
    title: string
  ) => void;
  userKeys?: UserApiKeys;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | "result">(
    initialResult ? "result" : 1
  );
  const [goal, setGoal] = useState("");
  const [taskType, setTaskType] = useState<TaskType | "">("");
  const [size, setSize] = useState<Size | "">("");
  const [context, setContext] = useState("");
  const [coach, setCoach] = useState(true);
  const [result, setResult] = useState<CreateResult | null>(
    initialResult ?? null
  );
  const { progress, error, run, reset } = useGenerateStream();
  const loading = progress.active;

  const progressPct = useMemo(() => {
    if (step === "result") return 100;
    return (step / 4) * 100;
  }, [step]);

  const next = () => setStep((s) => (s === "result" ? s : Math.min(4, (s as number) + 1) as 1|2|3|4));
  const prev = () => setStep((s) => (s === "result" ? s : Math.max(1, (s as number) - 1) as 1|2|3|4));

  const canNext =
    (step === 1 && goal.trim().length > 5) ||
    (step === 2 && !!taskType) ||
    (step === 3 && !!size) ||
    step === 4;

  const applyExample = (ex: Example) => {
    setGoal(ex.goal);
    setTaskType(ex.taskType);
    setSize(ex.size);
  };

  const submit = async () => {
    const request = {
      mode: "create",
      goal,
      taskType,
      size,
      context,
      coach,
      userKeys,
    };
    await run(request, (res) => {
      if (res.mode !== "create") return;
      setResult(res);
      setStep("result");
      onGenerated?.(request, res, titleFromRequest("create", request));
    });
  };

  const restart = () => {
    setStep(1);
    setGoal("");
    setTaskType("");
    setSize("");
    setContext("");
    setCoach(true);
    setResult(null);
    reset();
  };

  if (step === "result" && result) {
    return <ResultView result={result} coach={coach} onRestart={restart} />;
  }

  return (
    <>
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>Étape {step} / 4</span>
          {typeof step === "number" && step > 1 && (
            <button className="underline hover:text-slate-700" onClick={restart}>
              Recommencer
            </button>
          )}
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {step === 1 && (
        <section>
          <h2 className="text-xl font-semibold mb-2">
            1. Qu&apos;est-ce que tu veux faire ?
          </h2>
          <p className="text-slate-500 text-sm mb-4">
            Décris-le comme si tu parlais à un ami. Pas besoin de jargon technique.
          </p>
          <textarea
            rows={5}
            className="w-full border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Exemple : Je veux un site web simple pour ma boulangerie avec les horaires, les produits et un formulaire de contact."
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
          <Examples onPick={applyExample} />
          <div className="flex justify-end mt-6">
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!canNext}
              onClick={next}
            >
              Suivant
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <h2 className="text-xl font-semibold mb-2">2. Quel type de tâche ?</h2>
          <p className="text-slate-500 text-sm mb-4">Choisis ce qui correspond le mieux.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TASK_OPTIONS.map((opt) => {
              const selected = taskType === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTaskType(opt.value)}
                  className={`border-2 rounded-lg p-4 text-left transition ${
                    selected
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-slate-200 hover:border-indigo-400"
                  }`}
                >
                  <div className="font-medium">{opt.title}</div>
                  <div className={`text-xs mt-1 ${selected ? "text-indigo-100" : "text-slate-500"}`}>
                    {opt.sub}
                  </div>
                </button>
              );
            })}
          </div>
          <NavButtons onPrev={prev} onNext={next} disabled={!canNext} />
        </section>
      )}

      {step === 3 && (
        <section>
          <h2 className="text-xl font-semibold mb-2">3. Quelle ampleur ?</h2>
          <p className="text-slate-500 text-sm mb-4">Sers-toi de ton intuition.</p>
          <div className="space-y-3">
            {SIZE_OPTIONS.map((opt) => {
              const selected = size === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setSize(opt.value)}
                  className={`w-full border-2 rounded-lg p-4 text-left transition ${
                    selected
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-slate-200 hover:border-indigo-400"
                  }`}
                >
                  <div className="font-medium">{opt.title}</div>
                  <div className={`text-xs mt-1 ${selected ? "text-indigo-100" : "text-slate-500"}`}>
                    {opt.sub}
                  </div>
                </button>
              );
            })}
          </div>
          <NavButtons onPrev={prev} onNext={next} disabled={!canNext} />
        </section>
      )}

      {step === 4 && (
        <section>
          <h2 className="text-xl font-semibold mb-2">4. Contexte (optionnel)</h2>
          <p className="text-slate-500 text-sm mb-4">
            Technos préférées, contraintes, ce que tu as déjà essayé.
          </p>
          <textarea
            rows={4}
            className="w-full border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Exemple : je préfère quelque chose de simple sans base de données ; ça doit tourner sur mon Mac."
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
          <label className="flex items-start gap-3 mt-4 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-indigo-600"
              checked={coach}
              onChange={(e) => setCoach(e.target.checked)}
            />
            <span className="text-sm text-slate-700">
              <strong>Mode coach</strong> — inclure les explications (pourquoi ce modèle, pourquoi cette structure).
            </span>
          </label>
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800">
              {error}
            </div>
          )}

          <GenerationProgress progress={progress} mode="create" />

          <div className="flex justify-between mt-6">
            <button
              onClick={prev}
              className="text-slate-600 hover:text-slate-900 px-4 py-2"
              disabled={loading}
            >
              ← Retour
            </button>
            <button
              onClick={submit}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? "Génération…" : "Générer mon kit"}
            </button>
          </div>
        </section>
      )}
    </>
  );
}

function NavButtons({
  onPrev,
  onNext,
  disabled,
}: {
  onPrev: () => void;
  onNext: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex justify-between mt-6">
      <button onClick={onPrev} className="text-slate-600 hover:text-slate-900 px-4 py-2">
        ← Retour
      </button>
      <button
        onClick={onNext}
        disabled={disabled}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Suivant
      </button>
    </div>
  );
}
