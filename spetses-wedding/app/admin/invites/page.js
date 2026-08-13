"use client";

import { Fragment, useMemo, useState } from "react";
import QRCode from "qrcode";
import { config } from "@/lib/config";
import { useAdmin } from "@/lib/admin";
import { downloadCsv } from "@/lib/store";
import { messageFor, bulkMessageFor, MESSAGE_KINDS } from "@/lib/messages";

const EMPTY_FORM = { name: "", email: "", phone: "", lang: "fr", category: "", side: "" };
const EMPTY_CUSTOM = { title: { fr: "", en: "", el: "" }, body: { fr: "", en: "", el: "" } };
const LANGS = [["fr", "Français"], ["en", "English"], ["el", "Ελληνικά"]];

const sideLabel = (side) => config.sides.find((s) => s.id === side)?.label || "";
const SEND_LABEL = { saveDate: "Save the date", invite: "Invitation", reminder: "Relance", custom: "Information", news: "Actualité" };
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—");
const statusOf = (h) =>
  !h.rsvp?.attending ? "Sans réponse" : h.rsvp.attending === "no" ? "Non" : "Oui";
const peopleOf = (h) => (h.rsvp?.attending === "yes" ? h.rsvp.participants?.length || 0 : 0);

// Colonnes du tableau : chacune sait trier, filtrer et regrouper.
const COLUMNS = [
  { id: "name", label: "Foyer", value: (h) => h.name, groupable: false },
  { id: "category", label: "Catégorie", value: (h) => h.category || "Sans catégorie" },
  { id: "side", label: "Côté", value: (h) => sideLabel(h.side) || "Non précisé" },
  { id: "lang", label: "Langue", value: (h) => (h.lang || "fr").toUpperCase() },
  { id: "status", label: "Statut", value: statusOf },
  { id: "people", label: "Pers.", value: peopleOf, numeric: true, groupable: false },
  { id: "contact", label: "Contact", value: (h) => h.email || h.phone || "", groupable: false, sortable: false },
];

