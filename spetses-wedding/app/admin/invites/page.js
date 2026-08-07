"use client";

import { useEffect, useState } from "react";
import { getAllHouseholds, getRsvp, downloadCsv } from "@/lib/store";

// Liste des invités + envoi des invitations (choix B2a) :
// messages pré-remplis email / WhatsApp avec le lien personnel de chaque foyer.
export default function InvitesPage() {
  const [rows, setRows] = useState([]);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    setRows(getAllHouseholds().map((h) => ({ household: h, rsvp: getRsvp(h.token) })));
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const inviteText = (h) =>
    `✨ Ça y est, c'est officiel : on se marie à Spetses ! ` +
    `Toutes les infos et votre réponse, c'est par ici : ${origin}/i/${h.token} — on espère tellement vous y voir !`;

  const copyLink = async (h) => {
    await navigator.clipboard.writeText(`${origin}/i/${h.token}`);
    setCopied(h.token);
    setTimeout(() => setCopied(""), 1800);
  };

  const statusBadge = (rsvp) => {
    if (!rsvp?.attending) return <span className="badge sun">sans réponse</span>;
    if (rsvp.attending === "no") return <span className="badge bougain">non</span>;
    const n = rsvp.participants.length;
    return <span className="badge olive">oui · {n} pers.</span>;
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ marginBottom: 10 }}>Invités & envois</h1>
        <button className="btn secondary small" onClick={downloadCsv}>⬇ Export CSV</button>
      </div>
      <p className="hint" style={{ marginBottom: 18 }}>
        Chaque foyer a un lien personnel unique (choix B1a). Les boutons préparent un message
        d'invitation prêt à envoyer depuis votre email ou votre WhatsApp.
        En v2, l'ajout / import de foyers se fera ici (CSV ou saisie), avec envoi d'emails groupés.
      </p>

      <div className="card">
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>Foyer</th>
                <th>Statut</th>
                <th>Contact</th>
                <th>Inviter / relancer</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ household: h, rsvp }) => (
                <tr key={h.token}>
                  <td>
                    <strong>{h.name}</strong>
                    <div className="hint">/i/{h.token} · {h.lang.toUpperCase()}</div>
                  </td>
                  <td>{statusBadge(rsvp)}</td>
                  <td style={{ fontSize: 13 }}>
                    {h.email && <div>{h.email}</div>}
                    {h.phone && <div>{h.phone}</div>}
                    {!h.email && !h.phone && <span className="badge grey">à compléter</span>}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="btn ghost small" style={{ marginRight: 6 }} onClick={() => copyLink(h)}>
                      {copied === h.token ? "✓ Copié" : "🔗 Lien"}
                    </button>
                    {h.email && (
                      <a className="btn ghost small" style={{ marginRight: 6 }}
                        href={`mailto:${h.email}?subject=${encodeURIComponent("On se marie à Spetses ! 💍")}&body=${encodeURIComponent(inviteText(h))}`}>
                        ✉️
                      </a>
                    )}
                    {h.phone && (
                      <a className="btn ghost small" target="_blank" rel="noreferrer"
                        href={`https://wa.me/${h.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(inviteText(h))}`}>
                        💬
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
