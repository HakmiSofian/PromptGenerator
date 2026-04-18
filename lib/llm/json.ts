/**
 * Extract a JSON object from an LLM response.
 * Handles common patterns:
 *  - raw JSON ({ ... })
 *  - JSON wrapped in ```json ... ``` fences
 *  - JSON preceded by a short preamble
 */
export function extractJson<T = unknown>(raw: string): T {
  const trimmed = raw.trim();

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1].trim()) as T;
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as T;
  }

  return JSON.parse(trimmed) as T;
}
