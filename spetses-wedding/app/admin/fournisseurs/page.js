"use client";

import { useEffect, useState } from "react";
import { supplierStore } from "@/lib/store";

// Annuaire fournisseurs : contacts, devis, notes (choix F1d).
export default function SuppliersPage() {
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState({ name: "", role: "", phone: "", email: "", notes: "" });

  useEffect(() => { setItems(supplierStore.all()); }, []);

  const save = (next) => { setItems(next); supplierStore.save(next); };
  const update = (id, patch) => save(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => save(items.filter((it) => it.id !== id));
  const add = (e) => {
    e.preventDefault();
    if (!draft.name) return;
    save([...items, { id: Date.now(), ...draft }]);
    setDraft({ name: "", role: "", phone: "", email: "", notes: "" });
  };

  return (
    <>
      <h1>Fournisseurs</h1>
      {items.map((s) => (
        <div className="card" key={s.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <h3 style={{ marginBottom: 2 }}>{s.name}</h3>
            <button className="icon-btn" aria-label="Supprimer" onClick={() => remove(s.id)}>✕</button>
          </div>
          {s.role && <span className="badge sea" style={{ marginBottom: 10 }}>{s.role}</span>}
          <p style={{ fontSize: 14, margin: "8px 0" }}>
            {s.phone && <span style={{ marginRight: 14 }}>📞 <a href={`tel:${s.phone}`}>{s.phone}</a></span>}
            {s.email && <span>✉️ <a href={`mailto:${s.email}`}>{s.email}</a></span>}
          </p>
          <label className="field" style={{ marginBottom: 0 }}>
            <span className="lbl">Notes / devis</span>
            <textarea rows={2} value={s.notes} onChange={(e) => update(s.id, { notes: e.target.value })} />
          </label>
        </div>
      ))}

      <form className="card" onSubmit={add}>
        <h3>Ajouter un fournisseur</h3>
        <div className="grid-2">
          <label className="field"><span className="lbl">Nom</span>
            <input type="text" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
          <label className="field"><span className="lbl">Rôle (traiteur, DJ…)</span>
            <input type="text" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} /></label>
          <label className="field"><span className="lbl">Téléphone</span>
            <input type="text" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
          <label className="field"><span className="lbl">Email</span>
            <input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
        </div>
        <button className="btn small" type="submit">Ajouter</button>
      </form>
    </>
  );
}
