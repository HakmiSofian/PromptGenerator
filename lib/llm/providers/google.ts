import { GoogleGenerativeAI } from "@google/generative-ai";

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_API_KEY);
}

export async function callGoogle(params: {
  model?: string;
  systemPrompt: string;
  userMessage: string;
}): Promise<string | null> {
  if (!isGoogleConfigured()) return null;

  const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);
  const model = client.getGenerativeModel({
    model: params.model ?? "gemini-2.5-pro",
    systemInstruction: params.systemPrompt,
  });

  const result = await model.generateContent(params.userMessage);
  return result.response.text() ?? null;
}
