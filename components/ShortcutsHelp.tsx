"use client";

import { useEffect, useState } from "react";

type Shortcut = { keys: string[]; description: string };

const SHORTCUTS: Shortcut[] = [
  { keys: ["⌘/Ctrl", "1"], description: "Onglet « Créer un kit »" },
  { keys: ["⌘/Ctrl", "2"], description: "Onglet « Améliorer un prompt »" },
  { keys: ["⌘/Ctrl", "3"], description: "Onglet « Auditer mon projet »" },
  { keys: ["⌘/Ctrl", "Enter"], description: "Lancer la génération" },
  { keys: ["?"], description: "Afficher cette aide" },
  { keys: ["Esc"], description: "Fermer une fenêtre" },
];

export default function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const inField =
        tag === "input" || tag === "textarea" || target?.isContentEditable;

      if (e.key === "?" && !inField) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Raccourcis clavier (?)"
        aria-label="Raccourcis clavier"
        className="fixed bottom-4 right-4 z-30 text-xs px-3 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow hover:border-indigo-400 transition no-print"
      >
        ⌨️
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-semibold">⌨️ Raccourcis clavier</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl leading-none px-1"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>
            <ul className="p-4 space-y-2">
              {SHORTCUTS.map((s) => (
                <li
                  key={s.description}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-slate-700 dark:text-slate-300">
                    {s.description}
                  </span>
                  <span className="flex gap-1">
                    {s.keys.map((k) => (
                      <kbd
                        key={k}
                        className="px-2 py-0.5 text-[11px] font-mono bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded"
                      >
                        {k}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
