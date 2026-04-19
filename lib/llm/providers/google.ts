import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Role } from "@/lib/llm/assignment";

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
}): Promise<string | null> {
  const apiKey = resolveGoogleKey(params.apiKey);
  if (!apiKey) return null;

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: MODEL_BY_ROLE[params.role],
    systemInstruction: params.systemPrompt,
    generationConfig: { responseMimeType: "application/json" },
  });

  const result = await model.generateContent(params.userMessage);
  return result.response.text() ?? null;
}
