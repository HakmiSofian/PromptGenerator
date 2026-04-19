import type { CreateResult } from "@/lib/types";

export type Recommendation = {
  kind: "mcp" | "subagent" | "skill" | "command";
  id: string;
  label: string;
  detail: string;
  install?: string;
};

const ALL: (Recommendation & { matches: (text: string) => boolean })[] = [
  {
    kind: "subagent",
    id: "plan-mode",
    label: "Mode plan",
    detail:
      "Force Claude à proposer une stratégie avant d'écrire la moindre ligne. Indispensable pour les tâches non triviales.",
    install: "/plan",
    matches: () => true,
  },
  {
    kind: "subagent",
    id: "explore",
    label: "Sous-agent Explore",
    detail:
      "Délègue l'exploration de la base de code à un sous-agent dédié. Économise ton contexte principal.",
    install: "Use the Explore agent",
    matches: (t) =>
      /(comprend|explor|legacy|grand projet|gros projet|repo|explore)/.test(t),
  },
  {
    kind: "mcp",
    id: "mcp-github",
    label: "MCP GitHub",
    detail:
      "Permet à Claude Code de lire issues, pull requests, et de pousser des branches sans quitter la conversation.",
    install: "claude mcp add github",
    matches: (t) =>
      /(github|repo|pull request|pr|issue|déployer|deploy)/.test(t),
  },
  {
    kind: "mcp",
    id: "mcp-filesystem",
    label: "MCP Filesystem",
    detail:
      "Donne à Claude un accès lecture/écriture contrôlé à des dossiers en dehors du répertoire courant.",
    install: "claude mcp add filesystem",
    matches: (t) =>
      /(plusieurs dossiers|fichier excel|csv|exports|importer)/.test(t),
  },
  {
    kind: "mcp",
    id: "mcp-postgres",
    label: "MCP Postgres",
    detail:
      "Connecte Claude Code à ta base Postgres pour interroger le schéma, écrire des requêtes ou des migrations.",
    install: "claude mcp add postgres",
    matches: (t) =>
      /(base de donn|database|postgres|sql|requête|query|migration)/.test(t),
  },
  {
    kind: "mcp",
    id: "mcp-puppeteer",
    label: "MCP Puppeteer / Playwright",
    detail:
      "Pour automatiser un navigateur (scraping, tests end-to-end, captures d'écran).",
    install: "claude mcp add puppeteer",
    matches: (t) =>
      /(scrap|navigateur|browser|e2e|capture|screenshot|automatis)/.test(t),
  },
  {
    kind: "mcp",
    id: "mcp-slack",
    label: "MCP Slack",
    detail:
      "Pour envoyer ou lire des messages Slack depuis Claude Code (bots internes, alertes).",
    install: "claude mcp add slack",
    matches: (t) => /(slack|bot interne|notification équipe)/.test(t),
  },
  {
    kind: "command",
    id: "compact",
    label: "Commande /compact",
    detail:
      "Avant que la conversation devienne trop longue, demande à Claude de résumer ce qui a été fait.",
    install: "/compact",
    matches: (t) => /(gros projet|long|plusieurs sessions|énorme)/.test(t),
  },
  {
    kind: "command",
    id: "model-switch",
    label: "Bascule de modèle",
    detail:
      "Change de modèle au cours de la session selon la tâche : Opus pour planifier, Sonnet pour exécuter, Haiku pour les questions rapides.",
    install: "/model sonnet",
    matches: () => true,
  },
];

export function recommendForCreate(result: CreateResult): Recommendation[] {
  const text = (
    (result.claudeMd || "") +
    " " +
    (result.initialPrompt || "")
  ).toLowerCase();

  const picks: Recommendation[] = [];
  for (const r of ALL) {
    if (r.matches(text)) {
      picks.push({
        kind: r.kind,
        id: r.id,
        label: r.label,
        detail: r.detail,
        install: r.install,
      });
    }
  }

  // Cap at 5 to avoid noise; always keep "plan" first if present
  return picks.slice(0, 5);
}
