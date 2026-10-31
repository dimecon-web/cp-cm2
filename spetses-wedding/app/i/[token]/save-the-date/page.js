"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { config } from "@/lib/config";
import { useT, usePick, useLang } from "@/lib/i18n";
import { loadGuest, saveSaveDate, emptySaveDate } from "@/lib/store";

const emptyAdult = () => ({ first: "", last: "", email: "", phone: "" });
const emptyChild = () => ({ first: "", last: "", age: "" });

// Ajuste la longueur d'une liste de personnes au nombre annoncé, sans perdre
// ce qui a déjà été saisi quand le nombre change.
function resize(list, n, make) {
  const out = list.slice(0, Math.max(0, n));
  while (out.length < n) out.push(make());
  return out;
}

// Premier questionnaire, envoyé avec le save the date. Il reste court, mais
// il nomme chaque personne : chaque adulte avec ses propres coordonnées,
// chaque enfant avec son âge. La réponse ferme viendra plus tard (RSVP).
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
        const adults = rsvp?.adults ?? "";
        const children = rsvp?.children ?? "";
        const nA = Math.max(1, Number(adults) || 1);
        const nC = Math.max(0, Number(children) || 0);
        const lead = {
          ...emptyAdult(),
          first: rsvp?.respondentFirstName || "",
          last: rsvp?.respondentLastName || "",
          // Le carnet d'adresses connaît déjà l'un des deux contacts.
          email: rsvp?.email || household?.email || "",
          phone: rsvp?.phone || household?.phone || "",
        };
        const stored = (rsvp?.adultNames || []).map((a) => ({ ...emptyAdult(), ...a }));
        setForm({
          ...emptySaveDate(),
          intent: rsvp?.intent || null,
          adults: adults === "" ? "1" : String(adults),
          children: children === "" ? "0" : String(children),
          adultNames: resize(stored.length ? stored : [lead], nA, emptyAdult),
          childNames: resize((rsvp?.childNames || []).map((c) => ({
            ...emptyChild(), ...c, age: c.age == null ? "" : String(c.age),
          })), nC, emptyChild),
          arrival: rsvp?.arrival || "",
          departure: rsvp?.departure || "",
          notes: rsvp?.notes || "",
        });
      })
      .catch(() => {
        if (!cancelled) setForm({ ...emptySaveDate(), adults: "1", children: "0", adultNames: [emptyAdult()] });
      });
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

  const setCount = (field, value) => {
    const n = value === "" ? "" : String(Math.max(0, Math.min(50, Number(value) || 0)));
    if (field === "adults") {
      const nA = Math.max(1, Number(n) || 1);
      set({ adults: n, adultNames: resize(form.adultNames, nA, emptyAdult) });
    } else {
      const nC = Math.max(0, Number(n) || 0);
      set({ children: n, childNames: resize(form.childNames, nC, emptyChild) });
    }
  };

  const setAdult = (i, patch) =>
    set({ adultNames: form.adultNames.map((a, j) => (j === i ? { ...a, ...patch } : a)) });
  const setChild = (i, patch) =>
    set({ childNames: form.childNames.map((c, j) => (j === i ? { ...c, ...patch } : c)) });

  const coming = form.intent && form.intent !== "no";
  const lead = form.adultNames[0] || emptyAdult();

  const submit = async (e) => {
    e.preventDefault();
    if (!form.intent) { setError(t("saveDate.required")); return; }
    if (coming && !lead.email.trim() && !lead.phone.trim()) {
      setError(t("rsvp.contactRequired"));
      return;
    }
    setBusy(true);
    try {
      await saveSaveDate(token, form);
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
      <h1>{t("saveDate.title")}</h1>
      <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontStyle: "italic", fontSize: 18 }}>
        {weddingStr} · {pick(config.location)}
      </p>
      <p style={{ color: "var(--muted)" }}>{t("saveDate.intro")}</p>

      {saved && <div className="notice ok" role="status">{t("saveDate.saved")}</div>}
      {error && <div className="notice" role="alert">{error}</div>}

      <form onSubmit={submit}>
        <div className="card">
          <h3>{t("saveDate.intentQ")}</h3>
          <div className="choice-row">
            {[
              ["yes", t("saveDate.iYes")],
              ["probably", t("saveDate.iProbably")],
              ["unsure", t("saveDate.iUnsure")],
              ["no", t("saveDate.iNo")],
            ].map(([value, label]) => (
              <button key={value} type="button"
                className={`choice ${form.intent === value ? "sel" : ""}`}
                aria-pressed={form.intent === value}
                onClick={() => set({ intent: value })}>
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
                  <input type="number" min="1" max="50" inputMode="numeric"
                    value={form.adults} onChange={(e) => setCount("adults", e.target.value)} />
                </label>
                <label className="field">
                  <span className="lbl">{t("saveDate.children")}</span>
                  <input type="number" min="0" max="50" inputMode="numeric"
                    value={form.children} onChange={(e) => setCount("children", e.target.value)} />
                  <div className="hint">{t("saveDate.childrenHint")}</div>
                </label>
              </div>
            </div>

            <div className="card">
              <h3>{t("saveDate.peopleTitle")}</h3>
              <p className="hint" style={{ marginTop: -4, marginBottom: 14 }}>{t("saveDate.peopleHint")}</p>

              <h4 className="people-head">{t("saveDate.adultsList")}</h4>
              {form.adultNames.map((a, i) => (
                <div className="participant" key={`a${i}`}>
                  <div className="participant-head">
                    <strong>
                      {t("rsvp.adult")} #{i + 1}
                      {i === 0 ? ` — ${t("saveDate.youLabel")}` : ""}
                    </strong>
                  </div>
                  <div className="grid-2">
                    <label className="field">
                      <span className="lbl">{t("rsvp.firstName")}</span>
                      <input type="text" value={a.first} onChange={(e) => setAdult(i, { first: e.target.value })} />
                    </label>
                    <label className="field">
                      <span className="lbl">{t("rsvp.lastName")}</span>
                      <input type="text" value={a.last} onChange={(e) => setAdult(i, { last: e.target.value })} />
                    </label>
                  </div>
                  <div className="grid-2">
                    <label className="field" style={{ marginBottom: 0 }}>
                      <span className="lbl">{t("rsvp.emailLabel")}</span>
                      <input type="email" value={a.email} onChange={(e) => setAdult(i, { email: e.target.value })} />
                    </label>
                    <label className="field" style={{ marginBottom: 0 }}>
                      <span className="lbl">{t("rsvp.phoneLabel")}</span>
                      <input type="tel" placeholder="+32…" value={a.phone}
                        onChange={(e) => setAdult(i, { phone: e.target.value })} />
                    </label>
                  </div>
                </div>
              ))}

              {form.childNames.length > 0 && (
                <>
                  <h4 className="people-head">{t("saveDate.childrenList")}</h4>
                  {form.childNames.map((c, i) => (
                    <div className="participant" key={`c${i}`}>
                      <div className="participant-head">
                        <strong>{t("rsvp.child")} #{i + 1}</strong>
                      </div>
                      <div className="grid-2">
                        <label className="field">
                          <span className="lbl">{t("rsvp.firstName")}</span>
                          <input type="text" value={c.first} onChange={(e) => setChild(i, { first: e.target.value })} />
                        </label>
                        <label className="field">
                          <span className="lbl">{t("rsvp.lastName")}</span>
                          <input type="text" value={c.last} onChange={(e) => setChild(i, { last: e.target.value })} />
                        </label>
                      </div>
                      <label className="field" style={{ maxWidth: 160, marginBottom: 0 }}>
                        <span className="lbl">{t("saveDate.ageLabel")}</span>
                        <input type="number" min="0" max="17" inputMode="numeric"
                          value={c.age} onChange={(e) => setChild(i, { age: e.target.value })} />
                      </label>
                    </div>
                  ))}
                </>
              )}
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

        {form.intent === "no" && (
          <div className="card">
            <h3>{t("saveDate.peopleTitle")}</h3>
            <div className="grid-2">
              <label className="field" style={{ marginBottom: 0 }}>
                <span className="lbl">{t("rsvp.firstName")}</span>
                <input type="text" value={lead.first} onChange={(e) => setAdult(0, { first: e.target.value })} />
              </label>
              <label className="field" style={{ marginBottom: 0 }}>
                <span className="lbl">{t("rsvp.lastName")}</span>
                <input type="text" value={lead.last} onChange={(e) => setAdult(0, { last: e.target.value })} />
              </label>
            </div>
          </div>
        )}

        {form.intent && (
          <div className="card">
            <h3>{t("saveDate.notes")}</h3>
            <p className="hint" style={{ marginTop: -4, marginBottom: 12 }}>{t("saveDate.notesHint")}</p>
            <textarea rows={3} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
          </div>
        )}

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
