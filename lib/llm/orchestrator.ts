import {
  buildCreateResultFromTemplates,
  buildImproveResultFromTemplates,
  recommendModel,
} from "@/lib/prompts/templates";
import type {
  CreateRequest,
  ImproveRequest,
  GenerateResult,
  ModelRecommendation,
  CreateResult,
  ImproveResult,
} from "@/lib/types";
import { isAnthropicConfigured } from "@/lib/llm/providers/anthropic";
import { isOpenAIConfigured } from "@/lib/llm/providers/openai";
import { isGoogleConfigured } from "@/lib/llm/providers/google";
import {
  runAnalystCreate,
  runWriterCreate,
  runCriticCreate,
  runAnalystImprove,
  runWriterImprove,
  type AnalystCreateOutput,
} from "@/lib/llm/chain";

export function anyProviderConfigured(): boolean {
  return (
    isAnthropicConfigured() || isOpenAIConfigured() || isGoogleConfigured()
  );
}

export type ProvidersStatus = {
  anthropic: boolean;
  openai: boolean;
  google: boolean;
};

export function getProvidersStatus(): ProvidersStatus {
  return {
    anthropic: isAnthropicConfigured(),
    openai: isOpenAIConfigured(),
    google: isGoogleConfigured(),
  };
}

export type StreamEvent =
  | { type: "status"; message: string }
  | {
      type: "role-start";
      role: "analyst" | "writer" | "critic";
      label: string;
    }
  | {
      type: "role-complete";
      role: "analyst" | "writer" | "critic";
    }
  | { type: "warning"; message: string }
  | { type: "result"; result: GenerateResult }
  | { type: "error"; message: string };

export type Emit = (event: StreamEvent) => void;

export async function streamGenerate(
  req: CreateRequest | ImproveRequest,
  emit: Emit
): Promise<void> {
  if (!isAnthropicConfigured()) {
    emit({
      type: "status",
      message:
        "Aucune clé API configurée — génération via le moteur de templates local.",
    });
    const result = fallback(req);
    emit({ type: "result", result });
    return;
  }

  try {
    if (req.mode === "create") {
      const result = await runCreateChain(req, emit);
      emit({ type: "result", result });
    } else {
      const result = await runImproveChain(req, emit);
      emit({ type: "result", result });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    emit({
      type: "warning",
      message: `Chaîne multi-IA interrompue (${message}). Bascule sur le moteur de templates.`,
    });
    const result = fallback(req);
    emit({ type: "result", result });
  }
}

async function runCreateChain(
  req: CreateRequest,
  emit: Emit
): Promise<CreateResult> {
  emit({
    type: "role-start",
    role: "analyst",
    label: "🔍 L'analyste extrait les specs…",
  });
  const specs = await runAnalystCreate(req);
  emit({ type: "role-complete", role: "analyst" });

  emit({
    type: "role-start",
    role: "writer",
    label: "✍️ Le rédacteur écrit le kit…",
  });
  const draft = await runWriterCreate(req, specs);
  emit({ type: "role-complete", role: "writer" });

  emit({
    type: "role-start",
    role: "critic",
    label: "🔎 Le critique relit et corrige…",
  });
  const final = await runCriticCreate(req, specs, draft);
  emit({ type: "role-complete", role: "critic" });

  return {
    mode: "create",
    source: "llm",
    model: modelFromAnalyst(specs, req),
    claudeMd: final.claudeMd,
    initialPrompt: final.initialPrompt,
    followups: final.followups,
    howto: final.howto,
  };
}

async function runImproveChain(
  req: ImproveRequest,
  emit: Emit
): Promise<ImproveResult> {
  emit({
    type: "role-start",
    role: "analyst",
    label: "🩺 L'analyste diagnostique le prompt…",
  });
  const diagnosis = await runAnalystImprove(req);
  emit({ type: "role-complete", role: "analyst" });

  emit({
    type: "role-start",
    role: "writer",
    label: "✨ Le rédacteur réécrit le prompt…",
  });
  const rewritten = await runWriterImprove(req, diagnosis);
  emit({ type: "role-complete", role: "writer" });

  return {
    mode: "improve",
    source: "llm",
    issues: diagnosis.issues,
    improvedPrompt: rewritten.improvedPrompt,
  };
}

function modelFromAnalyst(
  specs: AnalystCreateOutput,
  req: CreateRequest
): ModelRecommendation {
  const templateFallback = recommendModel(req.taskType, req.size);
  return {
    primary: specs.recommendedModel || templateFallback.primary,
    strategy: specs.recommendedStrategy || templateFallback.strategy,
    reason: specs.modelRationale || templateFallback.reason,
    switchCmd: specs.switchCmd || templateFallback.switchCmd,
  };
}

function fallback(req: CreateRequest | ImproveRequest): GenerateResult {
  if (req.mode === "create") return buildCreateResultFromTemplates(req);
  return buildImproveResultFromTemplates(req);
}
