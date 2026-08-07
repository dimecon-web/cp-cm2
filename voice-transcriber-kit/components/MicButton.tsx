"use client";

import { useState } from "react";
import { useVoiceTranscriber } from "./useVoiceTranscriber";

export interface MicButtonProps {
  /** Reçoit le texte dicté — typiquement pour l'ajouter à un champ contrôlé. */
  onText: (text: string) => void;
  language?: string;
  className?: string;
}

/**
 * Bouton micro façon FluidVoice : un clic pour dicter, un clic pour arrêter.
 *
 *   const [note, setNote] = useState("");
 *   <textarea value={note} onChange={(e) => setNote(e.target.value)} />
 *   <MicButton onText={(t) => setNote((v) => (v ? v + " " : "") + t)} />
 */
export function MicButton({ onText, language = "fr", className }: MicButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const { status, toggle } = useVoiceTranscriber({
    onText,
    language,
    onError: setError,
  });

  const label =
    status === "recording"
      ? "Arrêter la dictée"
      : status === "transcribing"
        ? "Transcription en cours…"
        : "Dicter au micro";

  return (
    <button
      type="button"
      onClick={() => {
        setError(null);
        toggle();
      }}
      disabled={status === "transcribing"}
      aria-label={label}
      title={error ?? label}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: error ? "2px solid #EF4444" : "2px solid #d1d5db",
        background: status === "recording" ? "#EF4444" : "#f9fafb",
        cursor: status === "transcribing" ? "wait" : "pointer",
        fontSize: 18,
        animation: status === "recording" ? "mic-pulse 1s infinite alternate" : undefined,
      }}
    >
      {status === "recording" ? "⏹" : status === "transcribing" ? "⏳" : "🎤"}
      <style>{`@keyframes mic-pulse { from { transform: scale(1); } to { transform: scale(1.12); } }`}</style>
    </button>
  );
}
