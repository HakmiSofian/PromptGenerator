"use client";

import { useState } from "react";
import type { GenerateResult } from "@/lib/types";
import { feedbackKeyOf, useFeedback, type Rating } from "@/lib/client/useFeedback";

export default function FeedbackBar({ result }: { result: GenerateResult }) {
  const key = feedbackKeyOf(result);
  const { current, hydrated, set, clear } = useFeedback(key);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");

  if (!hydrated) return null;

  const onRate = (r: Rating) => {
    if (current?.rating === r) {
      clear();
      return;
    }
    set(r, current?.note);
    if (r === "down" && !current?.note) {
      setShowNote(true);
      setNote(current?.note ?? "");
    }
  };

  const saveNote = () => {
    if (!current) {
      set("down", note);
    } else {
      set(current.rating, note || undefined);
    }
    setShowNote(false);
  };

  return (
    <div className="mt-8 p-4 rounded-lg border border-slate-200 bg-slate-50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-slate-700">
          <span className="font-medium">Ce kit t&apos;a aidé ?</span>
          <span className="text-slate-500 ml-1.5">
            Ton retour reste local — on ne le voit jamais.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onRate("up")}
            aria-label="Satisfait"
            className={`text-sm px-3 py-1.5 rounded-lg border transition ${
              current?.rating === "up"
                ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300"
            }`}
          >
            👍 Utile
          </button>
          <button
            onClick={() => onRate("down")}
            aria-label="Pas satisfait"
            className={`text-sm px-3 py-1.5 rounded-lg border transition ${
              current?.rating === "down"
                ? "bg-rose-100 border-rose-300 text-rose-800"
                : "bg-white border-slate-200 text-slate-600 hover:border-rose-300"
            }`}
          >
            👎 Décevant
          </button>
          <button
            onClick={() => {
              setShowNote((v) => !v);
              setNote(current?.note ?? "");
            }}
            className="text-xs text-slate-500 hover:text-indigo-700 ml-1"
          >
            ✏️ Note
          </button>
        </div>
      </div>

      {(showNote || (current?.note && !showNote)) && (
        <div className="mt-3">
          {showNote ? (
            <>
              <textarea
                rows={2}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Qu'est-ce qui aurait pu être mieux ? (gardé sur ton appareil)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowNote(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 px-2"
                >
                  Annuler
                </button>
                <button
                  onClick={saveNote}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-1"
                >
                  Enregistrer la note
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-600 italic">
              📝 « {current?.note} »
            </p>
          )}
        </div>
      )}
    </div>
  );
}
