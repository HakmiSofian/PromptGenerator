"use client";

import type {
  Progress,
  RoleStatus,
  RoleKey,
} from "@/lib/client/useGenerateStream";

const ROLE_META: Record<
  RoleKey,
  {
    emoji: string;
    createLabel: string;
    improveLabel: string;
    auditLabel: string;
  }
> = {
  analyst: {
    emoji: "🔍",
    createLabel: "Analyse du besoin",
    improveLabel: "Diagnostic du prompt",
    auditLabel: "",
  },
  writer: {
    emoji: "✍️",
    createLabel: "Rédaction du kit",
    improveLabel: "Réécriture du prompt",
    auditLabel: "",
  },
  critic: {
    emoji: "🔎",
    createLabel: "Relecture & correction",
    improveLabel: "",
    auditLabel: "",
  },
  auditor: {
    emoji: "🩺",
    createLabel: "",
    improveLabel: "",
    auditLabel: "Audit du projet",
  },
  doctor: {
    emoji: "💊",
    createLabel: "",
    improveLabel: "",
    auditLabel: "Prescription du traitement",
  },
};

export default function GenerationProgress({
  progress,
  mode,
}: {
  progress: Progress;
  mode: "create" | "improve" | "audit";
}) {
  if (!progress.active && !progress.warning && !progress.statusMessage) {
    return null;
  }

  const visibleRoles: RoleKey[] =
    mode === "create"
      ? ["analyst", "writer", "critic"]
      : mode === "improve"
        ? ["analyst", "writer"]
        : ["auditor", "doctor"];

  return (
    <div className="my-6 p-4 rounded-lg border border-indigo-200 bg-indigo-50">
      {progress.statusMessage && (
        <p className="text-sm text-slate-700 mb-3">{progress.statusMessage}</p>
      )}

      <ul className="space-y-2">
        {visibleRoles.map((role) => {
          const status = progress.roles[role];
          const meta = ROLE_META[role];
          const label =
            mode === "create"
              ? meta.createLabel
              : mode === "improve"
                ? meta.improveLabel
                : meta.auditLabel;
          return (
            <li key={role} className="flex items-center gap-3 text-sm">
              <StatusDot status={status} />
              <span
                className={
                  status === "running"
                    ? "font-medium text-indigo-900"
                    : status === "done"
                      ? "text-slate-500 line-through"
                      : "text-slate-500"
                }
              >
                {meta.emoji} {label}
              </span>
            </li>
          );
        })}
      </ul>

      {progress.warning && (
        <p className="text-xs text-amber-800 mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
          ⚠️ {progress.warning}
        </p>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: RoleStatus }) {
  if (status === "running") {
    return (
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600" />
      </span>
    );
  }
  if (status === "done") {
    return <span className="text-emerald-600 text-sm">✓</span>;
  }
  return <span className="inline-block h-3 w-3 rounded-full bg-slate-300" />;
}
