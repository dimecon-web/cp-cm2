"use client";

import { useMemo, useState } from "react";
import QRCode from "qrcode";
import { config } from "@/lib/config";
import { useAdmin } from "@/lib/admin";
import { downloadCsv } from "@/lib/store";
import { messageFor, MESSAGE_KINDS } from "@/lib/messages";

const EMPTY_FORM = { name: "", email: "", phone: "", lang: "fr", category: "", side: "" };

const sideLabel = (side) => config.sides.find((s) => s.id === side)?.label || "";

// Liste des foyers : regroupement par catégorie et par côté, fiche modifiable
// en cliquant sur le nom, liens personnels, QR codes et messages d'invitation.
export default function InvitesPage() {
  const { data, act } = useAdmin();
  const households = data?.households || [];

  const [copied, setCopied] = useState("");
  const [draft, setDraft] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null); // { token, ...champs }
  const [csv, setCsv] = useState("");
  const [qr, setQr] = useState(null);
  const [note, setNote] = useState("");
  const [kind, setKind] = useState("saveDate");
  const [filterCat, setFilterCat] = useState("");
  const [filterSide, setFilterSide] = useState("");

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const linkFor = (h) => `${origin}/i/${h.token}`;
  const messageOf = (h) => messageFor(kind, h, linkFor(h));

  const mailtoFor = (h) => {
    const m = messageOf(h);
    return `mailto:${h.email}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.email)}`;
  };
  const whatsappFor = (h) => {
    const m = messageOf(h);
    return `https://wa.me/${h.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(m.whatsapp)}`;
  };

  // Catégories existantes, pour les filtres et la saisie assistée.
  const categories = useMemo(() => {
    const set = new Set(households.map((h) => h.category).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, "fr"));
  }, [households]);

  const countPeople = (h) =>
    h.rsvp?.attending === "yes" ? h.rsvp.participants?.length || 0 : 0;

  const visible = households.filter(
    (h) =>
      (!filterCat || (h.category || "") === filterCat) &&
      (!filterSide || (h.side || "") === filterSide)
  );

  // Regroupement par catégorie quand aucun filtre de catégorie n'est actif.
  const groups = useMemo(() => {
    if (filterCat) return [[filterCat, visible]];
    const map = new Map();
    for (const h of visible) {
      const key = h.category || "Sans catégorie";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(h);
    }
    return [...map.entries()].sort((a, b) =>
      a[0] === "Sans catégorie" ? 1 : b[0] === "Sans catégorie" ? -1 : a[0].localeCompare(b[0], "fr")
    );
  }, [visible, filterCat]);

  const copyLink = async (h) => {
    await navigator.clipboard.writeText(linkFor(h));
    setCopied(h.token);
    setTimeout(() => setCopied(""), 1800);
  };

  const showQr = async (h) => {
    const dataUrl = await QRCode.toDataURL(linkFor(h), { width: 420, margin: 2 });
    setQr({ household: h, dataUrl });
  };

  const add = async (e) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    await act({ action: "addHousehold", ...draft });
    setDraft({ ...EMPTY_FORM, category: draft.category, side: draft.side });
    setNote("Foyer ajouté.");
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    await act({ action: "updateHousehold", ...editing });
    setEditing(null);
    setNote("Fiche mise à jour.");
  };

  const doImport = async (e) => {
    e.preventDefault();
    const { created } = await act({ action: "importHouseholds", csv });
    setCsv("");
    setNote(`${created?.length || 0} foyer(s) importé(s).`);
  };

  const statusBadge = (rsvp) => {
    if (!rsvp?.attending) return <span className="badge sun">sans réponse</span>;
    if (rsvp.attending === "no") return <span className="badge bougain">non</span>;
    return <span className="badge olive">oui · {rsvp.participants?.length || 0} pers.</span>;
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ marginBottom: 10 }}>Invités & envois</h1>
        <button className="btn secondary small" onClick={() => downloadCsv(households)}>⬇ Export CSV</button>
      </div>
      <p className="hint" style={{ marginBottom: 18 }}>
        Cliquez sur le nom d'un foyer pour modifier sa fiche. Chaque foyer a son lien
        personnel unique ; le QR code est fait pour être imprimé sur les faire-part papier.
      </p>

      {note && <div className="notice ok" role="status">{note}</div>}

      {/* ---------- Filtres ---------- */}
      <div className="card">
        <h3>Regrouper &amp; filtrer</h3>

        <div className="field">
          <span className="lbl">Catégorie</span>
          <div className="choice-row">
            <button className={`choice ${!filterCat ? "sel" : ""}`} onClick={() => setFilterCat("")}>
              Toutes · {households.length}
            </button>
            {categories.map((c) => (
              <button key={c} className={`choice ${filterCat === c ? "sel" : ""}`} onClick={() => setFilterCat(c)}>
                {c} · {households.filter((h) => h.category === c).length}
              </button>
            ))}
          </div>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <span className="lbl">Côté</span>
          <div className="choice-row">
            <button className={`choice ${!filterSide ? "sel" : ""}`} onClick={() => setFilterSide("")}>
              Tous
            </button>
            {config.sides.map((s) => (
              <button key={s.id} className={`choice ${filterSide === s.id ? "sel" : ""}`} onClick={() => setFilterSide(s.id)}>
                {s.label} · {households.filter((h) => h.side === s.id).length}
              </button>
            ))}
          </div>
        </div>

        <p className="hint" style={{ marginTop: 12, marginBottom: 0 }}>
          {visible.length} foyer{visible.length > 1 ? "s" : ""} affiché{visible.length > 1 ? "s" : ""} ·{" "}
          {visible.reduce((n, h) => n + countPeople(h), 0)} personne(s) confirmée(s)
        </p>
      </div>

      {/* ---------- Fiche en cours de modification ---------- */}
      {editing && (
        <form className="card" onSubmit={saveEdit} style={{ borderColor: "var(--bougain)" }}>
          <h3>Modifier — {editing.name}</h3>
          <HouseholdFields values={editing} onChange={(patch) => setEditing({ ...editing, ...patch })} categories={categories} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn small" type="submit">Enregistrer</button>
            <button className="btn ghost small" type="button" onClick={() => setEditing(null)}>Annuler</button>
            <button className="btn ghost small" type="button" style={{ marginLeft: "auto", color: "var(--danger)", borderColor: "var(--danger)" }}
              onClick={async () => {
                await act({ action: "removeHousehold", token: editing.token });
                setEditing(null);
                setNote("Foyer supprimé.");
              }}>
              Supprimer ce foyer
            </button>
          </div>
        </form>
      )}

      {/* ---------- Message à envoyer ---------- */}
      <div className="card">
        <h3>Message à envoyer</h3>
        <div className="choice-row">
          {MESSAGE_KINDS.map((k) => (
            <button key={k.id} className={`choice ${kind === k.id ? "sel" : ""}`} onClick={() => setKind(k.id)}>
              {k.label}
            </button>
          ))}
        </div>
        <p className="hint" style={{ marginTop: 10, marginBottom: 0 }}>
          Les boutons ✉️ et 💬 enverront ce message, rédigé dans la langue de chaque foyer
          et avec son nom et son lien déjà insérés. Les textes se modifient dans <code>lib/messages.js</code>.
        </p>
      </div>

      {/* ---------- Liste ---------- */}
      {groups.map(([groupName, rows]) => (
        <div className="card" key={groupName}>
          <h3 style={{ marginBottom: 4 }}>
            {groupName}{" "}
            <span className="badge grey" style={{ verticalAlign: 3 }}>
              {rows.length} foyer{rows.length > 1 ? "s" : ""} · {rows.reduce((n, h) => n + countPeople(h), 0)} pers.
            </span>
          </h3>
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr><th>Foyer</th><th>Côté</th><th>Statut</th><th>Contact</th><th>Inviter / relancer</th></tr>
              </thead>
              <tbody>
                {rows.map((h) => (
                  <tr key={h.token}>
                    <td>
                      <button className="link-name" onClick={() => setEditing({
                        token: h.token, name: h.name, email: h.email || "", phone: h.phone || "",
                        lang: h.lang || "fr", category: h.category || "", side: h.side || "",
                      })}>
                        {h.name}
                      </button>
                      <div className="hint">/i/{h.token} · {(h.lang || "fr").toUpperCase()}</div>
                    </td>
                    <td>{h.side ? <span className="badge sea">{sideLabel(h.side)}</span> : <span className="hint">—</span>}</td>
                    <td>{statusBadge(h.rsvp)}</td>
                    <td style={{ fontSize: 13 }}>
                      {h.email && <div>{h.email}</div>}
                      {h.phone && <div>{h.phone}</div>}
                      {!h.email && !h.phone && <span className="badge grey">à compléter</span>}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button className="btn ghost small" style={{ marginRight: 6 }} onClick={() => copyLink(h)}>
                        {copied === h.token ? "✓ Copié" : "🔗"}
                      </button>
                      <button className="btn ghost small" style={{ marginRight: 6 }} onClick={() => showQr(h)}>⬛ QR</button>
                      {h.email && <a className="btn ghost small" style={{ marginRight: 6 }} href={mailtoFor(h)}>✉️</a>}
                      {h.phone && <a className="btn ghost small" target="_blank" rel="noreferrer" href={whatsappFor(h)}>💬</a>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {qr && (
        <div className="card" style={{ textAlign: "center" }}>
          <h3>QR code — {qr.household.name}</h3>
          <img src={qr.dataUrl} alt={`QR code vers ${linkFor(qr.household)}`} style={{ width: 220, height: 220 }} />
          <p className="hint">{linkFor(qr.household)}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <a className="btn small" href={qr.dataUrl} download={`qr-${qr.household.token}.png`}>⬇ Télécharger</a>
            <button className="btn ghost small" onClick={() => setQr(null)}>Fermer</button>
          </div>
        </div>
      )}

      {/* ---------- Ajout ---------- */}
      <div className="card">
        <h3>Ajouter un foyer</h3>
        <form onSubmit={add}>
          <HouseholdFields values={draft} onChange={(patch) => setDraft({ ...draft, ...patch })} categories={categories} />
          <button className="btn small" type="submit">Ajouter</button>
        </form>
      </div>

      {/* ---------- Import ---------- */}
      <div className="card">
        <h3>Importer une liste</h3>
        <form onSubmit={doImport}>
          <label className="field">
            <span className="lbl">Une ligne par foyer : nom, email, téléphone, langue, catégorie, côté</span>
            <textarea rows={4} value={csv} onChange={(e) => setCsv(e.target.value)}
              placeholder={"Famille Dupont, dupont@example.com, +33612345678, fr, Famille, thierry\nThe Smiths, smiths@example.com, , en, Amis Bruxelles, both"} />
            <div className="hint">
              Collez directement depuis un tableur. Les colonnes après le nom sont facultatives ;
              le côté s'écrit <code>themis</code>, <code>thierry</code> ou <code>both</code>.
              Un lien personnel est généré automatiquement.
            </div>
          </label>
          <button className="btn small" type="submit">Importer</button>
        </form>
      </div>
    </>
  );
}

// Champs communs à l'ajout et à la modification d'un foyer.
function HouseholdFields({ values, onChange, categories }) {
  return (
    <>
      <div className="grid-2">
        <label className="field"><span className="lbl">Nom du foyer</span>
          <input type="text" required value={values.name}
            onChange={(e) => onChange({ name: e.target.value })} /></label>
        <label className="field"><span className="lbl">Email</span>
          <input type="email" value={values.email}
            onChange={(e) => onChange({ email: e.target.value })} /></label>
        <label className="field"><span className="lbl">Téléphone WhatsApp</span>
          <input type="text" placeholder="+33…" value={values.phone}
            onChange={(e) => onChange({ phone: e.target.value })} /></label>
        <label className="field"><span className="lbl">Langue</span>
          <select value={values.lang} onChange={(e) => onChange({ lang: e.target.value })}>
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="el">Ελληνικά</option>
          </select></label>
        <label className="field"><span className="lbl">Catégorie</span>
          <input type="text" list="sw-categories" placeholder="Famille, Amis Bruxelles…"
            value={values.category} onChange={(e) => onChange({ category: e.target.value })} />
          <datalist id="sw-categories">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
        </label>
        <label className="field"><span className="lbl">Côté</span>
          <select value={values.side} onChange={(e) => onChange({ side: e.target.value })}>
            <option value="">—</option>
            {config.sides.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select></label>
      </div>
    </>
  );
}
