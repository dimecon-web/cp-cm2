"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { config } from "@/lib/config";
import { useT, usePick, useLang } from "@/lib/i18n";
import { loadGuest, saveRsvp, emptyRsvp } from "@/lib/store";

export default function RsvpPage() {
  const { token } = useParams();
  const t = useT();
  const pick = usePick();
  const { lang } = useLang();
  const [rsvp, setRsvp] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGuest(token)
      .then(({ household, rsvp }) => {
        if (cancelled) return;
        const base = rsvp || emptyRsvp();
        // Le carnet d'adresses connaît déjà l'un des deux contacts : on le
        // pré-remplit pour que le foyer n'ait qu'à compléter ce qui manque.
        setRsvp({
          ...base,
          email: base.email || household?.email || "",
          phone: base.phone || household?.phone || "",
        });
      })
      .catch(() => { if (!cancelled) setRsvp(emptyRsvp()); });
    return () => { cancelled = true; };
  }, [token]);

  if (!rsvp) return null;

  const deadline = new Date(config.rsvpDeadline);
  const closed = new Date() > deadline;
  const locale = lang === "en" ? "en-GB" : lang === "el" ? "el-GR" : "fr-FR";
  const deadlineStr = deadline.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });

  const set = (patch) => { setRsvp((r) => ({ ...r, ...patch })); setSaved(false); setError(""); };
  const setParticipant = (i, patch) => {
    setRsvp((r) => ({ ...r, participants: r.participants.map((p, j) => (j === i ? { ...p, ...patch } : p)) }));
    setSaved(false);
  };
  const toggleEvent = (i, eventId) => {
    setRsvp((r) => ({
      ...r,
      participants: r.participants.map((p, j) =>
        j === i ? { ...p, events: { ...p.events, [eventId]: !p.events?.[eventId] } } : p
      ),
    }));
    setSaved(false);
  };
  const addParticipant = () => {
    const base = emptyRsvp().participants[0];
    set({ participants: [...rsvp.participants, { ...base, events: { ...base.events } }] });
  };
  const removeParticipant = (i) => set({ participants: rsvp.participants.filter((_, j) => j !== i) });

  const submit = async (e) => {
    e.preventDefault();
    if (!rsvp.email.trim() && !rsvp.phone.trim()) {
      setError(t("rsvp.contactRequired"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await saveRsvp(token, rsvp);
      setSaved(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(t("errors.save"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="narrow" style={{ margin: "0 auto" }}>
      <h1>{t("rsvp.title")}</h1>

      {closed ? (
        <div className="notice">{t("rsvp.closed")}</div>
      ) : (
        <div className="notice info">
          {t("rsvp.deadline")} <strong>{deadlineStr}</strong>.
        </div>
      )}

      {saved && (
        <div className="notice ok" role="status">
          {rsvp.attending === "no" ? t("rsvp.noMsg") : t("rsvp.saved")}
        </div>
      )}
      {error && <div className="notice" role="alert">{error}</div>}

      <form onSubmit={submit}>
        <div className="card">
          <h3>{t("rsvp.attending")}</h3>
          <div className="choice-row">
            <button type="button" className={`choice ${rsvp.attending === "yes" ? "sel" : ""}`}
              onClick={() => set({ attending: "yes" })} disabled={closed}>
              {t("rsvp.yes")}
            </button>
            <button type="button" className={`choice ${rsvp.attending === "no" ? "sel" : ""}`}
              onClick={() => set({ attending: "no" })} disabled={closed}>
              {t("rsvp.no")}
            </button>
          </div>
        </div>

        {rsvp.attending && (
          <div className="card">
            <h3>{t("rsvp.contact")}</h3>
            <p className="hint" style={{ marginBottom: 14 }}>{t("rsvp.contactHint")}</p>
            <div className="grid-2">
              <label className="field">
                <span className="lbl">{t("rsvp.emailLabel")}</span>
                <input type="email" value={rsvp.email}
                  onChange={(e) => set({ email: e.target.value })} disabled={closed} />
              </label>
              <label className="field">
                <span className="lbl">{t("rsvp.phoneLabel")}</span>
                <input type="tel" placeholder="+33…" value={rsvp.phone}
                  onChange={(e) => set({ phone: e.target.value })} disabled={closed} />
              </label>
            </div>
          </div>
        )}

        {rsvp.attending === "yes" && (
          <>
            <div className="card">
              <h3>{t("rsvp.participants")}</h3>
              {rsvp.participants.map((p, i) => (
                <div className="participant" key={i}>
                  <div className="participant-head">
                    <strong>#{i + 1}</strong>
                    {rsvp.participants.length > 1 && !closed && (
                      <button type="button" className="icon-btn" aria-label="✕"
                        onClick={() => removeParticipant(i)}>✕</button>
                    )}
                  </div>
                  <div className="grid-2">
                    <label className="field">
                      <span className="lbl">{t("rsvp.firstName")}</span>
                      <input type="text" value={p.firstName} required
                        onChange={(e) => setParticipant(i, { firstName: e.target.value })} disabled={closed} />
                    </label>
                    <label className="field">
                      <span className="lbl">{t("rsvp.lastName")}</span>
                      <input type="text" value={p.lastName} required
                        onChange={(e) => setParticipant(i, { lastName: e.target.value })} disabled={closed} />
                    </label>
                  </div>
                  <div className="grid-2">
                    <div>
                      <span className="lbl" style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 5 }}>
                        {t("rsvp.adult")} / {t("rsvp.child")}
                      </span>
                      <div className="choice-row">
                        <button type="button" className={`choice ${p.type === "adult" ? "sel" : ""}`}
                          onClick={() => setParticipant(i, { type: "adult", age: "" })} disabled={closed}>
                          {t("rsvp.adult")}
                        </button>
                        <button type="button" className={`choice ${p.type === "child" ? "sel" : ""}`}
                          onClick={() => setParticipant(i, { type: "child" })} disabled={closed}>
                          {t("rsvp.child")}
                        </button>
                      </div>
                    </div>
                    {p.type === "child" && (
                      <label className="field" style={{ maxWidth: 140 }}>
                        <span className="lbl">{t("rsvp.age")}</span>
                        <input type="number" min="0" max="17" value={p.age}
                          onChange={(e) => setParticipant(i, { age: e.target.value })} disabled={closed} />
                      </label>
                    )}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                      {t("rsvp.events")}
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {config.events.map((ev) => (
                        <label className="check-row" key={ev.id}>
                          <input type="checkbox" checked={!!p.events?.[ev.id]}
                            onChange={() => toggleEvent(i, ev.id)} disabled={closed} />
                          {pick(ev.name)}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {!closed && (
                <button type="button" className="btn ghost small" onClick={addParticipant}>
                  + {t("rsvp.addParticipant")}
                </button>
              )}
            </div>

            <div className="card">
              <h3>{t("rsvp.logistics")}</h3>
              <p className="hint" style={{ marginBottom: 14 }}>{t("rsvp.logisticsHint")}</p>
              <div className="grid-2">
                <label className="field">
                  <span className="lbl">{t("rsvp.arrival")}</span>
                  <input type="date" value={rsvp.arrival}
                    onChange={(e) => set({ arrival: e.target.value })} disabled={closed} />
                </label>
                <label className="field">
                  <span className="lbl">{t("rsvp.departure")}</span>
                  <input type="date" value={rsvp.departure}
                    onChange={(e) => set({ departure: e.target.value })} disabled={closed} />
                </label>
              </div>
            </div>
          </>
        )}

        {rsvp.attending && (
          <div className="card">
            <label className="field" style={{ marginBottom: 0 }}>
              <span className="lbl">{t("rsvp.notes")}</span>
              <textarea rows={3} value={rsvp.notes}
                onChange={(e) => set({ notes: e.target.value })} disabled={closed} />
            </label>
          </div>
        )}

        {rsvp.attending && !closed && (
          <button className="btn" type="submit" style={{ width: "100%" }} disabled={busy}>
            {busy ? "…" : t("rsvp.save")}
          </button>
        )}
      </form>
    </div>
  );
}
