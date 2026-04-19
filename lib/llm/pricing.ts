// USD per 1M tokens. Approximate, public list prices (avr. 2026).
// If a model isn't listed, cost is reported as 0 with `unknown: true`.
export const PRICING: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-opus-4-7": { input: 15, output: 75 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4.1": { input: 2, output: 8 },
  "gemini-2.0-flash": { input: 0.075, output: 0.3 },
  "gemini-2.5-pro": { input: 1.25, output: 5 },
};

export function computeCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number
): { costUsd: number; unknown: boolean } {
  const rate = PRICING[model];
  if (!rate) return { costUsd: 0, unknown: true };
  const cost =
    (inputTokens / 1_000_000) * rate.input +
    (outputTokens / 1_000_000) * rate.output;
  return { costUsd: cost, unknown: false };
}

export function formatUsd(costUsd: number): string {
  if (costUsd === 0) return "0 $";
  if (costUsd < 0.01) return `< 0,01 $`;
  if (costUsd < 1) return `${costUsd.toFixed(2).replace(".", ",")} $`;
  return `${costUsd.toFixed(2).replace(".", ",")} $`;
}
