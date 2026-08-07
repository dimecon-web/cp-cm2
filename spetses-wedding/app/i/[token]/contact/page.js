"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { config } from "@/lib/config";
import { useT } from "@/lib/i18n";
import { sendMessage } from "@/lib/store";

export default function ContactPage() {
  const { token } = useParams();
  const t = useT();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await sendMessage(token, form);
      setSent(true);
      setForm({ name: "", email: "", message: "" });
    } catch {
      setError("L'envoi a échoué. Réessayez dans un instant.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="narrow" style={{ margin: "0 auto" }}>
      <h1>{t("contact.title")}</h1>
      <p style={{ color: "var(--muted)" }}>{t("contact.intro")}</p>

      {/* Le lien du groupe WhatsApp apparaît dès qu'il est renseigné dans lib/config.js */}
      {config.whatsappGroupUrl ? (
        <a className="btn secondary" href={config.whatsappGroupUrl} target="_blank" rel="noreferrer"
          style={{ marginBottom: 20 }}>
          💬 {t("contact.whatsappJoin")}
        </a>
      ) : (
        <div className="notice info">💬 {t("contact.whatsappSoon")}</div>
      )}

      {sent && <div className="notice ok" role="status">{t("contact.sent")}</div>}
      {error && <div className="notice" role="alert">{error}</div>}

      <form className="card" onSubmit={submit}>
        <label className="field">
          <span className="lbl">{t("contact.name")}</span>
          <input type="text" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="field">
          <span className="lbl">{t("contact.email")}</span>
          <input type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="field">
          <span className="lbl">{t("contact.message")}</span>
          <textarea rows={5} required value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </label>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "…" : t("contact.send")}
        </button>
      </form>
    </div>
  );
}
