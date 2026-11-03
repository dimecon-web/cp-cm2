"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { config } from "@/lib/config";
import { useT, LangSwitcher } from "@/lib/i18n";
import { loadGuest } from "@/lib/store";

// Porte d'entrée du site privé : rien n'est visible sans lien d'invitation.
// Chaque foyer reçoit un lien /i/<token> personnel.
export default function Landing() {
  const router = useRouter();
  const t = useT();
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
      if (household) router.push(`/i/${token}`);
      else setError(t("landing.unknownCode"));
    } catch {
      setError(t("errors.check"));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="landing">
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <LangSwitcher />
      </div>

      <div className="monogram">{config.initials}</div>
      <h1>{config.coupleNames}</h1>
      <p style={{ color: "var(--muted)", maxWidth: "46ch" }}>{t("landing.private")}</p>

      <form onSubmit={go} style={{ display: "flex", gap: 10, marginTop: 10, width: "min(360px, 100%)" }}>
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(""); }}
          placeholder={t("landing.codeLabel")}
          aria-label={t("landing.codeLabel")}
        />
        <button className="btn" type="submit" disabled={checking}>
          {checking ? "…" : t("landing.enter")}
        </button>
      </form>

      {error && <p style={{ color: "var(--danger)", fontSize: 14, marginTop: 10 }}>{error}</p>}

      <p style={{ marginTop: 34, fontSize: 13, color: "var(--muted)" }}>
        <a href="/admin">{t("landing.organisers")}</a>
      </p>
    </div>
  );
}
