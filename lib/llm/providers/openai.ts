import OpenAI from "openai";

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function callOpenAI(params: {
  model?: string;
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
}): Promise<string | null> {
  if (!isOpenAIConfigured()) return null;

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: params.model ?? "gpt-4.1-mini",
    max_tokens: params.maxTokens ?? 2048,
    messages: [
      { role: "system", content: params.systemPrompt },
      { role: "user", content: params.userMessage },
    ],
  });

  return completion.choices[0]?.message?.content ?? null;
}
