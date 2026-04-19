import Anthropic from "@anthropic-ai/sdk";
import type { Role } from "@/lib/llm/assignment";

const MODEL_BY_ROLE: Record<Role, string> = {
  analyst: "claude-haiku-4-5-20251001",
  writer: "claude-sonnet-4-6",
  critic: "claude-opus-4-7",
};

export type LlmResponse = {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
};

export function resolveAnthropicKey(userKey?: string): string | null {
  return userKey?.trim() || process.env.ANTHROPIC_API_KEY || null;
}

export function isAnthropicConfigured(userKey?: string): boolean {
  return Boolean(resolveAnthropicKey(userKey));
}

export async function callAnthropic(params: {
  role: Role;
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  apiKey?: string;
}): Promise<LlmResponse | null> {
  const apiKey = resolveAnthropicKey(params.apiKey);
  if (!apiKey) return null;

  const model = MODEL_BY_ROLE[params.role];
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model,
    max_tokens: params.maxTokens ?? 2048,
    system: params.systemPrompt,
    messages: [{ role: "user", content: params.userMessage }],
  });

  const block = response.content.find((b) => b.type === "text");
  const text = block && block.type === "text" ? block.text : "";
  return {
    text,
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
    model,
  };
}
