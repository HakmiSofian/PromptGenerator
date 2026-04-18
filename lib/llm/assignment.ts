import { getProvidersStatus } from "@/lib/llm/orchestrator";

export type Provider = "anthropic" | "openai" | "google";
export type Role = "analyst" | "writer" | "critic";

/**
 * Picks the best provider for each role based on available keys.
 *
 * Rationale:
 *  - Analyst: cheapest first (Haiku > Gemini Flash > GPT mini).
 *  - Writer: Claude Sonnet is strongest on structured French output.
 *  - Critic: pick a DIFFERENT family from the writer so the critique
 *    isn't self-review. Falls back to the same family if no other is set.
 */
export function pickProvider(role: Role): Provider {
  const s = getProvidersStatus();

  if (role === "analyst") {
    if (s.anthropic) return "anthropic";
    if (s.google) return "google";
    if (s.openai) return "openai";
  }

  if (role === "writer") {
    if (s.anthropic) return "anthropic";
    if (s.openai) return "openai";
    if (s.google) return "google";
  }

  if (role === "critic") {
    // Prefer a different family than the writer for independence.
    const writer = pickProvider("writer");
    if (writer !== "openai" && s.openai) return "openai";
    if (writer !== "google" && s.google) return "google";
    if (writer !== "anthropic" && s.anthropic) return "anthropic";
    // Only one family available: fall back to the strongest of it.
    if (s.anthropic) return "anthropic";
    if (s.openai) return "openai";
    if (s.google) return "google";
  }

  return "anthropic";
}

export function committeeIsDiverse(): boolean {
  const used = new Set([
    pickProvider("analyst"),
    pickProvider("writer"),
    pickProvider("critic"),
  ]);
  return used.size > 1;
}

export const PROVIDER_LABEL: Record<Provider, string> = {
  anthropic: "Claude",
  openai: "GPT",
  google: "Gemini",
};
