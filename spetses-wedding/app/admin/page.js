"use client";

import { config } from "@/lib/config";
import { useAdmin } from "@/lib/admin";
import { downloadCsv } from "@/lib/store";
import { messageFor } from "@/lib/messages";

// Tableau de bord : compteurs, allergies, arrivées par jour, relances, messages.
export default function AdminDashboard() {
  const { data } = useAdmin();
  const households = data?.households || [];
  const messages = data?.messages || [];

  const yes = households.filter((h) => h.rsvp?.attending === "yes");
  const no = households.filter((h) => h.rsvp?.attending === "no");
  const pending = households.filter((h) => !h.rsvp?.attending);
  const participants = yes.flatMap((h) => h.rsvp.participants || []);
  const adults = participants.filter((p) => p.type === "adult").length;
  const kids = participants.filter((p) => p.type === "child").length;

  // Premier questionnaire : des intentions, jamais comptées comme des « oui ».
  const intents = households.filter((h) => h.rsvp?.intent);
  const intentCount = (v) => intents.filter((h) => h.rsvp.intent === v).length;
  const estimated = intents
    .filter((h) => h.rsvp.intent !== "no")
    .reduce((n, h) => n + (Number(h.rsvp.adults) || 0) + (Number(h.rsvp.children) || 0), 0);

  const arrivals = {};
  for (const h of yes) {
    if (h.rsvp.arrival) {
      arrivals[h.rsvp.arrival] = (arrivals[h.rsvp.arrival] || 0) + (h.rsvp.participants?.length || 0);
    }
  }

  // Répartition des foyers et des personnes confirmées.
  const tally = (keyOf) => {
    const map = new Map();
    for (const h of households) {
      const key = keyOf(h);
      const entry = map.get(key) || { foyers: 0, personnes: 0 };
      entry.foyers += 1;
      if (h.rsvp?.attending === "yes") entry.personnes += h.rsvp.participants?.length || 0;
      map.set(key, entry);
    }
    return [...map.entries()].sort((a, b) => b[1].foyers - a[1].foyers);
  };
  const byCategory = tally((h) => h.category || "Sans catégorie");
  const bySide = tally((h) => config.sides.find((s) => s.id === h.side)?.label || "Non précisé");

  // La relance part dans la langue du foyer (voir lib/messages.js).
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const relance = (h) => messageFor("reminder", h, `${origin}/i/${h.token}`);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ marginBottom: 10 }}>Tableau de bord</h1>
        <button className="btn secondary small" onClick={() => downloadCsv(households)}>⬇ Export CSV</button>
      </div>

      <div className="stats-row">
        <div className="stat olive"><div className="num">{yes.length}</div><div className="lbl">foyers « oui »</div></div>
        <div className="stat bougain"><div className="num">{no.length}</div><div className="lbl">foyers « non »</div></div>
        <div className="stat sun"><div className="num">{pending.length}</div><div className="lbl">sans réponse</div></div>
        <div className="stat sea"><div className="num">{adults} + {kids}</div><div className="lbl">adultes + enfants</div></div>
      </div>

      {intents.length > 0 && (
        <div className="card">
          <h3>Questionnaire « save the date »</h3>
          <p className="hint" style={{ marginTop: -4, marginBottom: 12 }}>
            Des intentions, pas des réponses fermes : {intents.length} foyer(s) sur {households.length} ont
            répondu au premier questionnaire. Le RSVP nominatif reste à venir.
          </p>
          <div className="stats-row" style={{ marginBottom: 0 }}>
            <div className="stat olive"><div className="num">{intentCount("yes")}</div><div className="lbl">« on sera là »</div></div>
            <div className="stat sea"><div className="num">{intentCount("probably")}</div><div className="lbl">« très probablement »</div></div>
            <div className="stat sun"><div className="num">{intentCount("unsure")}</div><div className="lbl">« on ne sait pas »</div></div>
            <div className="stat bougain"><div className="num">{intentCount("no")}</div><div className="lbl">« pas possible »</div></div>
            <div className="stat"><div className="num">{estimated}</div><div className="lbl">personnes annoncées</div></div>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Répartition</h3>
        <div className="grid-2">
          <div>
            <span className="lbl" style={{ fontSize: 14, fontWeight: 600 }}>Par catégorie</span>
            <Breakdown rows={byCategory} />
          </div>
          <div>
            <span className="lbl" style={{ fontSize: 14, fontWeight: 600 }}>Par côté</span>
            <Breakdown rows={bySide} />
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Arrivées par jour</h3>
        {Object.keys(arrivals).length === 0 ? (
          <p className="hint" style={{ marginBottom: 0 }}>Aucune date d'arrivée renseignée pour l'instant.</p>
        ) : (
          <div className="table-scroll">
            <table className="data">
              <thead><tr><th>Date</th><th className="num">Personnes</th></tr></thead>
              <tbody>
                {Object.entries(arrivals).sort().map(([date, count]) => (
                  <tr key={date}>
                    <td>{new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</td>
                    <td className="num">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3>À relancer avant le {new Date(config.rsvpDeadline).toLocaleDateString("fr-FR")}</h3>
        {pending.length === 0 ? (
          <p className="hint" style={{ marginBottom: 0 }}>Tout le monde a répondu 🎉</p>
        ) : (
          <div className="table-scroll">
            <table className="data">
              <thead><tr><th>Foyer</th><th>Contact</th><th>Relancer</th></tr></thead>
              <tbody>
                {pending.map((h) => (
                  <tr key={h.token}>
                    <td>{h.name}</td>
                    <td>{h.email || h.phone || <span className="badge grey">aucun contact</span>}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {h.email && (
                        <a className="btn ghost small" style={{ marginRight: 6 }}
                          href={`mailto:${h.email}?subject=${encodeURIComponent(relance(h).subject)}&body=${encodeURIComponent(relance(h).email)}`}>
                          ✉️ Email
                        </a>
                      )}
                      {h.phone && (
                        <a className="btn ghost small" target="_blank" rel="noreferrer"
                          href={`https://wa.me/${h.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(relance(h).whatsapp)}`}>
                          💬 WhatsApp
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Messages reçus ({messages.length})</h3>
        {messages.length === 0 ? (
          <p className="hint" style={{ marginBottom: 0 }}>Aucun message pour l'instant.</p>
        ) : (
          messages.map((m) => (
            <div className="participant" key={m.id}>
              <strong>{m.name}</strong>{" "}
              <span className="hint">({m.email}{m.householdName ? ` · ${m.householdName}` : ""})</span>
              <p style={{ margin: "6px 0 0" }}>{m.message}</p>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function Breakdown({ rows }) {
  if (!rows.length) return <p className="hint">—</p>;
  return (
    <table className="data" style={{ marginTop: 6 }}>
      <tbody>
        {rows.map(([label, { foyers, personnes }]) => (
          <tr key={label}>
            <td>{label}</td>
            <td className="num">{foyers} foyer{foyers > 1 ? "s" : ""}</td>
            <td className="num">{personnes} pers.</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
