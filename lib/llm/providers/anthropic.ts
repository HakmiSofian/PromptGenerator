import Anthropic from "@anthropic-ai/sdk";
import type { Role } from "@/lib/llm/assignment";

const MODEL_BY_ROLE: Record<Role, string> = {
  analyst: "claude-haiku-4-5-20251001",
  writer: "claude-sonnet-4-6",
  critic: "claude-opus-4-7",
};

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function callAnthropic(params: {
  role: Role;
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
}): Promise<string | null> {
  if (!isAnthropicConfigured()) return null;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: MODEL_BY_ROLE[params.role],
    max_tokens: params.maxTokens ?? 2048,
    system: params.systemPrompt,
    messages: [{ role: "user", content: params.userMessage }],
  });

  const block = response.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text : null;
}
