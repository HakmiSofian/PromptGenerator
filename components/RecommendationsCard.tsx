"use client";

import { useMemo } from "react";
import type { CreateResult } from "@/lib/types";
import { recommendForCreate, type Recommendation } from "@/lib/client/recommendations";

const KIND_META: Record<
  Recommendation["kind"],
  { label: string; bg: string; text: string }
> = {
  mcp: { label: "MCP", bg: "bg-purple-100", text: "text-purple-800" },
  subagent: { label: "Sous-agent", bg: "bg-sky-100", text: "text-sky-800" },
  skill: { label: "Skill", bg: "bg-emerald-100", text: "text-emerald-800" },
  command: { label: "Commande", bg: "bg-amber-100", text: "text-amber-800" },
};

export default function RecommendationsCard({
  result,
}: {
  result: CreateResult;
}) {
  const items = useMemo(() => recommendForCreate(result), [result]);
  if (items.length === 0) return null;

  return (
    <div className="mb-6 p-4 rounded-lg border border-slate-200 bg-white">
      <h3 className="font-semibold mb-1">🧰 Pour aller plus loin</h3>
      <p className="text-xs text-slate-500 mb-3">
        Suggestions de commandes Claude Code, MCP servers et sous-agents adaptés à ce kit.
      </p>
      <ul className="space-y-2">
        {items.map((r) => {
          const meta = KIND_META[r.kind];
          return (
            <li
              key={r.id}
              className="flex gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50"
            >
              <span
                className={`text-[10px] uppercase tracking-wide font-semibold rounded px-1.5 h-fit mt-0.5 ${meta.bg} ${meta.text}`}
              >
                {meta.label}
              </span>
              <div className="flex-1">
                <div className="font-medium text-sm">{r.label}</div>
                <p className="text-sm text-slate-600 mt-0.5">{r.detail}</p>
                {r.install && (
                  <code className="inline-block mt-1.5 text-xs bg-slate-900 text-slate-100 rounded px-2 py-0.5">
                    {r.install}
                  </code>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
