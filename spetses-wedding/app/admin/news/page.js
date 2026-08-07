"use client";

import { useEffect, useState } from "react";
import { config } from "@/lib/config";
import { newsStore, photoStore, recipientsFor, shrinkImage } from "@/lib/store";

const LANGS = [["fr", "Français"], ["en", "English"], ["el", "Ελληνικά"]];
const EMPTY = {
  audience: "all",
  photo: null,
  title: { fr: "", en: "", el: "" },
  body: { fr: "", en: "", el: "" },
};

// Diffusion des actualités (choix D1) : publication sur le site,
// envoi email au segment choisi, message WhatsApp prêt à coller,
// et modération des photos envoyées par les invités.
export default function AdminNewsPage() {
  const [posts, setPosts] = useState([]);
  const [pending, setPending] = useState([]);
  const [draft, setDraft] = useState(EMPTY);
  const [tab, setTab] = useState("fr");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPosts(newsStore.all());
    setPending(photoStore.pending());
  }, []);

  const refresh = () => {
    setPosts(newsStore.all());
    setPending(photoStore.pending());
  };

  const publish = (e) => {
    e.preventDefault();
    if (!draft.title.fr.trim()) return;
    newsStore.add(draft);
    setDraft(EMPTY);
    setTab("fr");
    refresh();
  };

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const photo = await shrinkImage(file);
    setDraft((d) => ({ ...d, photo }));
  };

  const remove = (id) => { newsStore.remove(id); refresh(); };

  const recipients = recipientsFor(draft.audience);
  const plainText = `${draft.title.fr}\n\n${draft.body.fr}\n\n— ${config.coupleNames}`;

  const mailtoHref =
    `mailto:?bcc=${recipients.map((r) => r.email).join(",")}` +
    `&subject=${encodeURIComponent(draft.title.fr || "Des nouvelles du mariage")}` +
    `&body=${encodeURIComponent(plainText)}`;

  const copyWhatsapp = async () => {
    await navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <h1>Actualités</h1>
      <p className="hint" style={{ marginBottom: 18 }}>
        Une actualité publiée apparaît immédiatement sur le site des invités. Vous pouvez ensuite
        l'envoyer par email au segment choisi, ou la copier pour le groupe WhatsApp.
      </p>

      <form className="card" onSubmit={publish}>
        <h3>Nouvelle actualité</h3>

        <div className="choice-row" style={{ marginBottom: 14 }}>
          {LANGS.map(([code, label]) => (
            <button key={code} type="button" className={`choice ${tab === code ? "sel" : ""}`}
              onClick={() => setTab(code)}>
              {label}{draft.title[code].trim() ? " ✓" : ""}
            </button>
          ))}
        </div>

        <label className="field">
          <span className="lbl">Titre ({tab.toUpperCase()})</span>
          <input type="text" value={draft.title[tab]} required={tab === "fr"}
            onChange={(e) => setDraft({ ...draft, title: { ...draft.title, [tab]: e.target.value } })} />
        </label>
        <label className="field">
          <span className="lbl">Texte ({tab.toUpperCase()})</span>
          <textarea rows={4} value={draft.body[tab]}
            onChange={(e) => setDraft({ ...draft, body: { ...draft.body, [tab]: e.target.value } })} />
          <div className="hint">
            Les langues laissées vides retombent sur le français.
          </div>
        </label>

        <label className="field">
          <span className="lbl">Photo (optionnelle)</span>
          <input type="file" accept="image/*" onChange={onPhoto} />
        </label>
        {draft.photo && (
          <img src={draft.photo} alt="" style={{ maxWidth: 220, borderRadius: 12, marginBottom: 14 }} />
        )}

        <div className="field">
          <span className="lbl">Destinataires</span>
          <div className="choice-row">
            <button type="button" className={`choice ${draft.audience === "all" ? "sel" : ""}`}
              onClick={() => setDraft({ ...draft, audience: "all" })}>
              Tous les foyers
            </button>
            <button type="button" className={`choice ${draft.audience === "yes" ? "sel" : ""}`}
              onClick={() => setDraft({ ...draft, audience: "yes" })}>
              Seulement les « oui »
            </button>
          </div>
          <div className="hint" style={{ marginTop: 6 }}>
            {recipients.length} foyer{recipients.length > 1 ? "s" : ""} avec un email connu.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn small" type="submit">Publier sur le site</button>
          <a className="btn secondary small" href={mailtoHref}>✉️ Envoyer par email</a>
          <button className="btn ghost small" type="button" onClick={copyWhatsapp}>
            {copied ? "✓ Copié" : "💬 Copier pour WhatsApp"}
          </button>
        </div>
        <p className="hint" style={{ marginTop: 10, marginBottom: 0 }}>
          En v1, l'email s'ouvre dans votre logiciel de messagerie avec les invités en copie cachée.
          En v2, l'envoi partira directement du site (Resend), avec suivi des envois.
        </p>
      </form>

      <div className="card">
        <h3>Photos en attente de validation ({pending.length})</h3>
        {pending.length === 0 ? (
          <p className="hint" style={{ marginBottom: 0 }}>
            Rien à modérer. Les photos envoyées par les invités arrivent ici avant publication.
          </p>
        ) : (
          <div className="gallery">
            {pending.map((p) => (
              <figure key={p.id} style={{ margin: 0 }}>
                <img src={p.dataUrl} alt="" style={{ width: "100%", borderRadius: 12, display: "block" }} />
                <figcaption style={{ fontSize: 13 }}>
                  <strong>{p.householdName}</strong>
                  {p.caption ? ` — ${p.caption}` : ""}
                </figcaption>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <button className="btn small" onClick={() => { photoStore.approve(p.id); refresh(); }}>
                    ✓ Publier
                  </button>
                  <button className="btn ghost small" onClick={() => { photoStore.remove(p.id); refresh(); }}>
                    ✕ Refuser
                  </button>
                </div>
              </figure>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Publiées ({posts.length})</h3>
        {posts.map((p) => (
          <div className="participant" key={p.id}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div>
                <strong>{p.title.fr}</strong>
                <div className="hint">
                  {new Date(p.date + "T12:00:00").toLocaleDateString("fr-FR")} ·{" "}
                  {p.audience === "yes" ? "foyers « oui »" : "tous les foyers"}
                </div>
              </div>
              <button className="icon-btn" aria-label="Supprimer" onClick={() => remove(p.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
