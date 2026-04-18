// Prompt Kit pour Claude Code — logique MVP
// Tout est local, aucune requête externe.

const state = {
  mode: "create", // "create" | "improve"
  step: 1,
  goal: "",
  taskType: "",
  size: "",
  context: "",
  coach: true,
  // improve mode
  improvePrompt: "",
  improveResponse: "",
};

const TOTAL_STEPS = 4;

// ---------- Navigation ----------
function showStep(step) {
  document.querySelectorAll(".step").forEach((s) => s.classList.remove("active"));
  const target = document.querySelector(`.step[data-step="${step}"]`);
  if (target) target.classList.add("active");

  const progressBar = document.getElementById("progressBar");
  const progressLabel = document.getElementById("progressLabel");
  const resetBtn = document.getElementById("resetBtn");

  if (step === "result") {
    progressBar.style.width = "100%";
    progressLabel.textContent = "Terminé";
    resetBtn.classList.remove("hidden");
  } else {
    const pct = (step / TOTAL_STEPS) * 100;
    progressBar.style.width = pct + "%";
    progressLabel.textContent = `Étape ${step} / ${TOTAL_STEPS}`;
    resetBtn.classList.toggle("hidden", step === 1);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goNext() {
  if (state.step < TOTAL_STEPS) {
    state.step += 1;
    showStep(state.step);
    refreshNextButtons();
  }
}

function goPrev() {
  if (state.step > 1) {
    state.step -= 1;
    showStep(state.step);
    refreshNextButtons();
  }
}

function refreshNextButtons() {
  document.querySelectorAll(".step").forEach((section) => {
    const stepNum = Number(section.dataset.step);
    const nextBtn = section.querySelector(".nextBtn");
    if (!nextBtn) return;
    let ok = false;
    if (stepNum === 1) ok = state.goal.trim().length > 5;
    if (stepNum === 2) ok = !!state.taskType;
    if (stepNum === 3) ok = !!state.size;
    nextBtn.disabled = !ok;
  });
}

// ---------- Recommender : modèle Claude Code ----------
function recommendModel() {
  const { taskType, size } = state;

  // Règles simples basées sur les guides officiels Anthropic.
  // Haiku : tâches rapides, volume simple
  // Sonnet : daily driver, dev quotidien
  // Opus : raisonnement complexe, architecture, gros contexte
  // Advisor : Opus planifie, Sonnet exécute (gros projets)

  if (size === "large") {
    return {
      primary: "Opus 4.7",
      strategy: "advisor",
      reason:
        "Ton projet est gros : utilise Opus 4.7 pour planifier l'architecture et relire, puis bascule sur Sonnet 4.6 pour l'exécution. C'est la stratégie « advisor » recommandée par Anthropic (environ −11% de coût et +2% de qualité).",
      switchCmd: "/model opus → planification, puis /model sonnet → exécution",
    };
  }

  if (taskType === "understand" && size === "small") {
    return {
      primary: "Haiku 4.5",
      strategy: "solo",
      reason:
        "Explication rapide de code : Haiku 4.5 est le plus rapide et largement suffisant.",
      switchCmd: "/model haiku",
    };
  }

  if (taskType === "script" && size === "small") {
    return {
      primary: "Haiku 4.5",
      strategy: "solo",
      reason:
        "Petit script ou tâche répétitive : Haiku 4.5 est rapide et économique.",
      switchCmd: "/model haiku",
    };
  }

  if (size === "small") {
    return {
      primary: "Sonnet 4.6",
      strategy: "solo",
      reason:
        "Tâche ciblée : Sonnet 4.6 est le bon équilibre qualité / vitesse pour du dev quotidien.",
      switchCmd: "/model sonnet",
    };
  }

  if (taskType === "bug" || taskType === "refactor") {
    return {
      primary: "Sonnet 4.6",
      strategy: "solo-with-plan",
      reason:
        "Bug ou refactoring : Sonnet 4.6 avec le mode plan (`/plan`) pour qu'il réfléchisse avant de modifier. Passe sur Opus 4.7 seulement si Sonnet bloque.",
      switchCmd: "/model sonnet puis /plan",
    };
  }

  return {
    primary: "Sonnet 4.6",
    strategy: "solo",
    reason:
      "Taille moyenne : Sonnet 4.6 est le meilleur choix par défaut pour le dev quotidien.",
    switchCmd: "/model sonnet",
  };
}

// ---------- Génération CLAUDE.md ----------
function generateClaudeMd() {
  const { goal, taskType, context } = state;
  const taskLabel = {
    create: "Création d'un nouveau projet",
    modify: "Modification d'un projet existant",
    bug: "Correction de bug",
    understand: "Compréhension de code",
    script: "Automatisation / script",
    refactor: "Refactoring",
  }[taskType];

  const lines = [
    "# Contexte du projet",
    "",
    `**Objectif** : ${goal.trim()}`,
    "",
    `**Type de tâche** : ${taskLabel}`,
    "",
  ];

  if (context.trim()) {
    lines.push("**Contexte et préférences** :", context.trim(), "");
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
    "- Si tu bloques, dis-le clairement plutôt que d'inventer.",
    ""
  );

  return lines.join("\n");
}

// ---------- Génération prompt initial ----------
function generateInitialPrompt() {
  const { goal, taskType, size, context } = state;
  const model = recommendModel();

  const usePlanMode =
    size !== "small" || taskType === "bug" || taskType === "refactor";

  const parts = [];

  parts.push("## Objectif");
  parts.push(goal.trim());

  if (context.trim()) {
    parts.push("");
    parts.push("## Contexte et contraintes");
    parts.push(context.trim());
  }

  parts.push("");
  parts.push("## Ce que j'attends de toi");

  if (taskType === "create") {
    parts.push(
      "1. Lis d'abord le fichier `CLAUDE.md` à la racine.",
      "2. Propose une structure de projet minimale (fichiers + rôle de chacun) et attends ma validation.",
      "3. Une fois validée, génère le code fichier par fichier en annonçant ce que tu fais.",
      "4. Termine par une commande unique que je peux copier-coller pour lancer le projet localement."
    );
  } else if (taskType === "modify") {
    parts.push(
      "1. Lis d'abord `CLAUDE.md` et explore les fichiers pertinents.",
      "2. Résume en 3 lignes ce que tu as compris de l'existant.",
      "3. Propose un plan de modification (quels fichiers, dans quel ordre) et attends validation.",
      "4. Applique les changements avec un message court par fichier touché."
    );
  } else if (taskType === "bug") {
    parts.push(
      "1. Reproduis le bug mentalement : explique ce qui devrait se passer vs ce qui se passe.",
      "2. Identifie la cause racine (pas juste le symptôme).",
      "3. Propose le correctif minimal et explique pourquoi il résout le problème.",
      "4. Applique le correctif et suggère un test pour éviter une régression."
    );
  } else if (taskType === "understand") {
    parts.push(
      "1. Fais-moi un résumé en français accessible (5-10 lignes).",
      "2. Liste les fichiers les plus importants avec une phrase de rôle chacun.",
      "3. Signale les zones fragiles ou les dettes techniques visibles.",
      "4. Termine par 3 questions que je devrais me poser."
    );
  } else if (taskType === "script") {
    parts.push(
      "1. Confirme en 2 lignes ce que tu as compris avant de coder.",
      "2. Écris le script en un seul fichier, avec des commentaires courts.",
      "3. Donne la commande exacte pour le lancer et un exemple d'exécution.",
      "4. Anticipe 2 cas d'erreur courants et gère-les proprement."
    );
  } else if (taskType === "refactor") {
    parts.push(
      "1. Lis le code et dresse une liste priorisée des améliorations possibles.",
      "2. Commence par la plus rentable ; attends ma validation avant de toucher au reste.",
      "3. Applique un seul changement à la fois et vérifie que rien ne casse.",
      "4. À la fin, résume ce qui a changé et ce que j'y gagne."
    );
  }

  parts.push("");
  parts.push("## Format de réponse");
  parts.push(
    "- Écris en français.",
    "- Sois concis, mais pas au point de perdre le lecteur non-technique.",
    "- Si tu dois faire un choix ambigu, pose-moi la question au lieu de deviner."
  );

  if (usePlanMode) {
    parts.push("");
    parts.push("> 💡 Avant d'exécuter, passe en mode plan (`/plan`) pour que je valide ta stratégie.");
  }

  parts.push("");
  parts.push(`_Modèle recommandé pour cette tâche : **${model.primary}**._`);

  return parts.join("\n");
}

// ---------- Génération prompts de suivi ----------
function generateFollowups() {
  const { taskType, size } = state;
  const common = [
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

  const perType = {
    create: [
      {
        title: "Ajouter une fonctionnalité",
        body:
          "Ajoute [DÉCRIS LA FONCTIONNALITÉ]. Respecte la structure existante. Avant de coder, dis-moi quels fichiers tu vas toucher et pourquoi.",
      },
      {
        title: "Rendre ça déployable",
        body:
          "Prépare le projet pour le déployer simplement (ex : Vercel, Netlify, ou hébergement statique). Liste les étapes dans l'ordre pour quelqu'un qui n'a jamais déployé.",
      },
    ],
    modify: [
      {
        title: "Vérifier que rien n'a cassé",
        body:
          "Liste tout ce qui aurait pu être impacté par ta modification (fichiers, comportements, cas limites). Vérifie chacun et dis-moi si quelque chose doit être testé manuellement.",
      },
    ],
    bug: [
      {
        title: "Écrire un test de régression",
        body:
          "Ajoute un test minimal qui échouerait si ce bug revenait. Explique-moi en une phrase ce que le test vérifie.",
      },
    ],
    understand: [
      {
        title: "Aller plus profond sur un fichier",
        body:
          "Reprends le fichier [NOM DU FICHIER] et explique-le ligne par ligne, avec le vocabulaire que tu utiliserais pour un débutant motivé.",
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
          "Compare le comportement avant/après ton refactoring. Liste les tests ou actions manuelles qui permettent de vérifier qu'on n'a rien cassé.",
      },
    ],
  };

  const list = [...(perType[taskType] || []), ...common];

  if (size === "large") {
    list.unshift({
      title: "Passer de la planification (Opus) à l'exécution (Sonnet)",
      body:
        "Le plan est validé. Bascule maintenant sur Sonnet pour l'exécution :\n\n`/model sonnet`\n\nPuis reprends la première étape du plan en annonçant ce que tu touches.",
    });
  }

  return list;
}

// ---------- Guide comment l'utiliser ----------
function generateHowto() {
  const model = recommendModel();
  return `
<p class="font-semibold mb-2">Comment utiliser ce kit ?</p>
<ol class="list-decimal list-inside space-y-1">
  <li>Ouvre un dossier vide (ou ton projet existant) dans un terminal.</li>
  <li>Crée un fichier nommé <code>CLAUDE.md</code> et colle le contenu ci-dessus dedans.</li>
  <li>Lance <code>claude</code> dans ce dossier.</li>
  <li>Choisis le modèle recommandé : <code>${model.switchCmd}</code></li>
  <li>Colle le <strong>prompt initial</strong> et appuie sur Entrée.</li>
  <li>Utilise les prompts de suivi au besoin en remplaçant les parties entre [ ].</li>
</ol>
<p class="mt-3 text-xs text-amber-800">Astuce : si la conversation devient longue, tape <code>/compact</code> pour que Claude résume la session sans perdre le contexte important.</p>
  `;
}

// ---------- Rendu résultat ----------
function renderResult() {
  const model = recommendModel();
  const modelCard = document.getElementById("modelCard");

  modelCard.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="text-2xl">🧠</div>
      <div>
        <div class="text-xs uppercase tracking-wide text-indigo-700 font-semibold">Modèle recommandé</div>
        <div class="text-lg font-bold text-slate-900 mt-0.5">${model.primary}</div>
        ${state.coach ? `<p class="text-sm text-slate-700 mt-1">${model.reason}</p>` : ""}
        <div class="text-xs text-slate-500 mt-2">Commande : <code class="bg-white px-1.5 py-0.5 rounded border border-slate-200">${model.switchCmd}</code></div>
      </div>
    </div>
  `;

  document.getElementById("claudemd").textContent = generateClaudeMd();
  document.getElementById("initialPrompt").textContent = generateInitialPrompt();

  const followupsEl = document.getElementById("followups");
  followupsEl.innerHTML = "";
  generateFollowups().forEach((f, i) => {
    const id = `followup_${i}`;
    const block = document.createElement("div");
    block.className = "border border-slate-200 rounded-lg overflow-hidden";
    block.innerHTML = `
      <div class="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
        <span class="font-medium text-sm">${f.title}</span>
        <button class="copyBtn text-xs bg-slate-900 text-white px-3 py-1 rounded hover:bg-slate-700" data-target="${id}">Copier</button>
      </div>
      <pre id="${id}" class="text-sm p-3 bg-white">${escapeHtml(f.body)}</pre>
    `;
    followupsEl.appendChild(block);
  });

  document.getElementById("howto").innerHTML = generateHowto();

  bindCopyButtons();
  bindDownloadButtons();
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function bindCopyButtons() {
  document.querySelectorAll(".copyBtn").forEach((btn) => {
    btn.onclick = () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      navigator.clipboard.writeText(target.innerText).then(() => {
        const old = btn.textContent;
        btn.textContent = "Copié ✓";
        setTimeout(() => (btn.textContent = old), 1500);
      });
    };
  });
}

// ---------- Exemples starter (pour non-devs) ----------
const EXAMPLES = [
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
      "Sur mon site, le bouton 'Envoyer' du formulaire ne fait rien quand je clique dessus. Aide-moi à trouver pourquoi et à le réparer.",
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

function renderExamples() {
  const container = document.getElementById("examples");
  if (!container) return;
  container.innerHTML = "";
  EXAMPLES.forEach((ex) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "text-left border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-lg px-3 py-2 text-sm transition";
    btn.innerHTML = `<span class="mr-1">${ex.emoji}</span> ${ex.label}`;
    btn.onclick = () => {
      state.goal = ex.goal;
      state.taskType = ex.taskType;
      state.size = ex.size;
      document.getElementById("goal").value = ex.goal;
      document.querySelectorAll("#taskTypeGroup .pill").forEach((b) =>
        b.classList.toggle("selected", b.dataset.value === ex.taskType)
      );
      document.querySelectorAll("#sizeGroup .pill").forEach((b) =>
        b.classList.toggle("selected", b.dataset.value === ex.size)
      );
      refreshNextButtons();
    };
    container.appendChild(btn);
  });
}

// ---------- Mode switching (create / improve) ----------
function setMode(mode) {
  state.mode = mode;
  const progress = document.getElementById("progressWrap");
  const createTab = document.getElementById("modeCreateTab");
  const improveTab = document.getElementById("modeImproveTab");

  // tab visuals
  const activeCls = ["bg-indigo-600", "text-white"];
  const inactiveCls = ["text-slate-600", "hover:bg-slate-50"];
  if (mode === "create") {
    createTab.classList.add(...activeCls);
    createTab.classList.remove(...inactiveCls);
    improveTab.classList.remove(...activeCls);
    improveTab.classList.add(...inactiveCls);
    progress.style.display = "";
    state.step = 1;
    showStep(1);
  } else {
    improveTab.classList.add(...activeCls);
    improveTab.classList.remove(...inactiveCls);
    createTab.classList.remove(...activeCls);
    createTab.classList.add(...inactiveCls);
    progress.style.display = "none";
    showStep("improve");
  }
}

// ---------- Diagnostic du prompt ----------
function diagnosePrompt(prompt, response) {
  const issues = [];
  const p = (prompt || "").trim();
  const pLower = p.toLowerCase();
  const r = (response || "").trim();
  const rLower = r.toLowerCase();

  // 1. Prompt vide ou trop court
  if (p.length < 30) {
    issues.push({
      severity: "high",
      label: "Prompt trop court",
      detail:
        "Claude doit deviner trop de choses. Ajoute au minimum le contexte (quel projet / quel fichier) et le résultat attendu.",
    });
  }

  // 2. Mots vagues sans critère de succès
  const vagueWords = /\b(mieux|plus propre|plus beau|plus rapide|optimise|améliore|corrige|fix|beau|joli|propre)\b/;
  const hasCriteria = /\b(pour que|afin que|de sorte que|pour qu'il|pour qu'elle)\b/.test(pLower);
  if (vagueWords.test(pLower) && !hasCriteria && p.length < 200) {
    issues.push({
      severity: "medium",
      label: "Critères de succès flous",
      detail:
        "Tu utilises des mots vagues (« mieux », « plus propre »…) sans dire comment mesurer le résultat. Donne un exemple concret de ce qui doit changer.",
    });
  }

  // 3. Pas de contexte mentionné
  const contextWords = /\b(projet|fichier|app|appli|site|page|composant|code|script|dossier|repo|class|fonction|function|module|api)\b/;
  if (!contextWords.test(pLower)) {
    issues.push({
      severity: "medium",
      label: "Contexte manquant",
      detail:
        "Tu ne précises pas sur quoi Claude doit travailler. Mentionne le projet, les fichiers ou le composant concernés.",
    });
  }

  // 4. Plusieurs tâches mélangées
  const conjCount = (pLower.match(/\b(et|puis|ensuite|aussi|également|par ailleurs)\b/g) || []).length;
  if (conjCount >= 3 && p.length < 400) {
    issues.push({
      severity: "medium",
      label: "Plusieurs tâches mélangées",
      detail:
        "Tu demandes plusieurs choses en même temps. Claude fera mieux si tu sépares en prompts successifs.",
    });
  }

  // 5. Pas de format attendu
  const hasFormat = /\b(format|liste|étapes|bullet|résum|plan|structure|réponds|répond|explique|en français)\b/.test(pLower);
  if (!hasFormat && p.length > 50) {
    issues.push({
      severity: "low",
      label: "Pas de format de réponse demandé",
      detail:
        "Précise ce que tu attends en retour : un plan, du code, une explication, des étapes numérotées…",
    });
  }

  // Response-based diagnostics
  if (r) {
    const missingCtx = /(je n'ai pas accès|je ne vois pas|i don't have access|i cannot see|je ne trouve pas|can you (share|show)|peux-tu (partager|montrer))/;
    if (missingCtx.test(rLower)) {
      issues.push({
        severity: "high",
        label: "Claude n'a pas vu ton code",
        detail:
          "Dans sa réponse, Claude signale qu'il n'a pas le contexte. Demande-lui explicitement de lire les fichiers ou précise leur chemin.",
      });
    }
    const asksQuestions = /(peux-tu préciser|peux-tu clarifier|could you clarify|what do you mean|tu veux dire|tu parles de|est-ce que tu|\?)/;
    if (asksQuestions.test(rLower) && (r.match(/\?/g) || []).length >= 2) {
      issues.push({
        severity: "medium",
        label: "Prompt ambigu",
        detail:
          "Claude t'a posé plusieurs questions. Anticipe-les dans la prochaine version du prompt.",
      });
    }
    if (r.length > 3500) {
      issues.push({
        severity: "low",
        label: "Réponse très longue",
        detail:
          "La tâche était probablement trop vaste pour un seul prompt. Découpe-la en sous-tâches.",
      });
    }
    const refused = /(i can't|i cannot|je ne peux pas|désolé|sorry)/;
    if (refused.test(rLower) && r.length < 400) {
      issues.push({
        severity: "high",
        label: "Claude a refusé ou abandonné",
        detail:
          "Reformule l'intention de façon plus précise, et donne-lui le contexte qui lui permet d'avancer (fichiers, objectif final).",
      });
    }
  }

  if (issues.length === 0) {
    issues.push({
      severity: "low",
      label: "Rien d'évident à corriger",
      detail:
        "Ton prompt est correct sur le plan structurel. Essaie de forcer un plan (`/plan`) ou un meilleur modèle (Opus) avant de l'envoyer.",
    });
  }

  return issues;
}

// ---------- Réécriture du prompt ----------
function rewritePrompt(originalPrompt, issues) {
  const hasIssue = (label) => issues.some((i) => i.label === label);
  const parts = [];

  parts.push("## Objectif");
  parts.push(originalPrompt.trim() || "_(à compléter en 1-2 phrases claires)_");
  parts.push("");

  if (hasIssue("Contexte manquant") || hasIssue("Claude n'a pas vu ton code")) {
    parts.push("## Contexte à charger avant d'agir");
    parts.push(
      "- Lis d'abord `CLAUDE.md` à la racine s'il existe.",
      "- Explore la structure du projet et les fichiers probablement concernés.",
      "- Résume en 3 lignes ce que tu as compris de l'existant avant de proposer quoi que ce soit."
    );
    parts.push("");
  }

  if (hasIssue("Critères de succès flous")) {
    parts.push("## Critères de succès");
    parts.push(
      "Avant toute modification, propose-moi 2-3 critères mesurables (ex: « la page charge en moins de 2s », « le bouton affiche X »). Attends ma validation."
    );
    parts.push("");
  }

  if (hasIssue("Plusieurs tâches mélangées")) {
    parts.push("## Découpage");
    parts.push(
      "Liste les sous-tâches dans l'ordre logique, et traite-les une par une. Attends ma validation à chaque fin de sous-tâche avant de passer à la suivante."
    );
    parts.push("");
  }

  if (hasIssue("Prompt ambigu") || hasIssue("Prompt trop court")) {
    parts.push("## Avant d'écrire du code");
    parts.push(
      "1. Reformule en 2 lignes ce que tu as compris.",
      "2. Liste les hypothèses que tu vas faire.",
      "3. Si une hypothèse est bloquante, pose-moi la question au lieu de deviner."
    );
    parts.push("");
  }

  if (hasIssue("Claude a refusé ou abandonné")) {
    parts.push("## Si tu bloques");
    parts.push(
      "Ne refuse pas en bloc. Explique précisément ce qui te manque (info, accès, décision) et propose-moi 2 pistes pour continuer."
    );
    parts.push("");
  }

  parts.push("## Ce que j'attends de toi");
  parts.push(
    "1. Propose un plan court (3-5 bullets) avant toute modification.",
    "2. Attends ma validation avant d'agir.",
    "3. Modifie un seul fichier à la fois et annonce ce que tu touches.",
    "4. Termine par une phrase qui résume ce qui a changé."
  );
  parts.push("");

  parts.push("## Format de réponse");
  parts.push(
    "- Réponds en français.",
    "- Sois concis, mais clair pour un lecteur non-technique.",
    "- Signale tout choix ambigu au lieu de trancher silencieusement."
  );

  if (hasIssue("Réponse très longue") || hasIssue("Plusieurs tâches mélangées")) {
    parts.push("");
    parts.push("> 💡 Avant d'exécuter, passe en mode plan (`/plan`) pour que je valide ta stratégie.");
  }

  return parts.join("\n");
}

// ---------- Rendu résultat improve ----------
function renderImproveResult() {
  const issues = diagnosePrompt(state.improvePrompt, state.improveResponse);
  const improved = rewritePrompt(state.improvePrompt, issues);

  const issuesEl = document.getElementById("improveIssues");
  issuesEl.innerHTML = "";
  const sevColor = {
    high: { bg: "bg-rose-50", border: "border-rose-200", dot: "bg-rose-500", label: "Bloquant" },
    medium: { bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", label: "À améliorer" },
    low: { bg: "bg-slate-50", border: "border-slate-200", dot: "bg-slate-400", label: "Mineur" },
  };
  issues.forEach((i) => {
    const c = sevColor[i.severity] || sevColor.low;
    const block = document.createElement("div");
    block.className = `flex gap-3 p-3 rounded-lg border ${c.bg} ${c.border}`;
    block.innerHTML = `
      <span class="inline-block w-2.5 h-2.5 rounded-full ${c.dot} mt-1.5 shrink-0"></span>
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <span class="font-medium text-sm">${i.label}</span>
          <span class="text-[10px] uppercase tracking-wide text-slate-500">${c.label}</span>
        </div>
        <p class="text-sm text-slate-700 mt-0.5">${i.detail}</p>
      </div>
    `;
    issuesEl.appendChild(block);
  });

  document.getElementById("improvedPrompt").textContent = improved;

  document.getElementById("improveHowto").innerHTML = `
    <p class="font-semibold mb-1">Comment utiliser ce prompt amélioré ?</p>
    <ol class="list-decimal list-inside space-y-1">
      <li>Ouvre une nouvelle conversation dans Claude Code (ou tape <code>/clear</code>).</li>
      <li>Colle le prompt amélioré et envoie.</li>
      <li>Claude devrait commencer par un plan : valide-le (ou corrige-le) avant qu'il code.</li>
    </ol>
  `;

  bindCopyButtons();
  bindDownloadButtons();
}

// ---------- Download buttons ----------
function bindDownloadButtons() {
  document.querySelectorAll(".downloadBtn").forEach((btn) => {
    btn.onclick = () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      const filename = btn.dataset.filename || "fichier.txt";
      const blob = new Blob([target.innerText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const old = btn.textContent;
      btn.textContent = "Téléchargé ✓";
      setTimeout(() => (btn.textContent = old), 1500);
    };
  });
}

// ---------- Bindings ----------
document.addEventListener("DOMContentLoaded", () => {
  renderExamples();

  // Mode tabs
  document.getElementById("modeCreateTab").onclick = () => setMode("create");
  document.getElementById("modeImproveTab").onclick = () => setMode("improve");

  // Improve mode inputs
  const improvePromptEl = document.getElementById("improvePrompt");
  const improveResponseEl = document.getElementById("improveResponse");
  const improveBtn = document.getElementById("improveBtn");

  const refreshImproveBtn = () => {
    improveBtn.disabled = state.improvePrompt.trim().length < 5;
  };
  improvePromptEl.addEventListener("input", (e) => {
    state.improvePrompt = e.target.value;
    refreshImproveBtn();
  });
  improveResponseEl.addEventListener("input", (e) => {
    state.improveResponse = e.target.value;
  });
  improveBtn.onclick = () => {
    renderImproveResult();
    showStep("improveResult");
  };
  document.getElementById("improveRestartBtn").onclick = () => {
    state.improvePrompt = "";
    state.improveResponse = "";
    improvePromptEl.value = "";
    improveResponseEl.value = "";
    refreshImproveBtn();
    showStep("improve");
  };
  document.getElementById("goal").addEventListener("input", (e) => {
    state.goal = e.target.value;
    refreshNextButtons();
  });

  document.getElementById("context").addEventListener("input", (e) => {
    state.context = e.target.value;
  });

  document.getElementById("coachMode").addEventListener("change", (e) => {
    state.coach = e.target.checked;
  });

  document.querySelectorAll("#taskTypeGroup .pill").forEach((btn) => {
    btn.onclick = () => {
      state.taskType = btn.dataset.value;
      document.querySelectorAll("#taskTypeGroup .pill").forEach((b) =>
        b.classList.toggle("selected", b === btn)
      );
      refreshNextButtons();
    };
  });

  document.querySelectorAll("#sizeGroup .pill").forEach((btn) => {
    btn.onclick = () => {
      state.size = btn.dataset.value;
      document.querySelectorAll("#sizeGroup .pill").forEach((b) =>
        b.classList.toggle("selected", b === btn)
      );
      refreshNextButtons();
    };
  });

  document.querySelectorAll(".nextBtn").forEach((b) => (b.onclick = goNext));
  document.querySelectorAll(".prevBtn").forEach((b) => (b.onclick = goPrev));

  document.getElementById("generateBtn").onclick = () => {
    renderResult();
    showStep("result");
  };

  const restart = () => {
    state.step = 1;
    state.goal = "";
    state.taskType = "";
    state.size = "";
    state.context = "";
    state.coach = true;
    document.getElementById("goal").value = "";
    document.getElementById("context").value = "";
    document.getElementById("coachMode").checked = true;
    document.querySelectorAll(".pill").forEach((b) => b.classList.remove("selected"));
    refreshNextButtons();
    showStep(1);
  };

  document.getElementById("restartBtn").onclick = restart;
  document.getElementById("resetBtn").onclick = restart;

  refreshNextButtons();
});
