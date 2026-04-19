"use client";

import { useEffect, useState } from "react";
import { useByokKeys, maskKey } from "@/lib/client/useByokKeys";
import type { UserApiKeys } from "@/lib/types";

export default function ByokSettings({
  onChange,
}: {
  onChange?: (keys: UserApiKeys, hasAny: boolean) => void;
}) {
  const { keys, hydrated, hasAny, update, clear } = useByokKeys();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<UserApiKeys>({});

  useEffect(() => {
    onChange?.(keys, hasAny);
  }, [keys, hasAny, onChange]);

  useEffect(() => {
    if (open) setDraft(keys);
  }, [open, keys]);

  if (!hydrated) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-xs px-3 py-1.5 rounded-full border transition ${
          hasAny
            ? "bg-indigo-50 border-indigo-200 text-indigo-800 hover:border-indigo-400"
            : "bg-white border-slate-200 text-slate-700 hover:border-indigo-400 hover:text-indigo-700"
        }`}
        aria-label="Mes clés API"
        title="Utiliser mes propres clés API"
      >
        🔑 Mes clés {hasAny && <span className="ml-1 font-semibold">·{countKeys(keys)}</span>}
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg">
            <div className="p-5 border-b border-slate-100 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Mes clés API</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Colle tes propres clés pour utiliser ta facturation plutôt que la nôtre.
                  Les clés restent <strong>dans ton navigateur</strong> et sont envoyées au serveur uniquement au moment des appels IA.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl leading-none px-1"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4">
              <KeyField
                label="Anthropic (Claude)"
                placeholder="sk-ant-…"
                helper="console.anthropic.com/settings/keys"
                value={draft.anthropic ?? ""}
                saved={keys.anthropic}
                onChange={(v) => setDraft((d) => ({ ...d, anthropic: v }))}
              />
              <KeyField
                label="OpenAI (GPT)"
                placeholder="sk-…"
                helper="platform.openai.com/api-keys"
                value={draft.openai ?? ""}
                saved={keys.openai}
                onChange={(v) => setDraft((d) => ({ ...d, openai: v }))}
              />
              <KeyField
                label="Google (Gemini)"
                placeholder="AIza…"
                helper="aistudio.google.com/apikey"
                value={draft.google ?? ""}
                saved={keys.google}
                onChange={(v) => setDraft((d) => ({ ...d, google: v }))}
              />

              <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
                ⚠️ Une clé API donne un accès facturé à ton compte. Ne la partage jamais. Tu peux la révoquer à tout moment depuis la console du provider.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => {
                  if (confirm("Supprimer toutes les clés locales ?")) {
                    clear();
                    setDraft({});
                    setOpen(false);
                  }
                }}
                className="text-xs text-slate-500 hover:text-rose-600"
                disabled={!hasAny}
              >
                Tout effacer
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="text-sm px-3 py-1.5 text-slate-600 hover:text-slate-900"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    update(draft);
                    setOpen(false);
                  }}
                  className="text-sm px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function countKeys(k: UserApiKeys): number {
  return [k.anthropic, k.openai, k.google].filter(Boolean).length;
}

function KeyField({
  label,
  placeholder,
  helper,
  value,
  saved,
  onChange,
}: {
  label: string;
  placeholder: string;
  helper: string;
  value: string;
  saved?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="flex items-center justify-between text-sm font-medium text-slate-800 mb-1">
        <span>{label}</span>
        {saved && (
          <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
            saved · {maskKey(saved)}
          </span>
        )}
      </label>
      <input
        type="password"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div className="text-[11px] text-slate-400 mt-1">{helper}</div>
    </div>
  );
}
