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
  const analyst = await runAnalystCreate(req);
  emit({ type: "role-complete", role: "analyst" });

  emit({
    type: "role-start",
    role: "writer",
    label: "✍️ Le rédacteur écrit le kit…",
  });
  const writer = await runWriterCreate(req, analyst.output);
  emit({ type: "role-complete", role: "writer" });

  emit({
    type: "role-start",
    role: "critic",
    label: "🔎 Le critique relit et corrige…",
  });
  const critic = await runCriticCreate(req, analyst.output, writer.output);
  emit({ type: "role-complete", role: "critic" });

  return {
    mode: "create",
    source: "llm",
    model: modelFromAnalyst(analyst.output, req),
    claudeMd: critic.output.claudeMd,
    initialPrompt: critic.output.initialPrompt,
    followups: critic.output.followups,
    howto: critic.output.howto,
    providersUsed: {
      analyst: analyst.provider,
      writer: writer.provider,
      critic: critic.provider,
    },
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
  const analyst = await runAnalystImprove(req);
  emit({ type: "role-complete", role: "analyst" });

  emit({
    type: "role-start",
    role: "writer",
    label: "✨ Le rédacteur réécrit le prompt…",
  });
  const writer = await runWriterImprove(req, analyst.output);
  emit({ type: "role-complete", role: "writer" });

  return {
    mode: "improve",
    source: "llm",
    issues: analyst.output.issues,
    improvedPrompt: writer.output.improvedPrompt,
    providersUsed: {
      analyst: analyst.provider,
      writer: writer.provider,
    },
  };
}

function modelFromAnalyst(
  specs: AnalystCreateOutput,
  req: CreateRequest
): ModelRecommendation {
  const templateFallback = recommendModel(req.taskType, req.size);
  const allowedStrategies: ModelRecommendation["strategy"][] = [
    "solo",
    "solo-with-plan",
    "advisor",
  ];
  const strategy = allowedStrategies.includes(specs.recommendedStrategy)
    ? specs.recommendedStrategy
    : templateFallback.strategy;
  return {
    primary: specs.recommendedModel || templateFallback.primary,
    strategy,
    reason: specs.modelRationale || templateFallback.reason,
    switchCmd: specs.switchCmd || templateFallback.switchCmd,
  };
}

function fallback(req: CreateRequest | ImproveRequest): GenerateResult {
  if (req.mode === "create") return buildCreateResultFromTemplates(req);
  return buildImproveResultFromTemplates(req);
}
