"use client";

import { useState } from "react";
import type { TaskType, Size } from "@/lib/types";

export type Example = {
  emoji: string;
  label: string;
  goal: string;
  taskType: TaskType;
  size: Size;
  category: Category;
};

type Category = "entrepreneur" | "freelance" | "etudiant" | "employe" | "perso";

const CATEGORIES: { value: Category | "tous"; label: string; emoji: string }[] = [
  { value: "tous", label: "Tous", emoji: "🌐" },
  { value: "entrepreneur", label: "Entrepreneur", emoji: "🚀" },
  { value: "freelance", label: "Freelance", emoji: "🎨" },
  { value: "etudiant", label: "Étudiant", emoji: "🎓" },
  { value: "employe", label: "Employé", emoji: "💼" },
  { value: "perso", label: "Perso", emoji: "🏡" },
];

export const EXAMPLES: Example[] = [
  // Entrepreneur
  {
    emoji: "🥖",
    label: "Site pour mon commerce",
    goal: "Je veux un site web simple pour ma boulangerie avec les horaires d'ouverture, la liste des produits, et un formulaire de contact. Il doit être beau sur mobile.",
    taskType: "create",
    size: "medium",
    category: "entrepreneur",
  },
  {
    emoji: "🛒",
    label: "Mini boutique en ligne",
    goal: "Je veux une boutique en ligne très simple pour vendre mes 5 produits artisanaux avec paiement Stripe et envoi automatique d'un email de confirmation.",
    taskType: "create",
    size: "large",
    category: "entrepreneur",
  },
  {
    emoji: "📋",
    label: "Landing page MVP",
    goal: "Je veux une landing page pour valider mon idée de produit : présentation, bénéfices, témoignages factices, formulaire d'inscription à la liste d'attente.",
    taskType: "create",
    size: "small",
    category: "entrepreneur",
  },

  // Freelance
  {
    emoji: "🎨",
    label: "Portfolio web",
    goal: "Je veux un portfolio en ligne pour montrer mes 10 derniers projets avec une grille d'images, une page « à propos » et un formulaire de contact.",
    taskType: "create",
    size: "medium",
    category: "freelance",
  },
  {
    emoji: "🧾",
    label: "Générateur de devis",
    goal: "Je veux un petit outil web où je remplis le client, les prestations et les prix, et qui me sort un PDF de devis prêt à envoyer.",
    taskType: "create",
    size: "medium",
    category: "freelance",
  },
  {
    emoji: "📊",
    label: "Nettoyer un Excel",
    goal: "J'ai un fichier Excel avec des ventes exportées, plein de doublons et des dates dans plusieurs formats. Je veux un script qui me sort une version propre.",
    taskType: "script",
    size: "small",
    category: "freelance",
  },

  // Étudiant
  {
    emoji: "🤔",
    label: "Comprendre un projet reçu",
    goal: "Un ami développeur m'a donné le code source d'un projet. Je veux comprendre ce que ça fait, comment c'est organisé, et par où commencer pour le modifier.",
    taskType: "understand",
    size: "medium",
    category: "etudiant",
  },
  {
    emoji: "📚",
    label: "Quiz révisions",
    goal: "Je veux une petite app web qui me pose des questions à choix multiples pour réviser mes cours. Je dois pouvoir charger mes propres questions depuis un fichier.",
    taskType: "create",
    size: "medium",
    category: "etudiant",
  },
  {
    emoji: "📝",
    label: "Résumeur de PDF",
    goal: "Je veux un script qui prend un PDF de cours, en extrait le texte, et me génère un résumé structuré avec les points clés.",
    taskType: "script",
    size: "small",
    category: "etudiant",
  },

  // Employé
  {
    emoji: "📈",
    label: "Tableau de bord équipe",
    goal: "Je veux un tableau de bord interne qui affiche les indicateurs de mon équipe à partir d'un Google Sheet, avec un rafraîchissement quotidien.",
    taskType: "create",
    size: "large",
    category: "employe",
  },
  {
    emoji: "🤖",
    label: "Bot Slack interne",
    goal: "Je veux un bot Slack qui répond automatiquement aux questions fréquentes en allant chercher dans notre base de connaissances Notion.",
    taskType: "create",
    size: "large",
    category: "employe",
  },
  {
    emoji: "🐛",
    label: "Bug sur mon site",
    goal: "Sur mon site, le bouton « Envoyer » du formulaire ne fait rien quand je clique. Aide-moi à trouver pourquoi et à le réparer.",
    taskType: "bug",
    size: "small",
    category: "employe",
  },

  // Perso
  {
    emoji: "🏠",
    label: "Suivi de loyers",
    goal: "Je veux une petite app pour suivre les loyers que je perçois (3 locataires) avec rappel automatique quand un loyer est en retard.",
    taskType: "create",
    size: "medium",
    category: "perso",
  },
  {
    emoji: "🍽️",
    label: "Planificateur de repas",
    goal: "Je veux un outil qui me propose un planning de repas pour la semaine selon mes préférences, et qui me génère la liste de courses associée.",
    taskType: "create",
    size: "medium",
    category: "perso",
  },
  {
    emoji: "🎮",
    label: "Petit jeu pour mes enfants",
    goal: "Je veux un petit jeu web simple pour mes enfants (4-7 ans) : memory ou puzzle, avec des images d'animaux. Doit fonctionner sur tablette.",
    taskType: "create",
    size: "small",
    category: "perso",
  },
];

export default function Examples({
  onPick,
}: {
  onPick: (ex: Example) => void;
}) {
  const [active, setActive] = useState<Category | "tous">("tous");
  const visible =
    active === "tous"
      ? EXAMPLES
      : EXAMPLES.filter((e) => e.category === active);

  return (
    <div className="mt-4">
      <p className="text-xs text-slate-500 mb-2">
        Panne d&apos;inspiration ? Choisis une catégorie, puis clique sur un exemple :
      </p>

      <div className="flex flex-wrap gap-1 mb-3">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setActive(c.value)}
            className={`text-xs px-2.5 py-1 rounded-full border transition ${
              active === c.value
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
            }`}
          >
            <span className="mr-1">{c.emoji}</span>
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {visible.map((ex) => (
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
