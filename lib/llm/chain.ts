import { callAnthropic, type LlmResponse } from "@/lib/llm/providers/anthropic";
import { callOpenAI } from "@/lib/llm/providers/openai";
import { callGoogle } from "@/lib/llm/providers/google";
import { extractJson } from "@/lib/llm/json";
import { pickProvider, type Provider, type Role } from "@/lib/llm/assignment";
import { computeCostUsd } from "@/lib/llm/pricing";
import {
  ANALYST_SYSTEM_PROMPT,
  IMPROVE_ANALYST_SYSTEM_PROMPT,
} from "@/lib/prompts/analyst";
import {
  WRITER_SYSTEM_PROMPT,
  IMPROVE_WRITER_SYSTEM_PROMPT,
} from "@/lib/prompts/writer";
import { CRITIC_SYSTEM_PROMPT } from "@/lib/prompts/critic";
import type {
  CreateRequest,
  ImproveRequest,
  Followup,
  Issue,
  ModelRecommendation,
  UserApiKeys,
} from "@/lib/types";

export type AnalystCreateOutput = {
  normalizedGoal: string;
  detectedTaskType: CreateRequest["taskType"];
  detectedSize: CreateRequest["size"];
  inferredStack: string[];
  missingInfo: string[];
  ambiguities: string[];
  risks: string[];
  recommendedModel: string;
  recommendedStrategy: ModelRecommendation["strategy"];
  modelRationale: string;
  switchCmd: string;
};

export type WriterCreateOutput = {
  claudeMd: string;
  initialPrompt: string;
  followups: Followup[];
  howto: string;
};

export type CriticCreateOutput = WriterCreateOutput & { issues: Issue[] };

export type AnalystImproveOutput = {
  issues: Issue[];
  rootCause: string;
  suggestedApproach: string;
  missingContext: string[];
};

export type WriterImproveOutput = { improvedPrompt: string };

export type RoleUsage = {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  model: string;
};

export type RoleRun<T> = {
  output: T;
  provider: Provider;
  usage: RoleUsage;
};

async function callLlm(params: {
  role: Role;
  provider: Provider;
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  userKeys?: UserApiKeys;
}): Promise<LlmResponse | null> {
  if (params.provider === "anthropic")
    return callAnthropic({
      role: params.role,
      systemPrompt: params.systemPrompt,
      userMessage: params.userMessage,
      maxTokens: params.maxTokens,
      apiKey: params.userKeys?.anthropic,
    });
  if (params.provider === "openai")
    return callOpenAI({
      role: params.role,
      systemPrompt: params.systemPrompt,
      userMessage: params.userMessage,
      maxTokens: params.maxTokens,
      apiKey: params.userKeys?.openai,
    });
  if (params.provider === "google")
    return callGoogle({
      role: params.role,
      systemPrompt: params.systemPrompt,
      userMessage: params.userMessage,
      apiKey: params.userKeys?.google,
    });
  return null;
}

async function runRole<T>(
  role: Role,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  userKeys?: UserApiKeys
): Promise<RoleRun<T>> {
  const provider = pickProvider(role, userKeys);
  const raw = await callLlm({
    role,
    provider,
    systemPrompt,
    userMessage,
    maxTokens,
    userKeys,
  });
  if (!raw || !raw.text)
    throw new Error(`${role} (${provider}) : aucune réponse`);
  const { costUsd } = computeCostUsd(
    raw.model,
    raw.inputTokens,
    raw.outputTokens
  );
  return {
    output: extractJson<T>(raw.text),
    provider,
    usage: {
      inputTokens: raw.inputTokens,
      outputTokens: raw.outputTokens,
      costUsd,
      model: raw.model,
    },
  };
}

function stripKeys<T extends { userKeys?: unknown }>(req: T): Omit<T, "userKeys"> {
  const { userKeys: _removed, ...rest } = req;
  return rest;
}

export async function runAnalystCreate(req: CreateRequest) {
  const userMessage = JSON.stringify(
    {
      goalFromUser: req.goal,
      declaredTaskType: req.taskType,
      declaredSize: req.size,
      contextFromUser: req.context ?? "",
    },
    null,
    2
  );
  return runRole<AnalystCreateOutput>(
    "analyst",
    ANALYST_SYSTEM_PROMPT,
    userMessage,
    1200,
    req.userKeys
  );
}

export async function runWriterCreate(
  req: CreateRequest,
  specs: AnalystCreateOutput
) {
  const userMessage = JSON.stringify(
    { originalRequest: stripKeys(req), specsFromAnalyst: specs },
    null,
    2
  );
  return runRole<WriterCreateOutput>(
    "writer",
    WRITER_SYSTEM_PROMPT,
    userMessage,
    4096,
    req.userKeys
  );
}

export async function runCriticCreate(
  req: CreateRequest,
  specs: AnalystCreateOutput,
  draft: WriterCreateOutput
) {
  const userMessage = JSON.stringify(
    {
      originalRequest: stripKeys(req),
      specsFromAnalyst: specs,
      draftFromWriter: draft,
    },
    null,
    2
  );
  return runRole<CriticCreateOutput>(
    "critic",
    CRITIC_SYSTEM_PROMPT,
    userMessage,
    4096,
    req.userKeys
  );
}

export async function runAnalystImprove(req: ImproveRequest) {
  const userMessage = JSON.stringify(
    { originalPrompt: req.prompt, claudeResponse: req.response ?? "" },
    null,
    2
  );
  return runRole<AnalystImproveOutput>(
    "analyst",
    IMPROVE_ANALYST_SYSTEM_PROMPT,
    userMessage,
    1500,
    req.userKeys
  );
}

export async function runWriterImprove(
  req: ImproveRequest,
  diagnosis: AnalystImproveOutput
) {
  const userMessage = JSON.stringify(
    { originalPrompt: req.prompt, diagnosisFromAnalyst: diagnosis },
    null,
    2
  );
  return runRole<WriterImproveOutput>(
    "writer",
    IMPROVE_WRITER_SYSTEM_PROMPT,
    userMessage,
    2048,
    req.userKeys
  );
}