export default function InvitesPage() {
  const { data, act } = useAdmin();
  const households = data?.households || [];
  const sends = data?.sends || {};

  const [draft, setDraft] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [csv, setCsv] = useState("");
  const [qr, setQr] = useState(null);
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState("");

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});          // { category: "Famille", … }
  const [groupBy, setGroupBy] = useState("category");
  const [sort, setSort] = useState({ col: "name", dir: 1 });
  const [selected, setSelected] = useState(new Set());

  const [kind, setKind] = useState("saveDate");
  const [custom, setCustom] = useState(EMPTY_CUSTOM);
  const [customTab, setCustomTab] = useState("fr");

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const linkFor = (h) => `${origin}/i/${h.token}`;
  const messageOf = (h) => messageFor(kind, h, linkFor(h), custom);

  const categories = useMemo(
    () => [...new Set(households.map((h) => h.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")),
    [households]
  );

  // Valeurs disponibles pour chaque colonne filtrable.
  const optionsFor = (col) =>
    [...new Set(households.map((h) => col.value(h)).filter((v) => v !== ""))].sort((a, b) =>
      String(a).localeCompare(String(b), "fr")
    );

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    let list = households.filter((h) => {
      for (const [colId, wanted] of Object.entries(filters)) {
        if (!wanted) continue;
        const col = COLUMNS.find((c) => c.id === colId);
        if (String(col.value(h)) !== wanted) return false;
      }
      if (!needle) return true;
      return [h.name, h.email, h.phone, h.category].some((v) => (v || "").toLowerCase().includes(needle));
    });

    const col = COLUMNS.find((c) => c.id === sort.col) || COLUMNS[0];
    list = [...list].sort((a, b) => {
      const va = col.value(a), vb = col.value(b);
      const cmp = col.numeric ? va - vb : String(va).localeCompare(String(vb), "fr");
      return cmp * sort.dir;
    });
    return list;
  }, [households, filters, search, sort]);

  const groups = useMemo(() => {
    if (!groupBy) return [[null, rows]];
    const col = COLUMNS.find((c) => c.id === groupBy);
    const map = new Map();
    for (const h of rows) {
      const key = String(col.value(h));
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(h);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "fr"));
  }, [rows, groupBy]);

  // ---------- Sélection ----------
  const toggle = (token) => {
    const next = new Set(selected);
    next.has(token) ? next.delete(token) : next.add(token);
    setSelected(next);
  };
  const selectAllVisible = () => setSelected(new Set(rows.map((h) => h.token)));
  const clearSelection = () => setSelected(new Set());
  const chosen = households.filter((h) => selected.has(h.token));

  // ---------- Envois ----------
  const mailtoFor = (h) => {
    const m = messageOf(h);
    return `mailto:${h.email}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.email)}`;
  };
  const whatsappFor = (h) => {
    const m = messageOf(h);
    return `https://wa.me/${h.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(m.whatsapp)}`;
  };
  const markSent = (h, channel) => act({ action: "markSent", token: h.token, kind, channel });

  const copy = async (label, text) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1800);
  };

  // Un email groupé par langue : le texte doit être le même pour tous.
  const bulkMailto = (lang) => {
    const recipients = chosen.filter((h) => (h.lang || "fr") === lang && h.email).map((h) => h.email);
    const m = bulkMessageFor(kind, lang, custom);
    return {
      count: recipients.length,
      href: `mailto:?bcc=${recipients.join(",")}&subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.body)}`,
    };
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
  const showQr = async (h) => {
    setQr({ household: h, dataUrl: await QRCode.toDataURL(linkFor(h), { width: 420, margin: 2 }) });
  };

  const isPersonal = MESSAGE_KINDS.find((k) => k.id === kind)?.personal;
  const sentAt = (h) => sends[h.token]?.[kind];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ marginBottom: 10 }}>Invités &amp; envois</h1>
        <button className="btn secondary small" onClick={() => downloadCsv(households)}>⬇ Export CSV</button>
      </div>
      {note && <div className="notice ok" role="status">{note}</div>}

      {/* ---------- Filtres, recherche, regroupement ---------- */}
      <div className="card">
        <label className="field">
          <span className="lbl">Rechercher</span>
          <input type="text" value={search} placeholder="Nom, email, téléphone…"
            onChange={(e) => setSearch(e.target.value)} />
        </label>

        <div className="filter-row">
          {COLUMNS.filter((c) => c.groupable !== false).map((c) => (
            <label className="field" key={c.id} style={{ marginBottom: 0 }}>
              <span className="lbl">{c.label}</span>
              <select value={filters[c.id] || ""}
                onChange={(e) => setFilters({ ...filters, [c.id]: e.target.value })}>
                <option value="">Tous</option>
                {optionsFor(c).map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
          ))}
        </div>

        <p className="hint" style={{ marginTop: 12, marginBottom: 0 }}>
          {rows.length} foyer{rows.length > 1 ? "s" : ""} · {rows.reduce((n, h) => n + peopleOf(h), 0)} personne(s) confirmée(s)
          {groupBy && <> · regroupé par <strong>{COLUMNS.find((c) => c.id === groupBy)?.label}</strong></>}
          {(Object.values(filters).some(Boolean) || groupBy) && (
            <> · <button className="link-name" onClick={() => { setFilters({}); setGroupBy(""); }}>tout afficher</button></>
          )}
        </p>
      </div>

      {/* ---------- Envoi groupé ---------- */}
      <div className="card" style={selected.size ? { borderColor: "var(--bougain)" } : undefined}>
        <h3>Envoi groupé</h3>

        <div className="field">
          <span className="lbl">Message</span>
          <div className="choice-row">
            {MESSAGE_KINDS.map((k) => (
              <button key={k.id} className={`choice ${kind === k.id ? "sel" : ""}`} onClick={() => setKind(k.id)}>
                {k.label}
              </button>
            ))}
          </div>
        </div>

        {kind === "custom" && (
          <>
            <div className="choice-row" style={{ marginBottom: 12 }}>
              {LANGS.map(([code, label]) => (
                <button key={code} type="button" className={`choice ${customTab === code ? "sel" : ""}`}
                  onClick={() => setCustomTab(code)}>
                  {label}{custom.title[code].trim() ? " ✓" : ""}
                </button>
              ))}
            </div>
            <label className="field">
              <span className="lbl">Objet ({customTab.toUpperCase()})</span>
              <input type="text" value={custom.title[customTab]}
                onChange={(e) => setCustom({ ...custom, title: { ...custom.title, [customTab]: e.target.value } })} />
            </label>
            <label className="field">
              <span className="lbl">Message ({customTab.toUpperCase()})</span>
              <textarea rows={4} value={custom.body[customTab]}
                onChange={(e) => setCustom({ ...custom, body: { ...custom.body, [customTab]: e.target.value } })} />
              <div className="hint">Les langues laissées vides retombent sur le français.</div>
            </label>
          </>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
          <button className="btn ghost small" onClick={selectAllVisible}>
            Sélectionner les {rows.length} foyers affichés
          </button>
          {selected.size > 0 && (
            <button className="btn ghost small" onClick={clearSelection}>Tout désélectionner</button>
          )}
          <strong style={{ fontSize: 14 }}>{selected.size} sélectionné{selected.size > 1 ? "s" : ""}</strong>
        </div>

        {selected.size === 0 ? (
          <p className="hint" style={{ marginBottom: 0 }}>
            Filtrez la liste, puis cochez des foyers (ou utilisez le bouton ci-dessus) pour préparer un envoi.
          </p>
        ) : isPersonal ? (
          <>
            <div className="notice info" style={{ marginBottom: 12 }}>
              Ce message contient un <strong>lien personnel différent pour chaque foyer</strong> : il ne peut pas
              partir en un seul email groupé. La file ci-dessous ouvre les messages un par un, déjà rédigés,
              et coche ceux que vous avez envoyés.
            </div>
            <div className="table-scroll">
              <table className="data">
                <thead><tr><th>Foyer</th><th>Langue</th><th>Envoyer</th><th>Suivi</th></tr></thead>
                <tbody>
                  {chosen.map((h) => (
                    <tr key={h.token}>
                      <td>{h.name}</td>
                      <td>{(h.lang || "fr").toUpperCase()}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {h.email && (
                          <a className="btn ghost small" style={{ marginRight: 6 }} href={mailtoFor(h)}
                            onClick={() => markSent(h, "email")}>✉️ Email</a>
                        )}
                        {h.phone && (
                          <a className="btn ghost small" target="_blank" rel="noreferrer" href={whatsappFor(h)}
                            onClick={() => markSent(h, "whatsapp")}>💬 WhatsApp</a>
                        )}
                        {!h.email && !h.phone && <span className="badge grey">aucun contact</span>}
                      </td>
                      <td>
                        {sentAt(h)
                          ? <span className="badge olive">envoyé le {new Date(sentAt(h)).toLocaleDateString("fr-FR")}</span>
                          : <span className="badge grey">à envoyer</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <p className="hint">
              Ce message ne contient pas de lien personnel : il part donc en un seul email par langue,
              avec les destinataires en copie cachée.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {LANGS.map(([code, label]) => {
                const { count, href } = bulkMailto(code);
                return count > 0 ? (
                  <a key={code} className="btn secondary small" href={href}>✉️ {label} ({count})</a>
                ) : null;
              })}
              <button className="btn ghost small"
                onClick={() => copy("emails", chosen.map((h) => h.email).filter(Boolean).join(", "))}>
                {copied === "emails" ? "✓ Copié" : "📋 Copier les emails"}
              </button>
              <button className="btn ghost small"
                onClick={() => copy("tels", chosen.map((h) => h.phone).filter(Boolean).join(", "))}>
                {copied === "tels" ? "✓ Copié" : "📋 Copier les numéros"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ---------- Fiche en cours de modification ---------- */}
      {editing && (
        <form className="card" onSubmit={saveEdit} style={{ borderColor: "var(--bougain)" }}>
          <h3>Fiche — {editing.name}</h3>
          <HouseholdFields values={editing} onChange={(p) => setEditing({ ...editing, ...p })} categories={categories} />
          <HouseholdDetails
            household={households.find((h) => h.token === editing.token)}
            link={`${origin}/i/${editing.token}`}
            sends={sends[editing.token]}
          />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn small" type="submit">Enregistrer</button>
            <button className="btn ghost small" type="button" onClick={() => setEditing(null)}>Annuler</button>
            <button className="btn ghost small" type="button"
              style={{ marginLeft: "auto", color: "var(--danger)", borderColor: "var(--danger)" }}
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

      {/* ---------- Tableau unique ---------- */}
      <div className="card">
        <div className="table-scroll">
          <table className="data guests">
            <thead>
              <tr>
                <th style={{ width: 30 }}>
                  <input type="checkbox" aria-label="Tout sélectionner"
                    checked={rows.length > 0 && rows.every((h) => selected.has(h.token))}
                    onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((h) => h.token)) : new Set())} />
                </th>
                {COLUMNS.map((c) => (
                  <th key={c.id} className={c.numeric ? "num" : ""}>
                    <span className="th-cell">
                      {c.sortable === false ? (
                        <span className="th-label">{c.label}</span>
                      ) : (
                        <button className="th-sort" title={`Trier par ${c.label}`}
                          onClick={() => setSort({ col: c.id, dir: sort.col === c.id ? -sort.dir : 1 })}>
                          {c.label}{sort.col === c.id ? (sort.dir === 1 ? " ▲" : " ▼") : ""}
                        </button>
                      )}
                      {c.groupable !== false && (
                        <button className={`th-group ${groupBy === c.id ? "on" : ""}`}
                          title={groupBy === c.id ? `Ne plus regrouper par ${c.label}` : `Regrouper par ${c.label}`}
                          aria-pressed={groupBy === c.id}
                          onClick={() => setGroupBy(groupBy === c.id ? "" : c.id)}>
                          ⊞
                        </button>
                      )}
                    </span>
                  </th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={COLUMNS.length + 2}>
                  <p className="hint" style={{ margin: 0 }}>Aucun foyer ne correspond à ces critères.</p>
                </td></tr>
              )}

              {groups.map(([groupName, groupRows]) => (
                <Fragment key={groupName ?? "all"}>
                  {groupName !== null && (
                    <tr className="group-row">
                      <td>
                        <input type="checkbox" aria-label={`Sélectionner le groupe ${groupName}`}
                          checked={groupRows.every((h) => selected.has(h.token))}
                          onChange={(e) => {
                            const next = new Set(selected);
                            groupRows.forEach((h) => (e.target.checked ? next.add(h.token) : next.delete(h.token)));
                            setSelected(next);
                          }} />
                      </td>
                      <td colSpan={COLUMNS.length + 1}>
                        <strong>{groupName}</strong>{" "}
                        <span className="hint">
                          {groupRows.length} foyer{groupRows.length > 1 ? "s" : ""} ·{" "}
                          {groupRows.reduce((n, h) => n + peopleOf(h), 0)} pers.
                        </span>
                      </td>
                    </tr>
                  )}

                  {groupRows.map((h) => (
                    <tr key={h.token}>
                      <td>
                        <input type="checkbox" checked={selected.has(h.token)}
                          onChange={() => toggle(h.token)} aria-label={`Sélectionner ${h.name}`} />
                      </td>
                      <td>
                        <button className="link-name" onClick={() => setEditing({
                          token: h.token, name: h.name, email: h.email || "", phone: h.phone || "",
                          lang: h.lang || "fr", category: h.category || "", side: h.side || "",
                        })}>{h.name}</button>
                        <div className="hint">/i/{h.token}</div>
                      </td>
                      <td>{h.category || <span className="hint">—</span>}</td>
                      <td>{h.side ? <span className="badge sea">{sideLabel(h.side)}</span> : <span className="hint">—</span>}</td>
                      <td>{(h.lang || "fr").toUpperCase()}</td>
                      <td>
                        {statusOf(h) === "Oui" && <span className="badge olive">Oui</span>}
                        {statusOf(h) === "Non" && <span className="badge bougain">Non</span>}
                        {statusOf(h) === "Sans réponse" && <span className="badge sun">Sans réponse</span>}
                      </td>
                      <td className="num">{peopleOf(h) || ""}</td>
                      <td style={{ fontSize: 13 }}>
                        {h.email && <div>{h.email}</div>}
                        {h.phone && <div>{h.phone}</div>}
                        {!h.email && !h.phone && <span className="badge grey">à compléter</span>}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button className="btn ghost small" style={{ marginRight: 6 }}
                          onClick={() => copy(h.token, linkFor(h))}>
                          {copied === h.token ? "✓" : "🔗"}
                        </button>
                        <button className="btn ghost small" onClick={() => showQr(h)}>⬛</button>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hint" style={{ marginTop: 10, marginBottom: 0 }}>
          Cliquez sur un intitulé de colonne pour trier, sur le ⊞ à côté pour regrouper,
          et sur le nom d'un foyer pour modifier sa fiche.
        </p>
      </div>

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

      <div className="card">
        <h3>Ajouter un foyer</h3>
        <form onSubmit={add}>
          <HouseholdFields values={draft} onChange={(p) => setDraft({ ...draft, ...p })} categories={categories} />
          <button className="btn small" type="submit">Ajouter</button>
        </form>
      </div>

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
            </div>
          </label>
          <button className="btn small" type="submit">Importer</button>
        </form>
      </div>
    </>
  );
}

// Tout ce que le foyer a répondu, en lecture seule : composition, logistique,
// mot laissé aux mariés, et historique des envois qui lui ont été faits.
function HouseholdDetails({ household, link, sends }) {
  if (!household) return null;
  const r = household.rsvp;
  const participants = r?.participants || [];
  const adults = participants.filter((p) => p.type === "adult").length;
  const kids = participants.filter((p) => p.type === "child").length;

  return (
    <div className="details">
      <div className="details-head">
        <h4>Réponse du foyer</h4>
        {!r?.attending && <span className="badge sun">Sans réponse</span>}
        {r?.attending === "no" && <span className="badge bougain">Ne vient pas</span>}
        {r?.attending === "yes" && (
          <span className="badge olive">
            {participants.length} personne{participants.length > 1 ? "s" : ""} · {adults} adulte{adults > 1 ? "s" : ""}
            {kids > 0 ? ` + ${kids} enfant${kids > 1 ? "s" : ""}` : ""}
          </span>
        )}
        {r?.updatedAt && <span className="hint">mise à jour le {fmtDate(r.updatedAt)}</span>}
      </div>

      {r?.attending === "yes" && participants.length > 0 && (
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>Prénom</th><th>Nom</th><th>Type</th><th>Âge</th>
                {config.events.map((ev) => <th key={ev.id}>{ev.name.fr}</th>)}
              </tr>
            </thead>
            <tbody>
              {participants.map((p, i) => (
                <tr key={i}>
                  <td>{p.firstName || p.name}</td>
                  <td>{p.lastName || ""}</td>
                  <td>{p.type === "child" ? "Enfant" : "Adulte"}</td>
                  <td>{p.age || "—"}</td>
                  {config.events.map((ev) => (
                    <td key={ev.id}>{p.events?.[ev.id] ? "✓" : "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {r?.attending === "yes" && (
        <dl className="facts">
          <div><dt>Arrivée</dt><dd>{fmtDate(r.arrival)}</dd></div>
          <div><dt>Départ</dt><dd>{fmtDate(r.departure)}</dd></div>
        </dl>
      )}

      {r?.notes && (
        <p style={{ marginTop: 12, marginBottom: 0 }}>
          <strong>Mot du foyer :</strong> « {r.notes} »
        </p>
      )}

      <dl className="facts" style={{ marginTop: 14 }}>
        <div><dt>Lien personnel</dt><dd><a href={link} target="_blank" rel="noreferrer">{link}</a></dd></div>
        <div><dt>Email</dt><dd>{r?.email || household.email || "—"}</dd></div>
        <div><dt>Téléphone</dt><dd>{r?.phone || household.phone || "—"}</dd></div>
        <div><dt>Envois</dt>
          <dd>
            {sends && Object.keys(sends).length > 0
              ? Object.entries(sends).map(([k, d]) => `${SEND_LABEL[k] || k} le ${fmtDate(d)}`).join(" · ")
              : "aucun envoi enregistré"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function HouseholdFields({ values, onChange, categories }) {
  return (
    <div className="grid-2">
      <label className="field"><span className="lbl">Nom du foyer</span>
        <input type="text" required value={values.name} onChange={(e) => onChange({ name: e.target.value })} /></label>
      <label className="field"><span className="lbl">Email</span>
        <input type="email" value={values.email} onChange={(e) => onChange({ email: e.target.value })} /></label>
      <label className="field"><span className="lbl">Téléphone WhatsApp</span>
        <input type="text" placeholder="+33…" value={values.phone} onChange={(e) => onChange({ phone: e.target.value })} /></label>
      <label className="field"><span className="lbl">Langue</span>
        <select value={values.lang} onChange={(e) => onChange({ lang: e.target.value })}>
          <option value="fr">Français</option><option value="en">English</option><option value="el">Ελληνικά</option>
        </select></label>
      <label className="field"><span className="lbl">Catégorie</span>
        <input type="text" list="sw-categories" placeholder="Famille, Amis Bruxelles…"
          value={values.category} onChange={(e) => onChange({ category: e.target.value })} />
        <datalist id="sw-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
      </label>
      <label className="field"><span className="lbl">Côté</span>
        <select value={values.side} onChange={(e) => onChange({ side: e.target.value })}>
          <option value="">—</option>
          {config.sides.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select></label>
    </div>
  );
}
