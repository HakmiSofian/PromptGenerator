"use client";

import type { TaskType, Size } from "@/lib/types";

export type Example = {
  emoji: string;
  label: string;
  goal: string;
  taskType: TaskType;
  size: Size;
};

export const EXAMPLES: Example[] = [
  {
    emoji: "🥖",
    label: "Site pour mon commerce",
    goal:
      "Je veux un site web simple pour ma boulangerie avec les horaires d'ouverture, la liste des produits, et un formulaire de contact. Il doit être beau sur mobile.",
    taskType: "create",
    size: "medium",
  },
  {
    emoji: "📊",
    label: "Nettoyer un fichier Excel",
    goal:
      "J'ai un fichier Excel avec des ventes exportées, plein de doublons et des dates dans plusieurs formats. Je veux un script qui me sort une version propre.",
    taskType: "script",
    size: "small",
  },
  {
    emoji: "🐛",
    label: "Bug sur mon site",
    goal:
      "Sur mon site, le bouton « Envoyer » du formulaire ne fait rien quand je clique. Aide-moi à trouver pourquoi et à le réparer.",
    taskType: "bug",
    size: "small",
  },
  {
    emoji: "🤔",
    label: "Comprendre un projet reçu",
    goal:
      "Un ami développeur m'a donné le code source d'un projet. Je veux comprendre ce que ça fait, comment c'est organisé, et par où commencer pour le modifier.",
    taskType: "understand",
    size: "medium",
  },
];

export default function Examples({
  onPick,
}: {
  onPick: (ex: Example) => void;
}) {
  return (
    <div className="mt-4">
      <p className="text-xs text-slate-500 mb-2">
        Panne d&apos;inspiration ? Clique sur un exemple pour démarrer :
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => onPick(ex)}
            className="text-left border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-lg px-3 py-2 text-sm transition"
          >
            <span className="mr-1">{ex.emoji}</span> {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
}
