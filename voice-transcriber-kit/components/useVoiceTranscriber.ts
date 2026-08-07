"use client";

import { useCallback, useRef, useState } from "react";

export type TranscriberStatus = "idle" | "recording" | "transcribing";

export interface UseVoiceTranscriberOptions {
  /** Appelé avec le texte transcrit à la fin de chaque enregistrement. */
  onText: (text: string) => void;
  /** Code langue ISO-639-1 passé à Whisper (améliore nettement la précision). */
  language?: string;
  onError?: (message: string) => void;
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  // webm/opus partout sauf Safari, qui enregistre en mp4/aac.
  return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((t) =>
    MediaRecorder.isTypeSupported(t),
  );
}

/**
 * Enregistre le micro via MediaRecorder puis envoie l'audio à
 * POST /api/transcribe et renvoie le texte via `onText`.
 */
export function useVoiceTranscriber({
  onText,
  language = "fr",
  onError,
}: UseVoiceTranscriberOptions) {
  const [status, setStatus] = useState<TranscriberStatus>("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const fail = useCallback(
    (message: string) => {
      setStatus("idle");
      onError?.(message);
    },
    [onError],
  );

  const start = useCallback(async () => {
    if (recorderRef.current) return;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      fail("Accès au micro refusé");
      return;
    }

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      recorderRef.current = null;
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      chunksRef.current = [];
      if (blob.size === 0) {
        fail("Aucun audio capté");
        return;
      }

      setStatus("transcribing");
      const form = new FormData();
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      form.append("audio", blob, `dictation.${ext}`);
      form.append("language", language);
      try {
        const res = await fetch("/api/transcribe", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        setStatus("idle");
        if (data.text) onText(data.text);
      } catch (err) {
        fail(err instanceof Error ? err.message : "Échec de la transcription");
      }
    };

    recorderRef.current = recorder;
    recorder.start();
    setStatus("recording");
  }, [fail, language, onText]);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  const toggle = useCallback(() => {
    if (status === "recording") stop();
    else if (status === "idle") void start();
  }, [status, start, stop]);

  return { status, start, stop, toggle };
}
