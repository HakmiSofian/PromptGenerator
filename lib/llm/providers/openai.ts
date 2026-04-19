import OpenAI from "openai";
import type { Role } from "@/lib/llm/assignment";
import type { LlmResponse } from "./anthropic";

const MODEL_BY_ROLE: Record<Role, string> = {
  analyst: "gpt-4.1-mini",
  writer: "gpt-4.1",
  critic: "gpt-4.1",
};

export function resolveOpenAIKey(userKey?: string): string | null {
  return userKey?.trim() || process.env.OPENAI_API_KEY || null;
}

export function isOpenAIConfigured(userKey?: string): boolean {
  return Boolean(resolveOpenAIKey(userKey));
}

export async function callOpenAI(params: {
  role: Role;
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  apiKey?: string;
}): Promise<LlmResponse | null> {
  const apiKey = resolveOpenAIKey(params.apiKey);
  if (!apiKey) return null;

  const model = MODEL_BY_ROLE[params.role];
  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model,
    max_tokens: params.maxTokens ?? 2048,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: params.systemPrompt },
      { role: "user", content: params.userMessage },
    ],
  });

  return {
    text: completion.choices[0]?.message?.content ?? "",
    inputTokens: completion.usage?.prompt_tokens ?? 0,
    outputTokens: completion.usage?.completion_tokens ?? 0,
    model,
  };
}
