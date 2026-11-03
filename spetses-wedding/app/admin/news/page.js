"use client";

import { useState } from "react";
import { config } from "@/lib/config";
import { useAdmin } from "@/lib/admin";
import { shrinkImage } from "@/lib/store";

const LANGS = [["fr", "Français"], ["en", "English"], ["el", "Ελληνικά"]];
const EMPTY = {
  audience: "all",
  photo: null,
  title: { fr: "", en: "", el: "" },
  body: { fr: "", en: "", el: "" },
};

// Diffusion des actualités : publication sur le site, envoi email au segment
// choisi, message WhatsApp prêt à coller, et modération des photos d'invités.
export default function AdminNewsPage() {
  const { data, act, session } = useAdmin();
  const posts = data?.news || [];
  const pending = (data?.photos || []).filter((p) => !p.approved);
  const households = data?.households || [];

  const [draft, setDraft] = useState(EMPTY);
  const [tab, setTab] = useState("fr");
  const [copied, setCopied] = useState(false);
  const [notify, setNotify] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  // Qui serait prévenu : tout le monde sauf les foyers qui ont répondu
  // « non ». On ramasse l'adresse du carnet, celle de la réponse, et celle
  // de chaque adulte nommé — chacune une seule fois.
  const notifyList = [...new Set(
    households
      .filter((h) => h.rsvp?.attending !== "no")
      .flatMap((h) => [h.email, h.rsvp?.email, ...(h.rsvp?.participants || []).map((p) => p.email)])
      .map((e) => (e || "").trim().toLowerCase())
      .filter((e) => /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(e))
  )];

  const publish = async (e) => {
    e.preventDefault();
    if (!draft.title.fr.trim()) return;

    // Un email parti ne se rattrape pas : on demande confirmation, chiffre à
    // l'appui, avant de prévenir qui que ce soit.
    if (notify) {
      const ok = window.confirm(
        `Publier cette actualité et prévenir ${notifyList.length} adresse(s) par email ?\n\n` +
        `Les foyers qui ont répondu « non » ne reçoivent rien.`
      );
      if (!ok) return;
    }

    const res = await act({ action: "publishNews", ...draft, notify });
    setSendResult(notify ? res?.notify || { sent: 0, configured: false } : { published: true });
    setDraft(EMPTY);
    setTab("fr");
    setNotify(false);
  };

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const photo = await shrinkImage(file);
    setDraft((d) => ({ ...d, photo }));
  };

  // Repli manuel : votre messagerie, avec les mêmes destinataires que la
  // notification automatique, en copie cachée.
  const recipients = notifyList;

  const plainText = `${draft.title.fr}\n\n${draft.body.fr}\n\n— ${config.coupleNames}`;
  const mailtoHref =
    `mailto:?bcc=${recipients.join(",")}` +
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
        Une actualité publiée apparaît immédiatement sur le site des invités. Vous pouvez
        au choix prévenir les invités par email au moment de publier, ouvrir votre propre
        messagerie, ou copier le texte pour le groupe WhatsApp.
      </p>

      {sendResult && (
        <div className={`notice ${sendResult.sent || sendResult.published ? "ok" : ""}`} role="status">
          {sendResult.published && "Actualité publiée sur le site."}
          {sendResult.sent > 0 && `Actualité publiée et notification envoyée à ${sendResult.sent} adresse(s).`}
          {sendResult.configured === false &&
            `Actualité publiée. La notification n'est pas partie : l'envoi automatique n'est pas encore
             configuré sur le serveur. Utilisez « Ouvrir mon email » ci-dessous pour prévenir les
             ${sendResult.total ?? notifyList.length} invités concernés.`}
          {sendResult.failures?.length > 0 && ` Échecs : ${sendResult.failures.join(", ")}.`}
        </div>
      )}

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
          <div className="hint">Les langues laissées vides retombent sur le français.</div>
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

        <div className="field">
          <span className="lbl">Envoyer une notification ?</span>
          <label className="check-row">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            Prévenir les invités par email ({notifyList.length} adresse{notifyList.length > 1 ? "s" : ""})
          </label>
          <div className="hint" style={{ marginTop: 6 }}>
            Tout le monde sauf les foyers qui ont répondu « non » — y compris ceux qui n'ont pas
            encore répondu. Chacun la reçoit dans sa langue, en copie cachée.
          </div>
          {notify && session?.mailReady === false && (
            <div className="notice" style={{ marginTop: 10, marginBottom: 0 }}>
              L'envoi automatique n'est pas configuré : il manque les variables
              <code> RESEND_API_KEY</code> et <code>MAIL_FROM</code> dans Vercel. L'actualité sera
              publiée, mais la notification ne partira pas — utilisez « Ouvrir mon email » à côté.
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn small" type="submit">
            {notify ? "Publier et prévenir" : "Publier sur le site"}
          </button>
          <a className="btn secondary small" href={mailtoHref}
             title="Ouvre votre messagerie avec les destinataires en copie cachée">
            ✉️ Ouvrir mon email
          </a>
          <button className="btn ghost small" type="button" onClick={copyWhatsapp}>
            {copied ? "✓ Copié" : "💬 Copier pour WhatsApp"}
          </button>
        </div>
        <p className="hint" style={{ marginTop: 10, marginBottom: 0 }}>
          L'email s'ouvre dans votre logiciel de messagerie avec les invités en copie cachée.
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
                  <strong>{p.householdName}</strong>{p.caption ? ` — ${p.caption}` : ""}
                </figcaption>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <button className="btn small" onClick={() => act({ action: "approvePhoto", id: p.id })}>
                    ✓ Publier
                  </button>
                  <button className="btn ghost small" onClick={() => act({ action: "removePhoto", id: p.id })}>
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
              <button className="icon-btn" aria-label="Supprimer"
                onClick={() => act({ action: "removeNews", id: p.id })}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
