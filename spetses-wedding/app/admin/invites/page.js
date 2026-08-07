"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  getAllHouseholds, getRsvp, downloadCsv,
  addHousehold, importHouseholdsCsv, removeHousehold, SEED_HOUSEHOLDS,
} from "@/lib/store";

// Liste des invités, ajout / import de foyers, et envoi des invitations
// (choix B2a) : messages pré-remplis email / WhatsApp + QR code pour les
// faire-part papier (choix B4c).
export default function InvitesPage() {
  const [rows, setRows] = useState([]);
  const [copied, setCopied] = useState("");
  const [draft, setDraft] = useState({ name: "", email: "", phone: "", lang: "fr" });
  const [csv, setCsv] = useState("");
  const [qr, setQr] = useState(null);

  const refresh = () => setRows(getAllHouseholds().map((h) => ({ household: h, rsvp: getRsvp(h.token) })));
  useEffect(refresh, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const linkFor = (h) => `${origin}/i/${h.token}`;

  const inviteText = (h) =>
    `✨ Ça y est, c'est officiel : on se marie à Spetses ! ` +
    `Toutes les infos et votre réponse, c'est par ici : ${linkFor(h)} — on espère tellement vous y voir !`;

  const copyLink = async (h) => {
    await navigator.clipboard.writeText(linkFor(h));
    setCopied(h.token);
    setTimeout(() => setCopied(""), 1800);
  };

  const showQr = async (h) => {
    const dataUrl = await QRCode.toDataURL(linkFor(h), { width: 420, margin: 2 });
    setQr({ household: h, dataUrl });
  };

  const add = (e) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    addHousehold(draft);
    setDraft({ name: "", email: "", phone: "", lang: "fr" });
    refresh();
  };

  const doImport = (e) => {
    e.preventDefault();
    const created = importHouseholdsCsv(csv);
    setCsv("");
    refresh();
    if (created.length) alert(`${created.length} foyer(s) importé(s).`);
  };

  const isSeed = (token) => SEED_HOUSEHOLDS.some((h) => h.token === token);

  const statusBadge = (rsvp) => {
    if (!rsvp?.attending) return <span className="badge sun">sans réponse</span>;
    if (rsvp.attending === "no") return <span className="badge bougain">non</span>;
    return <span className="badge olive">oui · {rsvp.participants.length} pers.</span>;
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ marginBottom: 10 }}>Invités & envois</h1>
        <button className="btn secondary small" onClick={downloadCsv}>⬇ Export CSV</button>
      </div>
      <p className="hint" style={{ marginBottom: 18 }}>
        Chaque foyer a son lien personnel unique. Les boutons préparent un message d'invitation
        prêt à envoyer depuis votre email ou votre WhatsApp ; le QR code est fait pour être
        imprimé sur les faire-part papier.
      </p>

      <div className="card">
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>Foyer</th><th>Statut</th><th>Contact</th><th>Inviter / relancer</th><th></th>
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
                      {copied === h.token ? "✓ Copié" : "🔗"}
                    </button>
                    <button className="btn ghost small" style={{ marginRight: 6 }} onClick={() => showQr(h)}>
                      ⬛ QR
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
                  <td>
                    {!isSeed(h.token) && (
                      <button className="icon-btn" aria-label="Supprimer le foyer"
                        onClick={() => { removeHousehold(h.token); refresh(); }}>✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {qr && (
        <div className="card" style={{ textAlign: "center" }}>
          <h3>QR code — {qr.household.name}</h3>
          <img src={qr.dataUrl} alt={`QR code vers ${linkFor(qr.household)}`}
            style={{ width: 220, height: 220 }} />
          <p className="hint">{linkFor(qr.household)}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <a className="btn small" href={qr.dataUrl} download={`qr-${qr.household.token}.png`}>⬇ Télécharger</a>
            <button className="btn ghost small" onClick={() => setQr(null)}>Fermer</button>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Ajouter un foyer</h3>
        <form onSubmit={add}>
          <div className="grid-2">
            <label className="field"><span className="lbl">Nom du foyer</span>
              <input type="text" required value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
            <label className="field"><span className="lbl">Email</span>
              <input type="email" value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
            <label className="field"><span className="lbl">Téléphone WhatsApp</span>
              <input type="text" placeholder="+33…" value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
            <label className="field"><span className="lbl">Langue</span>
              <select value={draft.lang} onChange={(e) => setDraft({ ...draft, lang: e.target.value })}>
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="el">Ελληνικά</option>
              </select></label>
          </div>
          <button className="btn small" type="submit">Ajouter</button>
        </form>
      </div>

      <div className="card">
        <h3>Importer une liste</h3>
        <form onSubmit={doImport}>
          <label className="field">
            <span className="lbl">Une ligne par foyer : nom, email, téléphone, langue</span>
            <textarea rows={4} value={csv} onChange={(e) => setCsv(e.target.value)}
              placeholder={"Famille Dupont, dupont@example.com, +33612345678, fr\nThe Smiths, smiths@example.com, , en"} />
            <div className="hint">
              Colle directement depuis un tableur. Un lien personnel est généré automatiquement pour chaque foyer.
            </div>
          </label>
          <button className="btn small" type="submit">Importer</button>
        </form>
      </div>
    </>
  );
}
