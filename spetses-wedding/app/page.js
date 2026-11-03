"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { config } from "@/lib/config";
import { useT, useLang, LangSwitcher } from "@/lib/i18n";
import { enterPortal } from "@/lib/store";

// Portail des invités. Une adresse email et le mot de passe de l'invitation
// suffisent : l'adresse connue ramène à sa réponse, l'adresse inconnue ouvre
// une réponse vierge. Personne n'a de code personnel à retenir.
export default function Portal() {
  const router = useRouter();
  const t = useT();
  const { lang } = useLang();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const go = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await enterPortal({ email, code, lang });
      if (res.token) {
        router.push(`/i/${res.token}/rsvp`);
        return;
      }
      setError(
        res.error === "bad_code" ? t("portal.badCode")
        : res.error === "bad_email" ? t("portal.badEmail")
        : t("portal.failed")
      );
    } catch {
      setError(t("portal.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="landing">
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <LangSwitcher />
      </div>

      <div className="monogram">{config.initials}</div>
      <h1>{config.coupleNames}</h1>
      <p style={{ color: "var(--muted)", maxWidth: "46ch" }}>{t("portal.intro")}</p>

      <form onSubmit={go} style={{ display: "grid", gap: 10, marginTop: 10, width: "min(360px, 100%)" }}>
        <input type="email" value={email} required autoComplete="email"
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          placeholder={t("portal.email")} aria-label={t("portal.email")} />
        <input type="text" value={code} required
          onChange={(e) => { setCode(e.target.value); setError(""); }}
          placeholder={t("portal.code")} aria-label={t("portal.code")} />
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "…" : t("portal.enter")}
        </button>
      </form>

      <p className="hint" style={{ marginTop: 10 }}>{t("portal.codeHint")}</p>
      {error && <p style={{ color: "var(--danger)", fontSize: 14, marginTop: 10 }}>{error}</p>}

      <p style={{ marginTop: 34, fontSize: 13, color: "var(--muted)" }}>
        <a href="/admin">{t("landing.organisers")}</a>
      </p>
    </div>
  );
}
