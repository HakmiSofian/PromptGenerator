import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Role } from "@/lib/llm/assignment";
import type { LlmResponse } from "./anthropic";

const MODEL_BY_ROLE: Record<Role, string> = {
  analyst: "gemini-2.0-flash",
  writer: "gemini-2.5-pro",
  critic: "gemini-2.5-pro",
};

export function resolveGoogleKey(userKey?: string): string | null {
  return userKey?.trim() || process.env.GOOGLE_API_KEY || null;
}

export function isGoogleConfigured(userKey?: string): boolean {
  return Boolean(resolveGoogleKey(userKey));
}

export async function callGoogle(params: {
  role: Role;
  systemPrompt: string;
  userMessage: string;
  apiKey?: string;
}): Promise<LlmResponse | null> {
  const apiKey = resolveGoogleKey(params.apiKey);
  if (!apiKey) return null;

  const model = MODEL_BY_ROLE[params.role];
  const client = new GoogleGenerativeAI(apiKey);
  const genModel = client.getGenerativeModel({
    model,
    systemInstruction: params.systemPrompt,
    generationConfig: { responseMimeType: "application/json" },
  });

  const result = await genModel.generateContent(params.userMessage);
  const usage = result.response.usageMetadata;
  return {
    text: result.response.text() ?? "",
    inputTokens: usage?.promptTokenCount ?? 0,
    outputTokens: usage?.candidatesTokenCount ?? 0,
    model,
  };
}
