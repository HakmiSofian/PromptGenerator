// Prompt Kit pour Claude Code — logique MVP
// Tout est local, aucune requête externe.

const state = {
  step: 1,
  goal: "",
  taskType: "",
  size: "",
  context: "",
  coach: true,
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

// ---------- Bindings ----------
document.addEventListener("DOMContentLoaded", () => {
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
