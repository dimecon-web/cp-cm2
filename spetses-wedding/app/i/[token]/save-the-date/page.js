"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { config } from "@/lib/config";
import { useT, usePick, useLang } from "@/lib/i18n";
import { loadGuest, saveSaveDate, emptySaveDate } from "@/lib/store";

// Premier questionnaire, envoyé avec le save the date. Volontairement court :
// on demande une intention et des ordres de grandeur, pas un engagement.
// La réponse ferme, nominative, viendra plus tard avec l'invitation (RSVP).
export default function SaveTheDatePage() {
  const { token } = useParams();
  const t = useT();
  const pick = usePick();
  const { lang } = useLang();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGuest(token)
      .then(({ household, rsvp }) => {
        if (cancelled) return;
        const base = emptySaveDate();
        setForm({
          ...base,
          firstName: rsvp?.respondentFirstName || "",
          lastName: rsvp?.respondentLastName || "",
          intent: rsvp?.intent || null,
          adults: rsvp?.adults ?? "",
          children: rsvp?.children ?? "",
          arrival: rsvp?.arrival || "",
          departure: rsvp?.departure || "",
          notes: rsvp?.notes || "",
          // Le carnet d'adresses connaît déjà l'un des deux contacts.
          email: rsvp?.email || household?.email || "",
          phone: rsvp?.phone || household?.phone || "",
          intentAt: rsvp?.intentAt || null,
        });
      })
      .catch(() => { if (!cancelled) setForm(emptySaveDate()); });
    return () => { cancelled = true; };
  }, [token]);

  if (!form) return null;

  const locale = lang === "en" ? "en-GB" : lang === "el" ? "el-GR" : "fr-FR";
  const weddingStr = new Date(config.weddingDate).toLocaleDateString(locale, {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const deadlineStr = new Date(config.rsvpDeadline).toLocaleDateString(locale, {
    day: "numeric", month: "long", year: "numeric",
  });

  const set = (patch) => { setForm((f) => ({ ...f, ...patch })); setSaved(false); setError(""); };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.intent) { setError(t("saveDate.required")); return; }
    if (!form.email.trim() && !form.phone.trim()) { setError(t("rsvp.contactRequired")); return; }
    setBusy(true);
    try {
      await saveSaveDate(token, form);
      setSaved(true);
    } catch {
      setError(t("errors.save"));
    } finally {
      setBusy(false);
    }
  };

  const coming = form.intent && form.intent !== "no";

  return (
    <div className="narrow" style={{ margin: "0 auto" }}>
      <h1>{t("saveDate.title")}</h1>
      <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontStyle: "italic", fontSize: 18 }}>
        {weddingStr} · {pick(config.location)}
      </p>
      <p style={{ color: "var(--muted)" }}>{t("saveDate.intro")}</p>

      {saved && <div className="notice ok" role="status">{t("saveDate.saved")}</div>}
      {error && <div className="notice" role="alert">{error}</div>}

      <form onSubmit={submit}>
        <div className="card">
          <h3>{t("saveDate.who")}</h3>
          <p className="hint" style={{ marginTop: -4, marginBottom: 12 }}>{t("saveDate.whoHint")}</p>
          <div className="grid-2">
            <label className="field">
              <span className="lbl">{t("rsvp.firstName")}</span>
              <input type="text" value={form.firstName} onChange={(e) => set({ firstName: e.target.value })} required />
            </label>
            <label className="field">
              <span className="lbl">{t("rsvp.lastName")}</span>
              <input type="text" value={form.lastName} onChange={(e) => set({ lastName: e.target.value })} required />
            </label>
          </div>
        </div>

        <div className="card">
          <h3>{t("saveDate.intentQ")}</h3>
          <div className="choice-row">
            {[
              ["yes", t("saveDate.iYes")],
              ["probably", t("saveDate.iProbably")],
              ["unsure", t("saveDate.iUnsure")],
              ["no", t("saveDate.iNo")],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`choice ${form.intent === value ? "sel" : ""}`}
                aria-pressed={form.intent === value}
                onClick={() => set({ intent: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {coming && (
          <>
            <div className="card">
              <h3>{t("saveDate.howMany")}</h3>
              <p className="hint" style={{ marginTop: -4, marginBottom: 12 }}>{t("saveDate.howManyHint")}</p>
              <div className="grid-2">
                <label className="field">
                  <span className="lbl">{t("saveDate.adults")}</span>
                  <input type="number" min="0" max="50" inputMode="numeric"
                    value={form.adults} onChange={(e) => set({ adults: e.target.value })} />
                </label>
                <label className="field">
                  <span className="lbl">{t("saveDate.children")}</span>
                  <input type="number" min="0" max="50" inputMode="numeric"
                    value={form.children} onChange={(e) => set({ children: e.target.value })} />
                  <div className="hint">{t("saveDate.childrenHint")}</div>
                </label>
              </div>
            </div>

            <div className="card">
              <h3>{t("saveDate.dates")}</h3>
              <p className="hint" style={{ marginTop: -4, marginBottom: 12 }}>{t("saveDate.datesHint")}</p>
              <div className="grid-2">
                <label className="field">
                  <span className="lbl">{t("saveDate.arrival")}</span>
                  <input type="date" value={form.arrival} onChange={(e) => set({ arrival: e.target.value })} />
                </label>
                <label className="field">
                  <span className="lbl">{t("saveDate.departure")}</span>
                  <input type="date" value={form.departure} onChange={(e) => set({ departure: e.target.value })} />
                </label>
              </div>
            </div>
          </>
        )}

        <div className="card">
          <h3>{t("rsvp.contact")}</h3>
          <p className="hint" style={{ marginTop: -4, marginBottom: 12 }}>{t("rsvp.contactHint")}</p>
          <div className="grid-2">
            <label className="field">
              <span className="lbl">{t("rsvp.emailLabel")}</span>
              <input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
            </label>
            <label className="field">
              <span className="lbl">{t("rsvp.phoneLabel")}</span>
              <input type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
            </label>
          </div>
        </div>

        <div className="card">
          <h3>{t("saveDate.notes")}</h3>
          <p className="hint" style={{ marginTop: -4, marginBottom: 12 }}>{t("saveDate.notesHint")}</p>
          <textarea rows={3} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
        </div>

        <button className="btn" type="submit" disabled={busy}>
          {busy ? t("saveDate.saving") : t("saveDate.save")}
        </button>
      </form>

      <p className="hint" style={{ marginTop: 22 }}>
        {t("saveDate.later")} {deadlineStr}.
      </p>
      <p style={{ marginTop: 10, fontSize: 14 }}>
        <Link href={`/i/${token}/rsvp`}>{t("saveDate.toRsvp")} →</Link>
      </p>
    </div>
  );
}
