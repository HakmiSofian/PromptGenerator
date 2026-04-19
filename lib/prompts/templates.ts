import type {
  CreateRequest,
  ImproveRequest,
  AuditRequest,
  CreateResult,
  ImproveResult,
  AuditResult,
  ModelRecommendation,
  Followup,
  Issue,
  Diagnosis,
  ActionItem,
} from "@/lib/types";

const taskTypeLabel: Record<CreateRequest["taskType"], string> = {
  create: "Création d'un nouveau projet",
  modify: "Modification d'un projet existant",
  bug: "Correction de bug",
  understand: "Compréhension de code",
  script: "Automatisation / script",
  refactor: "Refactoring",
};

export function recommendModel(
  taskType: CreateRequest["taskType"],
  size: CreateRequest["size"]
): ModelRecommendation {
  if (size === "large") {
    return {
      primary: "Opus 4.7",
      strategy: "advisor",
      reason:
        "Ton projet est gros : utilise Opus 4.7 pour planifier l'architecture et relire, puis bascule sur Sonnet 4.6 pour l'exécution. C'est la stratégie « advisor » recommandée par Anthropic (−11% de coût, +2% de qualité).",
      switchCmd: "/model opus → planification, puis /model sonnet → exécution",
    };
  }
  if (taskType === "understand" && size === "small") {
    return {
      primary: "Haiku 4.5",
      strategy: "solo",
      reason: "Explication rapide de code : Haiku 4.5 suffit.",
      switchCmd: "/model haiku",
    };
  }
  if (taskType === "script" && size === "small") {
    return {
      primary: "Haiku 4.5",
      strategy: "solo",
      reason: "Petit script ou tâche répétitive : Haiku 4.5, rapide et économique.",
      switchCmd: "/model haiku",
    };
  }
  if (size === "small") {
    return {
      primary: "Sonnet 4.6",
      strategy: "solo",
      reason: "Tâche ciblée : Sonnet 4.6, bon équilibre qualité / vitesse.",
      switchCmd: "/model sonnet",
    };
  }
  if (taskType === "bug" || taskType === "refactor") {
    return {
      primary: "Sonnet 4.6",
      strategy: "solo-with-plan",
      reason:
        "Bug ou refactoring : Sonnet 4.6 avec mode plan (`/plan`) pour réfléchir avant de modifier.",
      switchCmd: "/model sonnet puis /plan",
    };
  }
  return {
    primary: "Sonnet 4.6",
    strategy: "solo",
    reason: "Taille moyenne : Sonnet 4.6 par défaut pour le dev quotidien.",
    switchCmd: "/model sonnet",
  };
}

export function generateClaudeMd(req: CreateRequest): string {
  const lines = [
    "# Contexte du projet",
    "",
    `**Objectif** : ${req.goal.trim()}`,
    "",
    `**Type de tâche** : ${taskTypeLabel[req.taskType]}`,
    "",
  ];
  if (req.context.trim()) {
    lines.push("**Contexte et préférences** :", req.context.trim(), "");
  }
  lines.push(
    "# Règles de travail pour Claude Code",
    "",
    "- Pose des questions si une information clé manque, ne devine pas.",
    "- Avant une modification non triviale, propose un plan court (3-5 bullets) et attends ma validation.",
    "- Modifie de préférence les fichiers existants plutôt que d'en créer de nouveaux.",
    "- N'ajoute pas de fonctionnalités non demandées.",
    "- Garde le code simple : privilégie la lisibilité à l'ingéniosité.",
    "- Explique en une phrase ce qui a été fait après chaque action, sans paraphraser le code.",
    "",
    "# Communication",
    "",
    "- Réponds en français.",
    "- Vulgarise les termes techniques quand tu les introduis.",
    "- Si tu bloques, dis-le clairement plutôt que d'inventer."
  );
  return lines.join("\n");
}

