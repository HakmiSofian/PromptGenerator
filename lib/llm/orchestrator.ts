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
  UserApiKeys,
} from "@/lib/types";
import { isAnthropicConfigured } from "@/lib/llm/providers/anthropic";
import {
  getProvidersStatus as assignmentStatus,
  anyProviderConfigured as assignmentAny,
  type ProvidersStatus,
} from "@/lib/llm/assignment";
import { getCached, isCacheConfigured, setCached } from "@/lib/llm/cache";
import {
  runAnalystCreate,
  runWriterCreate,
  runCriticCreate,
  runAnalystImprove,
  runWriterImprove,
  type AnalystCreateOutput,
} from "@/lib/llm/chain";

export type { ProvidersStatus } from "@/lib/llm/assignment";

export function getProvidersStatus(
  userKeys?: UserApiKeys
): ProvidersStatus {
  return assignmentStatus(userKeys);
}

export function anyProviderConfigured(userKeys?: UserApiKeys): boolean {
  return assignmentAny(userKeys);
}

export type StreamEvent =
  | { type: "status"; message: string }
  | { type: "cache-hit"; message: string }
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
  const userKeys = req.userKeys;

  if (!isAnthropicConfigured(userKeys?.anthropic)) {
    emit({
      type: "status",
      message:
        "Aucune clé API configurée — génération via le moteur de templates local.",
    });
    const result = fallback(req);
    emit({ type: "result", result });
    return;
  }

  // Cache key omits the userKeys (security) — we only hash the semantic part.
  const cacheKey = semanticRequest(req);
  if (isCacheConfigured()) {
    const cached = await getCached<GenerateResult>(cacheKey);
    if (cached) {
      emit({
        type: "cache-hit",
        message: "⚡ Cache hit · résultat instantané (0 appel IA, 0 € dépensé)",
      });
      const overridden = {
        ...cached,
        cost: { totalUsd: 0, inputTokens: 0, outputTokens: 0, cached: true },
      } as GenerateResult;
      emit({ type: "result", result: overridden });
      return;
    }
  }

  try {
    if (req.mode === "create") {
      const result = await runCreateChain(req, emit);
      await setCached(cacheKey, result);
      emit({ type: "result", result });
    } else {
      const result = await runImproveChain(req, emit);
      await setCached(cacheKey, result);
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
    cost: sumCost([analyst.usage, writer.usage, critic.usage]),
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
    cost: sumCost([analyst.usage, writer.usage]),
  };
}

function sumCost(
  usages: { inputTokens: number; outputTokens: number; costUsd: number }[]
) {
  return {
    totalUsd: usages.reduce((s, u) => s + u.costUsd, 0),
    inputTokens: usages.reduce((s, u) => s + u.inputTokens, 0),
    outputTokens: usages.reduce((s, u) => s + u.outputTokens, 0),
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

/**
 * Strip userKeys before hashing for cache so different users with different
 * keys share the same cached kit for the same semantic request.
 */
function semanticRequest(req: CreateRequest | ImproveRequest): unknown {
  const clone: Record<string, unknown> = { ...(req as Record<string, unknown>) };
  delete clone.userKeys;
  return clone;
}
