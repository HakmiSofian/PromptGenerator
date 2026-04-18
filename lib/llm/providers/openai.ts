import OpenAI from "openai";
import type { Role } from "@/lib/llm/assignment";

const MODEL_BY_ROLE: Record<Role, string> = {
  analyst: "gpt-4.1-mini",
  writer: "gpt-4.1",
  critic: "gpt-4.1",
};

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function callOpenAI(params: {
  role: Role;
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
}): Promise<string | null> {
  if (!isOpenAIConfigured()) return null;

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: MODEL_BY_ROLE[params.role],
    max_tokens: params.maxTokens ?? 2048,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: params.systemPrompt },
      { role: "user", content: params.userMessage },
    ],
  });

  return completion.choices[0]?.message?.content ?? null;
}