export function generateInitialPrompt(req: CreateRequest): string {
  const { goal, taskType, size, context } = req;
  const model = recommendModel(taskType, size);
  const usePlanMode =
    size !== "small" || taskType === "bug" || taskType === "refactor";

  const parts: string[] = [];
  parts.push("## Objectif");
  parts.push(goal.trim());

  if (context.trim()) {
    parts.push("", "## Contexte et contraintes", context.trim());
  }

  parts.push("", "## Ce que j'attends de toi");

  const byType: Record<CreateRequest["taskType"], string[]> = {
    create: [
      "1. Lis d'abord le fichier `CLAUDE.md` à la racine.",
      "2. Propose une structure de projet minimale et attends ma validation.",
      "3. Une fois validée, génère le code fichier par fichier en annonçant ce que tu fais.",
      "4. Termine par une commande unique pour lancer le projet localement.",
    ],
    modify: [
      "1. Lis d'abord `CLAUDE.md` et explore les fichiers pertinents.",
      "2. Résume en 3 lignes ce que tu as compris de l'existant.",
      "3. Propose un plan de modification (quels fichiers, dans quel ordre) et attends validation.",
      "4. Applique les changements avec un message court par fichier touché.",
    ],
    bug: [
      "1. Explique ce qui devrait se passer vs ce qui se passe.",
      "2. Identifie la cause racine (pas juste le symptôme).",
      "3. Propose le correctif minimal et explique pourquoi il résout le problème.",
      "4. Applique le correctif et suggère un test de non-régression.",
    ],
    understand: [
      "1. Fais-moi un résumé en français accessible (5-10 lignes).",
      "2. Liste les fichiers les plus importants avec une phrase de rôle chacun.",
      "3. Signale les zones fragiles ou dettes techniques visibles.",
      "4. Termine par 3 questions que je devrais me poser.",
    ],
    script: [
      "1. Confirme en 2 lignes ce que tu as compris avant de coder.",
      "2. Écris le script en un seul fichier, commentaires courts.",
      "3. Donne la commande exacte pour le lancer et un exemple d'exécution.",
      "4. Anticipe 2 cas d'erreur courants et gère-les proprement.",
    ],
    refactor: [
      "1. Dresse une liste priorisée des améliorations possibles.",
      "2. Commence par la plus rentable ; attends validation avant le reste.",
      "3. Applique un seul changement à la fois et vérifie que rien ne casse.",
      "4. À la fin, résume ce qui a changé et ce que j'y gagne.",
    ],
  };
  parts.push(...byType[taskType]);

  parts.push(
    "",
    "## Format de réponse",
    "- Écris en français.",
    "- Sois concis, mais pas au point de perdre le lecteur non-technique.",
    "- Si tu dois faire un choix ambigu, pose-moi la question au lieu de deviner."
  );

  if (usePlanMode) {
    parts.push(
      "",
      "> 💡 Avant d'exécuter, passe en mode plan (`/plan`) pour que je valide ta stratégie."
    );
  }

  parts.push("", `_Modèle recommandé pour cette tâche : **${model.primary}**._`);
  return parts.join("\n");
}

export function generateFollowups(req: CreateRequest): Followup[] {
  const common: Followup[] = [
    {
      title: "Demander un résumé avant /compact",
      body:
        "Avant que je compacte la conversation, fais-moi un récap bullet point de : ce qu'on a fait, ce qui reste, les décisions prises, et les fichiers clés touchés. Je collerai ce résumé au prochain démarrage.",
    },
    {
      title: "Coincé ? Forcer une prise de recul",
      body:
        "Stop. Reprenons plus lentement. Explique-moi en français simple ce que tu essaies de faire, pourquoi ça ne marche pas, et quelles sont tes 2-3 pistes. Je choisirai laquelle suivre avant que tu écrives la moindre ligne.",
    },
  ];

  const perType: Partial<Record<CreateRequest["taskType"], Followup[]>> = {
    create: [
      {
        title: "Ajouter une fonctionnalité",
        body:
          "Ajoute [DÉCRIS LA FONCTIONNALITÉ]. Respecte la structure existante. Avant de coder, dis-moi quels fichiers tu vas toucher et pourquoi.",
      },
      {
        title: "Rendre ça déployable",
        body:
          "Prépare le projet pour le déployer simplement. Liste les étapes dans l'ordre pour quelqu'un qui n'a jamais déployé.",
      },
    ],
    modify: [
      {
        title: "Vérifier que rien n'a cassé",
        body:
          "Liste tout ce qui aurait pu être impacté par ta modification. Vérifie chacun et dis-moi si quelque chose doit être testé manuellement.",
      },
    ],
    bug: [
      {
        title: "Écrire un test de régression",
        body:
          "Ajoute un test minimal qui échouerait si ce bug revenait. Explique en une phrase ce que le test vérifie.",
      },
    ],
    understand: [
      {
        title: "Aller plus profond sur un fichier",
        body:
          "Reprends le fichier [NOM] et explique-le ligne par ligne, vocabulaire adapté à un débutant motivé.",
      },
    ],
    script: [
      {
        title: "Rendre le script robuste",
        body:
          "Ajoute une gestion d'erreurs minimale, un message d'aide si on le lance sans argument, et un mode --dry-run qui montre ce qu'il ferait sans rien modifier.",
      },
    ],
    refactor: [
      {
        title: "Prouver que le comportement n'a pas changé",
        body:
          "Compare le comportement avant/après. Liste les tests ou actions manuelles pour vérifier qu'on n'a rien cassé.",
      },
    ],
  };

  const list = [...(perType[req.taskType] ?? []), ...common];
  if (req.size === "large") {
    list.unshift({
      title: "Passer de la planification (Opus) à l'exécution (Sonnet)",
      body:
        "Le plan est validé. Bascule maintenant sur Sonnet pour l'exécution :\n\n`/model sonnet`\n\nPuis reprends la première étape du plan en annonçant ce que tu touches.",
    });
  }
  return list;
}

