import { Redis } from "@upstash/redis";
import crypto from "node:crypto";

const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 jours
const KEY_PREFIX = "kit:v1";

export function isCacheConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

function getClient(): Redis | null {
  if (!isCacheConfigured()) return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL as string,
    token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
  });
}

/**
 * Deterministic stringification so two semantically identical requests
 * (different key order, no extra whitespace) produce the same hash.
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map(stableStringify).join(",") + "]";
  }
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return (
    "{" +
    keys
      .map(
        (k) =>
          JSON.stringify(k) +
          ":" +
          stableStringify((value as Record<string, unknown>)[k])
      )
      .join(",") +
    "}"
  );
}

export function hashRequest(req: unknown): string {
  const normalized = stableStringify(req);
  return crypto
    .createHash("sha256")
    .update(normalized)
    .digest("hex")
    .slice(0, 32);
}

export async function getCached<T>(req: unknown): Promise<T | null> {
  const client = getClient();
  if (!client) return null;
  try {
    return (await client.get(`${KEY_PREFIX}:${hashRequest(req)}`)) as T | null;
  } catch {
    return null;
  }
}

export async function setCached(
  req: unknown,
  value: unknown,
  ttlSec: number = TTL_SECONDS
): Promise<void> {
  const client = getClient();
  if (!client) return;
  try {
    await client.set(`${KEY_PREFIX}:${hashRequest(req)}`, value, {
      ex: ttlSec,
    });
  } catch {
    // ignore: cache write failure shouldn't break the response
  }
}
