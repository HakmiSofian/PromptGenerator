import type { GenerateResult } from "@/lib/types";

const HASH_PREFIX = "#k=";
const VERSION = 1;

type SharedKit = {
  v: number;
  result: GenerateResult;
};

function toBase64Url(str: string): string {
  if (typeof btoa === "function") {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  return Buffer.from(str, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(b64: string): string {
  const padded = b64.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  const fullPadded = padded + "=".repeat(padLen);
  if (typeof atob === "function") {
    return decodeURIComponent(escape(atob(fullPadded)));
  }
  return Buffer.from(fullPadded, "base64").toString("utf-8");
}

export function buildShareUrl(result: GenerateResult, baseUrl?: string): string {
  const payload: SharedKit = { v: VERSION, result };
  const encoded = toBase64Url(JSON.stringify(payload));
  const base =
    baseUrl ??
    (typeof window !== "undefined"
      ? window.location.origin + window.location.pathname
      : "");
  return `${base}${HASH_PREFIX}${encoded}`;
}

export function readSharedFromHash(): GenerateResult | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (!hash || !hash.startsWith(HASH_PREFIX)) return null;
  const encoded = hash.slice(HASH_PREFIX.length);
  if (!encoded) return null;
  try {
    const json = fromBase64Url(encoded);
    const parsed = JSON.parse(json) as SharedKit;
    if (!parsed || parsed.v !== VERSION || !parsed.result) return null;
    return parsed.result;
  } catch {
    return null;
  }
}

export function clearShareHash() {
  if (typeof window === "undefined") return;
  if (window.history?.replaceState) {
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search
    );
  } else {
    window.location.hash = "";
  }
}
