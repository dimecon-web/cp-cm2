"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { config } from "@/lib/config";
import { loadGuest } from "@/lib/store";

// Porte d'entrée du site privé : rien n'est visible sans lien d'invitation.
// Chaque foyer reçoit un lien /i/<token> personnel.
export default function Landing() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const go = async (e) => {
    e.preventDefault();
    const token = code.trim().toLowerCase();
    if (!token) return;
    setChecking(true);
    setError("");
    try {
      const { household } = await loadGuest(token);
      if (household) {
        router.push(`/i/${token}`);
      } else {
        setError("Code inconnu — vérifiez votre invitation ou écrivez-nous.");
      }
    } catch {
      setError("Impossible de vérifier le code pour l'instant. Réessayez dans un instant.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="landing">
      <div className="monogram">{config.initials}</div>
      <h1>{config.coupleNames}</h1>
      <p style={{ color: "var(--muted)", maxWidth: "44ch" }}>
        Ce site est privé : il est réservé aux invités du mariage.
        Utilisez le lien personnel reçu par email ou WhatsApp — ou saisissez
        le code qui figure sur votre invitation.
      </p>
      <form onSubmit={go} style={{ display: "flex", gap: 10, marginTop: 10, width: "min(360px, 100%)" }}>
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(""); }}
          placeholder="Code d'invitation"
          aria-label="Code d'invitation"
        />
        <button className="btn" type="submit" disabled={checking}>
          {checking ? "…" : "Entrer"}
        </button>
      </form>
      {error && (
        <p style={{ color: "var(--danger)", fontSize: 14, marginTop: 10 }}>{error}</p>
      )}
      <p style={{ marginTop: 34, fontSize: 13, color: "var(--muted)" }}>
        <a href="/admin">Espace organisateurs</a>
      </p>
    </div>
  );
}
