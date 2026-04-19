export type ClaudeMdCheck = {
  ok: boolean;
  weight: number;
  label: string;
  hint?: string;
};

export type ClaudeMdScore = {
  score: number;
  checks: ClaudeMdCheck[];
  level: "empty" | "weak" | "okay" | "good" | "great";
};

const CHECKS: { weight: number; label: string; hint: string; test: (md: string) => boolean }[] = [
  {
    weight: 12,
    label: "Indique l'objectif du projet",
    hint: "Ajoute une section « Contexte » ou « Objectif » au début.",
    test: (md) => /^#+\s*(contexte|objectif|but|projet)/im.test(md),
  },
  {
    weight: 14,
    label: "Demande un plan avant d'agir",
    hint: "Règle clé : « propose un plan court avant toute modification ».",
    test: (md) => /(plan|planifie|propose).{0,40}(avant|d'agir|modif)/i.test(md),
  },
  {
    weight: 10,
    label: "Interdit l'invention sans contexte",
    hint: "Ajoute : « Pose des questions si une info clé manque, ne devine pas ».",
    test: (md) => /(pose des questions|ne devine pas|don't guess|don't invent)/i.test(md),
  },
  {
    weight: 8,
    label: "Précise la langue de réponse",
    hint: "Précise « Réponds en français » (ou la langue voulue).",
    test: (md) => /(réponds?\s+en\s+français|reply\s+in\s+(french|english))/i.test(md),
  },
  {
    weight: 8,
    label: "Demande de vulgariser le jargon",
    hint: "Ajoute : « Vulgarise les termes techniques quand tu les introduis ».",
    test: (md) => /(vulgarise|explique|simplifie|accessible|non[\s-]?tech)/i.test(md),
  },
  {
    weight: 8,
    label: "Cadre la portée des modifications",
    hint: "Ex : « Modifie un fichier à la fois » ou « N'ajoute pas de fonctionnalité non demandée ».",
    test: (md) => /(un fichier à la fois|fichier par fichier|n'ajoute pas|n'invente pas|sans demande)/i.test(md),
  },
  {
    weight: 6,
    label: "Mentionne /plan, /compact ou /clear",
    hint: "Indiquer ces commandes encourage Claude à les proposer lui-même.",
    test: (md) => /(\/plan|\/compact|\/clear|\/model)/i.test(md),
  },
  {
    weight: 6,
    label: "Sections clairement titrées",
    hint: "Utilise des titres `#`, `##` pour délimiter contexte / règles / communication.",
    test: (md) => (md.match(/^#+\s/gm) || []).length >= 2,
  },
  {
    weight: 6,
    label: "Demande une trace de ce qui change",
    hint: "Ajoute : « Annonce ce que tu touches » ou « Résume ce qui a changé ».",
    test: (md) => /(annonce|résume|trace|explique ce qui a changé)/i.test(md),
  },
  {
    weight: 6,
    label: "Anti-bavardage / longueur cible",
    hint: "Ajoute une consigne de concision pour les réponses.",
    test: (md) => /(concis|bref|sois court|évite le bavardage|en (\d+|une|deux|trois) phrases?)/i.test(md),
  },
];

const LENGTH_PENALTIES: { test: (n: number) => boolean; weight: number; label: string; hint: string }[] = [
  {
    test: (n) => n < 100,
    weight: 12,
    label: "CLAUDE.md beaucoup trop court",
    hint: "Vise au moins ~300 caractères pour donner du contexte exploitable.",
  },
  {
    test: (n) => n > 6000,
    weight: 10,
    label: "CLAUDE.md trop long",
    hint: "Au-delà de ~5 Ko, Claude lit moins attentivement. Synthétise.",
  },
];

export function scoreClaudeMd(input: string): ClaudeMdScore {
  const md = input.trim();
  if (!md) {
    return { score: 0, checks: [], level: "empty" };
  }

  const checks: ClaudeMdCheck[] = CHECKS.map((c) => ({
    ok: c.test(md),
    weight: c.weight,
    label: c.label,
    hint: c.test(md) ? undefined : c.hint,
  }));

  const positive = checks.filter((c) => c.ok).reduce((s, c) => s + c.weight, 0);
  const maxScore = CHECKS.reduce((s, c) => s + c.weight, 0);

  let lengthPenalty = 0;
  for (const p of LENGTH_PENALTIES) {
    if (p.test(md.length)) {
      lengthPenalty += p.weight;
      checks.push({ ok: false, weight: p.weight, label: p.label, hint: p.hint });
    }
  }

  const raw = (positive / maxScore) * 100 - lengthPenalty;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  const level: ClaudeMdScore["level"] =
    score >= 85 ? "great" : score >= 65 ? "good" : score >= 40 ? "okay" : "weak";

  return { score, checks, level };
}
