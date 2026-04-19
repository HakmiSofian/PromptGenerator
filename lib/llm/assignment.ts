import { isAnthropicConfigured } from "@/lib/llm/providers/anthropic";
import { isOpenAIConfigured } from "@/lib/llm/providers/openai";
import { isGoogleConfigured } from "@/lib/llm/providers/google";
import type { UserApiKeys } from "@/lib/types";

export type Provider = "anthropic" | "openai" | "google";
export type Role = "analyst" | "writer" | "critic";

export type ProvidersStatus = {
  anthropic: boolean;
  openai: boolean;
  google: boolean;
};

export function getProvidersStatus(userKeys?: UserApiKeys): ProvidersStatus {
  return {
    anthropic: isAnthropicConfigured(userKeys?.anthropic),
    openai: isOpenAIConfigured(userKeys?.openai),
    google: isGoogleConfigured(userKeys?.google),
  };
}

export function anyProviderConfigured(userKeys?: UserApiKeys): boolean {
  const s = getProvidersStatus(userKeys);
  return s.anthropic || s.openai || s.google;
}

/**
 * Picks the best provider for each role based on available keys.
 *  - Analyst: cheapest first.
 *  - Writer: Claude Sonnet by default (strong on structured French).
 *  - Critic: a DIFFERENT family than the writer for independent review.
 */
export function pickProvider(role: Role, userKeys?: UserApiKeys): Provider {
  const s = getProvidersStatus(userKeys);

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
    const writer = pickProvider("writer", userKeys);
    if (writer !== "openai" && s.openai) return "openai";
    if (writer !== "google" && s.google) return "google";
    if (writer !== "anthropic" && s.anthropic) return "anthropic";
    if (s.anthropic) return "anthropic";
    if (s.openai) return "openai";
    if (s.google) return "google";
  }

  return "anthropic";
}

export const PROVIDER_LABEL: Record<Provider, string> = {
  anthropic: "Claude",
  openai: "GPT",
  google: "Gemini",
};
