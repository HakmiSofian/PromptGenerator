"use client";

import { useEffect, useRef, useState } from "react";
import {
  useKitHistory,
  formatRelativeTime,
  type HistoryEntry,
} from "@/lib/client/useKitHistory";
import { formatUsd } from "@/lib/llm/pricing";

export default function HistoryDrawer({
  onRestore,
  registerSave,
}: {
  onRestore: (entry: HistoryEntry) => void;
  registerSave: (
    fn: (e: Omit<HistoryEntry, "id" | "createdAt">) => HistoryEntry
  ) => void;
}) {
  const { entries, hydrated, save, remove, clear } = useKitHistory();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerSave(save);
  }, [registerSave, save]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!hydrated) return null;

  const totalSpent = entries.reduce(
    (sum, e) => sum + (e.result.cost?.totalUsd ?? 0),
    0
  );

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-700 transition"
        aria-label="Ouvrir l'historique"
      >
        📚 Historique
        {entries.length > 0 && (
          <span className="ml-1.5 inline-block bg-indigo-100 text-indigo-700 rounded-full px-1.5 min-w-[18px] text-center font-semibold">
            {entries.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[70vh] overflow-y-auto bg-white rounded-xl shadow-lg border border-slate-200 z-20">
          <div className="flex items-center justify-between p-3 border-b border-slate-100">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-800">
                Kits récents
              </span>
              {totalSpent > 0 && (
                <span className="text-[11px] text-slate-500 mt-0.5">
                  Dépensé au total : {formatUsd(totalSpent)}
                </span>
              )}
            </div>
            {entries.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("Vider tout l'historique local ?")) {
                    clear();
                    setOpen(false);
                  }
                }}
                className="text-xs text-slate-500 hover:text-rose-600"
              >
                Tout effacer
              </button>
            )}
          </div>

          {entries.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              Aucun kit sauvegardé pour l&apos;instant.
              <br />
              Génère un premier kit, il apparaîtra ici.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {entries.map((e) => (
                <li key={e.id} className="flex items-start gap-2 p-3 hover:bg-slate-50">
                  <button
                    className="flex-1 text-left"
                    onClick={() => {
                      onRestore(e);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none">
                        {e.mode === "create" ? "✨" : "🔧"}
                      </span>
                      <span className="text-sm font-medium text-slate-900 line-clamp-2">
                        {e.title}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {formatRelativeTime(e.createdAt)} ·{" "}
                      {e.result.source === "llm" ? "multi-IA" : "template"}
                    </div>
                  </button>
                  <button
                    onClick={() => remove(e.id)}
                    className="text-slate-400 hover:text-rose-500 text-sm leading-none mt-1 px-1"
                    aria-label="Supprimer"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
