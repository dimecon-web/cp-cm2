"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { config } from "@/lib/config";
import { useT, usePick, useLang } from "@/lib/i18n";
import { loadGuest, saveRsvp, emptyRsvp, emptyAdult, emptyChild, rememberToken } from "@/lib/store";

// Une seule réponse, qui se complète au fil du temps.
//
// Au moment du save the date, un foyer répond avec ce qu'il sait : s'il pense
// venir, et combien. En approchant, il revient nommer les personnes, préciser
// les dates et cocher les festivités. D'où quatre niveaux de réponse plutôt
// qu'un oui/non, et des champs qui ne sont jamais obligatoires.

// Ajuste la longueur d'une liste au nombre annoncé, sans perdre la saisie.
function resize(list, n, make) {
  const out = list.slice(0, Math.max(0, n));
  while (out.length < n) out.push(make());
  return out;
}

const split = (people) => ({
  adults: people.filter((p) => p.type !== "child"),
  children: people.filter((p) => p.type === "child"),
});

export default function RsvpPage() {
  const { token } = useParams();
  const t = useT();
  const pick = usePick();
  const { lang } = useLang();
  const [rsvp, setRsvp] = useState(null);
  const [shared, setShared] = useState(false);
  const [myLink, setMyLink] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGuest(token)
      .then(({ household, rsvp: saved }) => {
        if (cancelled) return;
        const base = emptyRsvp();
        base.householdName = household?.name || "";
        setShared(Boolean(household?.shared));
        if (!saved?.attending) {
          // Le carnet d'adresses connaît déjà l'un des deux contacts.
          base.participants[0].email = household?.email || "";
          base.participants[0].phone = household?.phone || "";
          setRsvp(base);
          return;
        }
        const people = (saved.participants || []).map((p) => ({ ...emptyAdult(), ...p }));
        const { adults, children } = split(people);
        const nA = Math.max(1, Number(saved.adults) || adults.length || 1);
        const nC = Math.max(0, Number(saved.children) || children.length || 0);
        const list = resize(adults, nA, emptyAdult).concat(resize(children, nC, emptyChild));
        if (!list[0].email && !list[0].phone) {
          list[0].email = saved.email || household?.email || "";
          list[0].phone = saved.phone || household?.phone || "";
        }
        setRsvp({
          ...base, ...saved,
          householdName: base.householdName,
          adults: String(nA), children: String(nC), participants: list,
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

  const { adults, children } = split(rsvp.participants);
  const coming = rsvp.attending && rsvp.attending !== "no";
  const firm = rsvp.attending === "yes";

  const set = (patch) => { setRsvp((r) => ({ ...r, ...patch })); setSaved(false); setError(""); };

  const setCount = (field, value) => {
    const raw = value === "" ? "" : String(Math.max(0, Math.min(50, Number(value) || 0)));
    const nA = field === "adults" ? Math.max(1, Number(raw) || 1) : adults.length;
    const nC = field === "children" ? Math.max(0, Number(raw) || 0) : children.length;
    set({
      [field]: raw,
      participants: resize(adults, nA, emptyAdult).concat(resize(children, nC, emptyChild)),
    });
  };

  // Les personnes sont stockées dans un seul tableau : adultes puis enfants.
  const setPerson = (kind, i, patch) => {
    const index = kind === "adult" ? i : adults.length + i;
    set({ participants: rsvp.participants.map((p, j) => (j === index ? { ...p, ...patch } : p)) });
  };
  const toggleEvent = (kind, i, eventId) => {
    const index = kind === "adult" ? i : adults.length + i;
    set({
      participants: rsvp.participants.map((p, j) =>
        j === index ? { ...p, events: { ...p.events, [eventId]: !p.events?.[eventId] } } : p
      ),
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!rsvp.attending) { setError(t("rsvp.required")); return; }
    const lead = adults[0];
    if (coming && !lead?.email?.trim() && !lead?.phone?.trim()) {
      setError(t("rsvp.contactRequired"));
      return;
    }
    if (shared && !rsvp.householdName.trim()) {
      setError(t("rsvp.familyNameRequired"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await saveRsvp(token, { ...rsvp, lang });
      // Depuis le lien partagé, la réponse vient de créer un foyer : on
      // garde son adresse pour que la personne puisse revenir la modifier.
      if (res?.token) {
        rememberToken(res.token);
        setMyLink(`${window.location.origin}/i/${res.token}`);
      }
      setSaved(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(t("errors.save"));
    } finally {
      setBusy(false);
    }
  };

  const EventPicker = ({ kind, i, person }) => (
    <div style={{ marginTop: 10 }}>
      <span style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
        {t("rsvp.events")}
      </span>
      <div className="hint" style={{ marginBottom: 6 }}>{t("rsvp.eventsHint")}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {config.events.map((ev) => (
          <label className="check-row" key={ev.id}>
            <input type="checkbox" checked={!!person.events?.[ev.id]}
              onChange={() => toggleEvent(kind, i, ev.id)} disabled={closed} />
            {pick(ev.name)}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="narrow" style={{ margin: "0 auto" }}>
      <h1>{t("rsvp.title")}</h1>

      {closed ? (
        <div className="notice">{t("rsvp.closed")}</div>
      ) : (
        <div className="notice info">
          {t("rsvp.progressive")} <strong>{deadlineStr}</strong>.
        </div>
      )}

      {saved && (
        <div className="notice ok" role="status">
          {rsvp.attending === "no" ? t("rsvp.noMsg") : firm ? t("rsvp.saved") : t("rsvp.savedSoft")}
          {myLink && (
            <>
              <br />
              <strong>{t("rsvp.yourLink")}</strong>{" "}
              <a href={myLink}>{myLink}</a>
              <br />
              <span className="hint">{t("rsvp.yourLinkHint")}</span>
            </>
          )}
        </div>
      )}
      {error && <div className="notice" role="alert">{error}</div>}

      <form onSubmit={submit}>
        <div className="card">
          <h3>{t("rsvp.attending")}</h3>
          <div className="choice-row">
            {[
              ["yes", t("rsvp.yes")],
              ["probably", t("rsvp.probably")],
              ["unsure", t("rsvp.unsure")],
              ["no", t("rsvp.no")],
            ].map(([value, label]) => (
              <button key={value} type="button"
                className={`choice ${rsvp.attending === value ? "sel" : ""}`}
                aria-pressed={rsvp.attending === value}
                onClick={() => set({ attending: value })} disabled={closed}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {coming && (
          <>
            <div className="card">
              <h3>{t("rsvp.howMany")}</h3>
              <p className="hint" style={{ marginTop: -4, marginBottom: 12 }}>{t("rsvp.howManyHint")}</p>
              <div className="grid-2">
                <label className="field">
                  <span className="lbl">{t("rsvp.adultsCount")}</span>
                  <input type="number" min="1" max="50" inputMode="numeric" value={rsvp.adults}
                    onChange={(e) => setCount("adults", e.target.value)} disabled={closed} />
                </label>
                <label className="field">
                  <span className="lbl">{t("rsvp.childrenCount")}</span>
                  <input type="number" min="0" max="50" inputMode="numeric" value={rsvp.children}
                    onChange={(e) => setCount("children", e.target.value)} disabled={closed} />
                  <div className="hint">{t("rsvp.childrenHint")}</div>
                </label>
              </div>
            </div>

            <div className="card">
              <h3>{t("rsvp.peopleTitle")}</h3>
              <p className="hint" style={{ marginTop: -4, marginBottom: 14 }}>{t("rsvp.peopleHint")}</p>

              <label className="field">
                <span className="lbl">{t("rsvp.familyName")}</span>
                <input type="text" value={rsvp.householdName} disabled={closed}
                  onChange={(e) => set({ householdName: e.target.value })} />
                <div className="hint">{t("rsvp.familyNameHint")}</div>
              </label>

              <h4 className="people-head">{t("rsvp.adultsList")}</h4>
              {adults.map((a, i) => (
                <div className="participant" key={`a${i}`}>
                  <div className="participant-head">
                    <strong>{t("rsvp.adult")} #{i + 1}{i === 0 ? ` — ${t("rsvp.youLabel")}` : ""}</strong>
                  </div>
                  <div className="grid-2">
                    <label className="field">
                      <span className="lbl">{t("rsvp.firstName")}</span>
                      <input type="text" value={a.firstName} disabled={closed}
                        onChange={(e) => setPerson("adult", i, { firstName: e.target.value })} />
                    </label>
                    <label className="field">
                      <span className="lbl">{t("rsvp.lastName")}</span>
                      <input type="text" value={a.lastName} disabled={closed}
                        onChange={(e) => setPerson("adult", i, { lastName: e.target.value })} />
                    </label>
                  </div>
                  <div className="grid-2">
                    <label className="field" style={{ marginBottom: 0 }}>
                      <span className="lbl">{t("rsvp.emailLabel")}</span>
                      <input type="email" value={a.email} disabled={closed}
                        onChange={(e) => setPerson("adult", i, { email: e.target.value })} />
                    </label>
                    <label className="field" style={{ marginBottom: 0 }}>
                      <span className="lbl">{t("rsvp.phoneLabel")}</span>
                      <input type="tel" placeholder="+32…" value={a.phone} disabled={closed}
                        onChange={(e) => setPerson("adult", i, { phone: e.target.value })} />
                    </label>
                  </div>
                  {firm && <EventPicker kind="adult" i={i} person={a} />}
                </div>
              ))}

              {children.length > 0 && (
                <>
                  <h4 className="people-head">{t("rsvp.childrenList")}</h4>
                  {children.map((c, i) => (
                    <div className="participant" key={`c${i}`}>
                      <div className="participant-head"><strong>{t("rsvp.child")} #{i + 1}</strong></div>
                      <div className="grid-2">
                        <label className="field">
                          <span className="lbl">{t("rsvp.firstName")}</span>
                          <input type="text" value={c.firstName} disabled={closed}
                            onChange={(e) => setPerson("child", i, { firstName: e.target.value })} />
                        </label>
                        <label className="field">
                          <span className="lbl">{t("rsvp.lastName")}</span>
                          <input type="text" value={c.lastName} disabled={closed}
                            onChange={(e) => setPerson("child", i, { lastName: e.target.value })} />
                        </label>
                      </div>
                      <label className="field" style={{ maxWidth: 160, marginBottom: 0 }}>
                        <span className="lbl">{t("rsvp.ageLabel")}</span>
                        <input type="number" min="0" max="17" inputMode="numeric" value={c.age} disabled={closed}
                          onChange={(e) => setPerson("child", i, { age: e.target.value })} />
                      </label>
                      {firm && <EventPicker kind="child" i={i} person={c} />}
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="card">
              <h3>{t("rsvp.logistics")}</h3>
              <p className="hint" style={{ marginBottom: 14 }}>{t("rsvp.logisticsHint")}</p>
              <div className="grid-2">
                <label className="field">
                  <span className="lbl">{t("rsvp.arrival")}</span>
                  <input type="date" value={rsvp.arrival} disabled={closed}
                    onChange={(e) => set({ arrival: e.target.value })} />
                </label>
                <label className="field">
                  <span className="lbl">{t("rsvp.departure")}</span>
                  <input type="date" value={rsvp.departure} disabled={closed}
                    onChange={(e) => set({ departure: e.target.value })} />
                </label>
              </div>
            </div>
          </>
        )}

        {rsvp.attending && (
          <div className="card">
            <label className="field" style={{ marginBottom: 0 }}>
              <span className="lbl">{t("rsvp.notes")}</span>
              <textarea rows={3} value={rsvp.notes} disabled={closed}
                onChange={(e) => set({ notes: e.target.value })} />
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