export function generateHowto(model: ModelRecommendation): string {
  return `Comment utiliser ce kit ?
1. Ouvre un dossier vide (ou ton projet existant) dans un terminal.
2. Crée un fichier nommé CLAUDE.md et colle le contenu ci-dessus dedans.
3. Lance \`claude\` dans ce dossier.
4. Choisis le modèle recommandé : ${model.switchCmd}
5. Colle le prompt initial et appuie sur Entrée.
6. Utilise les prompts de suivi au besoin en remplaçant les parties entre [ ].

Astuce : si la conversation devient longue, tape /compact pour résumer la session sans perdre le contexte.`;
}

export function buildCreateResultFromTemplates(
  req: CreateRequest
): CreateResult {
  const model = recommendModel(req.taskType, req.size);
  return {
    mode: "create",
    source: "template",
    model,
    claudeMd: generateClaudeMd(req),
    initialPrompt: generateInitialPrompt(req),
    followups: generateFollowups(req),
    howto: generateHowto(model),
  };
}

export function diagnosePrompt(prompt: string, response: string): Issue[] {
  const issues: Issue[] = [];
  const p = prompt.trim();
  const pLower = p.toLowerCase();
  const r = response.trim();
  const rLower = r.toLowerCase();

  if (p.length < 30) {
    issues.push({
      severity: "high",
      label: "Prompt trop court",
      detail:
        "Claude doit deviner trop de choses. Ajoute au minimum le contexte (projet / fichier) et le résultat attendu.",
    });
  }

  const vagueWords =
    /\b(mieux|plus propre|plus beau|plus rapide|optimise|améliore|corrige|fix|beau|joli|propre)\b/;
  const hasCriteria = /\b(pour que|afin que|de sorte que|pour qu'il|pour qu'elle)\b/.test(
    pLower
  );
  if (vagueWords.test(pLower) && !hasCriteria && p.length < 200) {
    issues.push({
      severity: "medium",
      label: "Critères de succès flous",
      detail:
        "Tu utilises des mots vagues (« mieux », « plus propre »…) sans dire comment mesurer. Donne un exemple concret.",
    });
  }

  const contextWords =
    /\b(projet|fichier|app|appli|site|page|composant|code|script|dossier|repo|class|fonction|function|module|api)\b/;
  if (!contextWords.test(pLower)) {
    issues.push({
      severity: "medium",
      label: "Contexte manquant",
      detail:
        "Tu ne précises pas sur quoi Claude doit travailler. Mentionne le projet, les fichiers ou le composant concernés.",
    });
  }

  const conjCount = (pLower.match(/\b(et|puis|ensuite|aussi|également|par ailleurs)\b/g) || [])
    .length;
  if (conjCount >= 3 && p.length < 400) {
    issues.push({
      severity: "medium",
      label: "Plusieurs tâches mélangées",
      detail:
        "Tu demandes plusieurs choses en même temps. Claude fera mieux en prompts successifs.",
    });
  }

  const hasFormat = /\b(format|liste|étapes|bullet|résum|plan|structure|réponds|répond|explique|en français)\b/.test(
    pLower
  );
  if (!hasFormat && p.length > 50) {
    issues.push({
      severity: "low",
      label: "Pas de format de réponse demandé",
      detail:
        "Précise ce que tu attends en retour : un plan, du code, une explication, des étapes numérotées…",
    });
  }

  if (r) {
    const missingCtx =
      /(je n'ai pas accès|je ne vois pas|i don't have access|i cannot see|je ne trouve pas)/;
    if (missingCtx.test(rLower)) {
      issues.push({
        severity: "high",
        label: "Claude n'a pas vu ton code",
        detail:
          "Claude signale qu'il n'a pas le contexte. Demande-lui explicitement de lire les fichiers ou précise leur chemin.",
      });
    }
    const asksQuestions = /(peux-tu préciser|peux-tu clarifier|could you clarify)/;
    if (asksQuestions.test(rLower) && (r.match(/\?/g) || []).length >= 2) {
      issues.push({
        severity: "medium",
        label: "Prompt ambigu",
        detail: "Claude t'a posé plusieurs questions. Anticipe-les dans la prochaine version.",
      });
    }
    if (r.length > 3500) {
      issues.push({
        severity: "low",
        label: "Réponse très longue",
        detail: "Tâche trop vaste pour un seul prompt. Découpe-la en sous-tâches.",
      });
    }
    const refused = /(i can't|i cannot|je ne peux pas|désolé|sorry)/;
    if (refused.test(rLower) && r.length < 400) {
      issues.push({
        severity: "high",
        label: "Claude a refusé ou abandonné",
        detail:
          "Reformule l'intention de façon plus précise et donne-lui le contexte qui lui permet d'avancer.",
      });
    }
  }

  if (issues.length === 0) {
    issues.push({
      severity: "low",
      label: "Rien d'évident à corriger",
      detail:
        "Ton prompt est correct sur le plan structurel. Essaie de forcer un plan (`/plan`) ou un meilleur modèle (Opus).",
    });
  }

  return issues;
}

export function rewritePrompt(originalPrompt: string, issues: Issue[]): string {
  const has = (label: string) => issues.some((i) => i.label === label);
  const parts: string[] = [];

  parts.push("## Objectif");
  parts.push(originalPrompt.trim() || "_(à compléter en 1-2 phrases claires)_");
  parts.push("");

  if (has("Contexte manquant") || has("Claude n'a pas vu ton code")) {
    parts.push(
      "## Contexte à charger avant d'agir",
      "- Lis d'abord `CLAUDE.md` à la racine s'il existe.",
      "- Explore la structure du projet et les fichiers probablement concernés.",
      "- Résume en 3 lignes ce que tu as compris de l'existant avant de proposer quoi que ce soit.",
      ""
    );
  }

  if (has("Critères de succès flous")) {
    parts.push(
      "## Critères de succès",
      "Avant toute modification, propose-moi 2-3 critères mesurables. Attends ma validation.",
      ""
    );
  }

  if (has("Plusieurs tâches mélangées")) {
    parts.push(
      "## Découpage",
      "Liste les sous-tâches dans l'ordre logique et traite-les une par une. Attends ma validation à chaque fin.",
      ""
    );
  }

  if (has("Prompt ambigu") || has("Prompt trop court")) {
    parts.push(
      "## Avant d'écrire du code",
      "1. Reformule en 2 lignes ce que tu as compris.",
      "2. Liste les hypothèses que tu vas faire.",
      "3. Si une hypothèse est bloquante, pose-moi la question.",
      ""
    );
  }

  if (has("Claude a refusé ou abandonné")) {
    parts.push(
      "## Si tu bloques",
      "Ne refuse pas en bloc. Explique ce qui te manque et propose 2 pistes pour continuer.",
      ""
    );
  }

  parts.push(
    "## Ce que j'attends de toi",
    "1. Propose un plan court (3-5 bullets) avant toute modification.",
    "2. Attends ma validation avant d'agir.",
    "3. Modifie un seul fichier à la fois et annonce ce que tu touches.",
    "4. Termine par une phrase qui résume ce qui a changé.",
    "",
    "## Format de réponse",
    "- Réponds en français.",
    "- Sois concis, clair pour un lecteur non-technique.",
    "- Signale tout choix ambigu au lieu de trancher silencieusement."
  );

  if (has("Réponse très longue") || has("Plusieurs tâches mélangées")) {
    parts.push("", "> 💡 Avant d'exécuter, passe en mode plan (`/plan`).");
  }

  return parts.join("\n");
}

export function buildImproveResultFromTemplates(
  req: ImproveRequest
): ImproveResult {
  const issues = diagnosePrompt(req.prompt, req.response);
  return {
    mode: "improve",
    source: "template",
    issues,
    improvedPrompt: rewritePrompt(req.prompt, issues),
  };
}

export function buildAuditResultFromTemplates(req: AuditRequest): AuditResult {
  const claudeMd = req.currentClaudeMd?.trim() ?? "";
  const prompts = req.recentPrompts?.trim() ?? "";
  const responses = req.recentResponses?.trim() ?? "";
  const wrong = req.whatsWrong.trim();

  const diagnosis: Diagnosis[] = [];

  if (!claudeMd) {
    diagnosis.push({
      category: "claude-md",
      severity: "critical",
      label: "Pas de CLAUDE.md",
      detail:
        "Sans CLAUDE.md, Claude Code repart à zéro à chaque session. C'est la cause n°1 des dérives.",
    });
  } else {
    if (claudeMd.length > 4000) {
      diagnosis.push({
        category: "claude-md",
        severity: "warning",
        label: "CLAUDE.md trop long",
        detail:
          "Au-delà de 3-4 Ko, Claude lit moins attentivement. Synthétise.",
      });
    }
    if (!/français|french/i.test(claudeMd)) {
      diagnosis.push({
        category: "claude-md",
        severity: "info",
        label: "Pas de consigne de langue",
        detail: "Précise « réponds en français » pour éviter les réponses en anglais.",
      });
    }
    if (!/plan|planifie|propose/i.test(claudeMd)) {
      diagnosis.push({
        category: "claude-md",
        severity: "warning",
        label: "Pas de garde-fou « plan avant action »",
        detail:
          "Sans cette règle, Claude code direct et casse plus souvent. Demande-lui de proposer un plan court avant toute modif.",
      });
    }
  }

  if (prompts) {
    const conjunctions = (prompts.toLowerCase().match(/\b(et|puis|ensuite)\b/g) || []).length;
    if (conjunctions >= 4) {
      diagnosis.push({
        category: "prompts",
        severity: "warning",
        label: "Prompts trop chargés",
        detail:
          "Plusieurs tâches sont enchaînées dans un même prompt. Découpe en demandes successives, valide à chaque étape.",
      });
    }
    if (prompts.length < 80) {
      diagnosis.push({
        category: "prompts",
        severity: "warning",
        label: "Prompts trop courts",
        detail:
          "Tes prompts manquent de contexte. Indique sur quel fichier/composant tu travailles et quel résultat tu attends.",
      });
    }
  }

  if (responses && responses.length > 6000) {
    diagnosis.push({
      category: "memory",
      severity: "warning",
      label: "Conversation très longue",
      detail:
        "La fenêtre de contexte se sature. Lance /compact pour résumer la session sans perdre les décisions.",
    });
  }

  if (/lent|slow|cher|expensive|trop long/i.test(wrong)) {
    diagnosis.push({
      category: "model",
      severity: "info",
      label: "Modèle peut-être surdimensionné",
      detail:
        "Si la tâche est simple, bascule sur Haiku ou Sonnet pour économiser temps et coût.",
    });
  }

  if (/perdu|confus|n'écoute pas|ignore|ne respecte/i.test(wrong)) {
    diagnosis.push({
      category: "memory",
      severity: "critical",
      label: "Claude perd le fil",
      detail:
        "Probablement saturation de contexte ou contradictions dans CLAUDE.md. Reset propre + nouveau CLAUDE.md = remède.",
    });
  }

  if (diagnosis.length === 0) {
    diagnosis.push({
      category: "other",
      severity: "info",
      label: "Pas de défaut majeur visible",
      detail:
        "Sur la base des éléments fournis, ton setup paraît sain. Si le problème persiste, partage la réponse exacte qui t'a posé souci.",
    });
  }

  const criticalCount = diagnosis.filter((d) => d.severity === "critical").length;
  const warnCount = diagnosis.filter((d) => d.severity === "warning").length;
  const healthScore = Math.max(
    10,
    100 - criticalCount * 30 - warnCount * 12 - (diagnosis.length - criticalCount - warnCount) * 3
  );

  const newClaudeMd = `# Contexte du projet

${req.stackHint?.trim() ? `**Stack** : ${req.stackHint.trim()}\n\n` : ""}**Ce qui pose problème actuellement** : ${wrong}

# Règles de travail (révisées)

- Avant toute modification non triviale, propose un plan court (3-5 bullets) et attends ma validation.
- Pose des questions si une information clé manque, ne devine pas.
- Modifie un fichier à la fois et annonce ce que tu touches avant.
- N'ajoute jamais de fonctionnalité non demandée.
- Si tu détectes une contradiction avec une consigne précédente, signale-la avant d'agir.

# Communication

- Réponds en français.
- Vulgarise les termes techniques quand tu les introduis.
- Si tu bloques, dis-le clairement plutôt que d'inventer.

# Garde-fous spécifiques

- Si la conversation devient longue, propose toi-même un /compact avec un récap.
- Si je te demande plusieurs choses dans un même message, demande-moi de prioriser.
`;

  const recoveryPrompt = `## Reprise de session

La session précédente a dérapé. Voici ce qu'on fait :

1. Lis le fichier \`CLAUDE.md\` à la racine (qui vient d'être réécrit).
2. Résume-moi en 3 lignes ce que tu en as compris et ce qui change par rapport à avant.
3. Attends ma validation avant de toucher au moindre fichier.
4. Quand je valide, propose un plan en 3-5 étapes pour reprendre proprement le travail là où on s'est arrêté, en tenant compte de ce qui a foiré : ${wrong}

Ne code rien tant que je n'ai pas validé ton plan.`;

  const actionItems: ActionItem[] = [];

  if (claudeMd) {
    actionItems.push({
      label: "Remplace ton CLAUDE.md",
      detail: "Colle la nouvelle version (ci-dessous) à la racine du projet.",
    });
  } else {
    actionItems.push({
      label: "Crée un CLAUDE.md à la racine",
      detail: "Colle la version proposée ci-dessous dans un fichier nommé CLAUDE.md.",
    });
  }

  actionItems.push({
    label: "Vide la conversation actuelle",
    detail:
      "Repart d'une session propre — la précédente est polluée par les mauvaises directions.",
    command: "/clear",
  });

  if (responses && responses.length > 6000) {
    actionItems.push({
      label: "Sauvegarde un récap avant de partir",
      detail:
        "Avant /clear, demande à Claude un récap des décisions importantes pour le coller au prochain démarrage.",
      command: "/compact",
    });
  }

  actionItems.push({
    label: "Bascule sur le bon modèle",
    detail:
      "Sonnet pour la plupart des tâches ; Opus pour planifier ; Haiku pour des questions rapides.",
    command: "/model sonnet",
  });

  actionItems.push({
    label: "Active le mode plan",
    detail:
      "Force Claude à proposer son raisonnement avant d'agir.",
    command: "/plan",
  });

  actionItems.push({
    label: "Envoie le prompt de reprise",
    detail: "Colle le « Prompt de remise sur les rails » et attends que Claude résume avant de valider.",
  });

  return {
    mode: "audit",
    source: "template",
    healthScore,
    summary:
      criticalCount > 0
        ? "Le projet est en difficulté, mais récupérable avec une remise à plat."
        : warnCount > 0
          ? "Quelques corrections importantes à faire pour repartir sur de bonnes bases."
          : "Setup globalement sain, ajustements mineurs.",
    rootCause:
      diagnosis[0]?.detail ?? "Cause non identifiable depuis les éléments fournis.",
    diagnosis,
    newClaudeMd,
    recoveryPrompt,
    actionItems,
  };
}
