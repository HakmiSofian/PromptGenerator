import {
  buildCreateResultFromTemplates,
  buildImproveResultFromTemplates,
} from "@/lib/prompts/templates";
import type {
  CreateRequest,
  ImproveRequest,
  GenerateResult,
} from "@/lib/types";
import { isAnthropicConfigured } from "@/lib/llm/providers/anthropic";
import { isOpenAIConfigured } from "@/lib/llm/providers/openai";
import { isGoogleConfigured } from "@/lib/llm/providers/google";

export function anyProviderConfigured(): boolean {
  return (
    isAnthropicConfigured() || isOpenAIConfigured() || isGoogleConfigured()
  );
}

/**
 * Orchestrateur multi-LLM (Phase 2+).
 * Tant qu'aucune clé n'est configurée, on retourne un résultat produit par
 * le moteur de templates local. Quand les clés arriveront, on branchera ici
 * la chaîne ANALYSTE -> RÉDACTEUR -> CRITIQUE.
 */
export async function generate(
  req: CreateRequest | ImproveRequest
): Promise<GenerateResult> {
  if (!anyProviderConfigured()) {
    return fallback(req);
  }

  // TODO Phase 2 : analyst(req) -> writer(specs) -> critic(draft)
  // TODO Phase 3 : multi-providers (Claude, GPT, Gemini) avec rôles dédiés
  return fallback(req);
}

function fallback(req: CreateRequest | ImproveRequest): GenerateResult {
  if (req.mode === "create") return buildCreateResultFromTemplates(req);
  return buildImproveResultFromTemplates(req);
}
