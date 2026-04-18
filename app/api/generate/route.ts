import { NextResponse } from "next/server";
import { GenerateRequest } from "@/lib/types";
import { anyProviderConfigured, generate } from "@/lib/llm/orchestrator";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = GenerateRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Requête invalide", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await generate(parsed.data);
    return NextResponse.json({
      ...result,
      providersConfigured: anyProviderConfigured(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
