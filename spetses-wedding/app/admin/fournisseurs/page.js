"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/lib/admin";

// Annuaire fournisseurs : contacts, devis, notes.
export default function SuppliersPage() {
  const { data, act } = useAdmin();
  const [items, setItems] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [draft, setDraft] = useState({ name: "", role: "", phone: "", email: "", notes: "" });

  useEffect(() => {
    if (data?.suppliers) setItems(data.suppliers.map((it) => ({ ...it })));
  }, [data?.suppliers]);

  const update = (i, patch) => {
    setItems(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
    setDirty(true);
  };
  const remove = (i) => { setItems(items.filter((_, j) => j !== i)); setDirty(true); };
  const add = (e) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    setItems([...items, { ...draft }]);
    setDraft({ name: "", role: "", phone: "", email: "", notes: "" });
    setDirty(true);
  };
  const save = async () => {
    await act({ action: "saveList", list: "suppliers", items });
    setDirty(false);
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ marginBottom: 10 }}>Fournisseurs</h1>
        <button className="btn small" onClick={save} disabled={!dirty}>
          {dirty ? "Enregistrer" : "✓ À jour"}
        </button>
      </div>

      {items.map((s, i) => (
        <div className="card" key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <h3 style={{ marginBottom: 2 }}>{s.name}</h3>
            <button className="icon-btn" aria-label="Supprimer" onClick={() => remove(i)}>✕</button>
          </div>
          {s.role && <span className="badge sea" style={{ marginBottom: 10 }}>{s.role}</span>}
          <p style={{ fontSize: 14, margin: "8px 0" }}>
            {s.phone && <span style={{ marginRight: 14 }}>📞 <a href={`tel:${s.phone}`}>{s.phone}</a></span>}
            {s.email && <span>✉️ <a href={`mailto:${s.email}`}>{s.email}</a></span>}
          </p>
          <label className="field" style={{ marginBottom: 0 }}>
            <span className="lbl">Notes / devis</span>
            <textarea rows={2} value={s.notes || ""} onChange={(e) => update(i, { notes: e.target.value })} />
          </label>
        </div>
      ))}

      <form className="card" onSubmit={add}>
        <h3>Ajouter un fournisseur</h3>
        <div className="grid-2">
          <label className="field"><span className="lbl">Nom</span>
            <input type="text" required value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
          <label className="field"><span className="lbl">Rôle (traiteur, DJ…)</span>
            <input type="text" value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value })} /></label>
          <label className="field"><span className="lbl">Téléphone</span>
            <input type="text" value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
          <label className="field"><span className="lbl">Email</span>
            <input type="email" value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
        </div>
        <button className="btn small" type="submit">Ajouter</button>
      </form>
    </>
  );
}
