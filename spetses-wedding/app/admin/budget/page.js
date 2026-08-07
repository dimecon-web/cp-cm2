"use client";

import { useEffect, useState } from "react";
import { budgetStore, getRole } from "@/lib/store";

// Budget — visible uniquement par les mariés (choix F2b).
export default function BudgetPage() {
  const [role, setRole] = useState("couple");
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState({ label: "", planned: "", due: "" });

  useEffect(() => {
    setRole(getRole());
    setItems(budgetStore.all());
  }, []);

  if (role !== "couple") {
    return (
      <div className="card" style={{ textAlign: "center", padding: 40 }}>
        <h2>🔒 Réservé aux mariés</h2>
        <p className="hint" style={{ marginBottom: 0 }}>
          Le budget n'est visible que par les mariés. Basculez le rôle en haut à droite pour la démo.
        </p>
      </div>
    );
  }

  const save = (next) => { setItems(next); budgetStore.save(next); };
  const update = (id, patch) => save(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => save(items.filter((it) => it.id !== id));
  const add = (e) => {
    e.preventDefault();
    if (!draft.label) return;
    save([...items, { id: Date.now(), label: draft.label, planned: Number(draft.planned) || 0, actual: 0, deposit: 0, due: draft.due }]);
    setDraft({ label: "", planned: "", due: "" });
  };

  const sum = (key) => items.reduce((acc, it) => acc + (Number(it[key]) || 0), 0);
  const fmt = (n) => Number(n || 0).toLocaleString("fr-FR") + " €";

  return (
    <>
      <h1>Budget</h1>
      <div className="stats-row">
        <div className="stat sea"><div className="num">{fmt(sum("planned"))}</div><div className="lbl">prévu</div></div>
        <div className="stat bougain"><div className="num">{fmt(sum("actual"))}</div><div className="lbl">réel</div></div>
        <div className="stat sun"><div className="num">{fmt(sum("deposit"))}</div><div className="lbl">acomptes versés</div></div>
      </div>

      <div className="card">
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>Poste</th><th className="num">Prévu</th><th className="num">Réel</th>
                <th className="num">Acompte</th><th>Échéance</th><th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>{it.label}</td>
                  <td className="num" style={{ width: 110 }}>
                    <input type="number" value={it.planned} onChange={(e) => update(it.id, { planned: e.target.value })} />
                  </td>
                  <td className="num" style={{ width: 110 }}>
                    <input type="number" value={it.actual} onChange={(e) => update(it.id, { actual: e.target.value })} />
                  </td>
                  <td className="num" style={{ width: 110 }}>
                    <input type="number" value={it.deposit} onChange={(e) => update(it.id, { deposit: e.target.value })} />
                  </td>
                  <td style={{ width: 150 }}>
                    <input type="date" value={it.due} onChange={(e) => update(it.id, { due: e.target.value })} />
                  </td>
                  <td>
                    <button className="icon-btn" aria-label="Supprimer" onClick={() => remove(it.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form onSubmit={add} style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <input type="text" placeholder="Nouveau poste…" value={draft.label} style={{ flex: 2, minWidth: 160 }}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
          <input type="number" placeholder="Prévu €" value={draft.planned} style={{ flex: 1, minWidth: 100 }}
            onChange={(e) => setDraft({ ...draft, planned: e.target.value })} />
          <button className="btn small" type="submit">Ajouter</button>
        </form>
      </div>
    </>
  );
}
