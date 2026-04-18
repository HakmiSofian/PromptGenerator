import { callAnthropic } from "@/lib/llm/providers/anthropic";
import { extractJson } from "@/lib/llm/json";
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

export type CriticCreateOutput = WriterCreateOutput & {
  issues: Issue[];
};

export type AnalystImproveOutput = {
  issues: Issue[];
  rootCause: string;
  suggestedApproach: string;
  missingContext: string[];
};

export type WriterImproveOutput = {
  improvedPrompt: string;
};

export async function runAnalystCreate(
  req: CreateRequest
): Promise<AnalystCreateOutput> {
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

  const raw = await callAnthropic({
    role: "analyst",
    systemPrompt: ANALYST_SYSTEM_PROMPT,
    userMessage,
    maxTokens: 1200,
  });
  if (!raw) throw new Error("Analyste : aucune réponse");
  return extractJson<AnalystCreateOutput>(raw);
}

export async function runWriterCreate(
  req: CreateRequest,
  specs: AnalystCreateOutput
): Promise<WriterCreateOutput> {
  const userMessage = JSON.stringify(
    { originalRequest: req, specsFromAnalyst: specs },
    null,
    2
  );

  const raw = await callAnthropic({
    role: "writer",
    systemPrompt: WRITER_SYSTEM_PROMPT,
    userMessage,
    maxTokens: 4096,
  });
  if (!raw) throw new Error("Rédacteur : aucune réponse");
  return extractJson<WriterCreateOutput>(raw);
}

export async function runCriticCreate(
  req: CreateRequest,
  specs: AnalystCreateOutput,
  draft: WriterCreateOutput
): Promise<CriticCreateOutput> {
  const userMessage = JSON.stringify(
    {
      originalRequest: req,
      specsFromAnalyst: specs,
      draftFromWriter: draft,
    },
    null,
    2
  );

  const raw = await callAnthropic({
    role: "critic",
    systemPrompt: CRITIC_SYSTEM_PROMPT,
    userMessage,
    maxTokens: 4096,
  });
  if (!raw) throw new Error("Critique : aucune réponse");
  return extractJson<CriticCreateOutput>(raw);
}

export async function runAnalystImprove(
  req: ImproveRequest
): Promise<AnalystImproveOutput> {
  const userMessage = JSON.stringify(
    {
      originalPrompt: req.prompt,
      claudeResponse: req.response ?? "",
    },
    null,
    2
  );

  const raw = await callAnthropic({
    role: "analyst",
    systemPrompt: IMPROVE_ANALYST_SYSTEM_PROMPT,
    userMessage,
    maxTokens: 1500,
  });
  if (!raw) throw new Error("Analyste : aucune réponse");
  return extractJson<AnalystImproveOutput>(raw);
}

export async function runWriterImprove(
  req: ImproveRequest,
  diagnosis: AnalystImproveOutput
): Promise<WriterImproveOutput> {
  const userMessage = JSON.stringify(
    { originalPrompt: req.prompt, diagnosisFromAnalyst: diagnosis },
    null,
    2
  );

  const raw = await callAnthropic({
    role: "writer",
    systemPrompt: IMPROVE_WRITER_SYSTEM_PROMPT,
    userMessage,
    maxTokens: 2048,
  });
  if (!raw) throw new Error("Rédacteur : aucune réponse");
  return extractJson<WriterImproveOutput>(raw);
}
