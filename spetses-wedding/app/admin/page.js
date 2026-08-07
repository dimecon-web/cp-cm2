"use client";

import { config } from "@/lib/config";
import { useAdmin } from "@/lib/admin";
import { downloadCsv } from "@/lib/store";

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
  const allergies = participants.filter((p) => p.diet === "allergy");

  const arrivals = {};
  for (const h of yes) {
    if (h.rsvp.arrival) {
      arrivals[h.rsvp.arrival] = (arrivals[h.rsvp.arrival] || 0) + (h.rsvp.participants?.length || 0);
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const relance = (h) =>
    `Coucou ${h.name} ! Petit rappel en passant : on attend votre réponse pour le mariage à Spetses 💛 ` +
    `Votre lien personnel : ${origin}/i/${h.token}`;

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

      {allergies.length > 0 && (
        <div className="notice">
          ⚠️ <strong>Allergies graves signalées :</strong>{" "}
          {allergies.map((p) => `${p.name} (${p.dietNote})`).join(" · ")}
        </div>
      )}

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
                          href={`mailto:${h.email}?subject=${encodeURIComponent("Petit rappel — RSVP mariage Spetses")}&body=${encodeURIComponent(relance(h))}`}>
                          ✉️ Email
                        </a>
                      )}
                      {h.phone && (
                        <a className="btn ghost small" target="_blank" rel="noreferrer"
                          href={`https://wa.me/${h.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(relance(h))}`}>
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
