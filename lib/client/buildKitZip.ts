import JSZip from "jszip";
import type { CreateResult } from "@/lib/types";

const PROVIDER_LABEL: Record<string, string> = {
  anthropic: "Claude",
  openai: "GPT",
  google: "Gemini",
};

function followupsToMarkdown(followups: CreateResult["followups"]): string {
  const head =
    "# Prompts de suivi\n\nCopie celui qui correspond à ce que tu veux faire ensuite, remplace les parties entre [ ] si besoin, puis colle-le dans Claude Code.\n\n";
  const body = followups
    .map((f, i) => `## ${i + 1}. ${f.title}\n\n${f.body}`)
    .join("\n\n---\n\n");
  return head + body + "\n";
}

function readmeMarkdown(result: CreateResult): string {
  const { model, howto, providersUsed, source } = result;

  const providersLine = providersUsed
    ? Object.entries(providersUsed)
        .filter(([, v]) => v)
        .map(
          ([role, p]) =>
            `- **${role}** : ${PROVIDER_LABEL[p as string] ?? p}`
        )
        .join("\n")
    : "_(moteur de templates local)_";

  return `# Kit Claude Code

Ce dossier contient tout ce dont tu as besoin pour démarrer avec Claude Code sur ton projet.

## 📦 Contenu

- \`CLAUDE.md\` — la mémoire de ton projet. Place-la à la racine, Claude Code la lira à chaque session.
- \`prompt-initial.md\` — le prompt à envoyer en premier.
- \`prompts-de-suivi.md\` — des prompts à réutiliser au fil du travail.
- \`README.md\` — ce fichier.

## 🧠 Modèle recommandé

**${model.primary}** · ${model.reason}

Commande à taper dans Claude Code : \`${model.switchCmd}\`

## 🚀 Comment utiliser

${howto}

## 🤖 Source de génération

${source === "llm" ? "Ce kit a été produit par un comité multi-IA :" : "Ce kit a été produit par le moteur de templates local."}

${providersLine}

---

Généré par **Prompt Kit pour Claude Code**.
`;
}

function sanitizeFilename(name: string): string {
  const trimmed = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
  return trimmed || "kit";
}

export async function buildKitZip(
  result: CreateResult,
  titleHint = "kit-claude-code"
): Promise<{ blob: Blob; filename: string }> {
  const zip = new JSZip();
  zip.file("CLAUDE.md", result.claudeMd);
  zip.file("prompt-initial.md", result.initialPrompt);
  zip.file("prompts-de-suivi.md", followupsToMarkdown(result.followups));
  zip.file("README.md", readmeMarkdown(result));

  const blob = await zip.generateAsync({ type: "blob" });
  const date = new Date().toISOString().slice(0, 10);
  const filename = `${sanitizeFilename(titleHint)}-${date}.zip`;
  return { blob, filename };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
