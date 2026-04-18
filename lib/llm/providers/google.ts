import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Role } from "@/lib/llm/assignment";

const MODEL_BY_ROLE: Record<Role, string> = {
  analyst: "gemini-2.0-flash",
  writer: "gemini-2.5-pro",
  critic: "gemini-2.5-pro",
};

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_API_KEY);
}

export async function callGoogle(params: {
  role: Role;
  systemPrompt: string;
  userMessage: string;
}): Promise<string | null> {
  if (!isGoogleConfigured()) return null;

  const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);
  const model = client.getGenerativeModel({
    model: MODEL_BY_ROLE[params.role],
    systemInstruction: params.systemPrompt,
    generationConfig: { responseMimeType: "application/json" },
  });

  const result = await model.generateContent(params.userMessage);
  return result.response.text() ?? null;
}
