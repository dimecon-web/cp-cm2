"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/lib/admin";

// Budget — réservé au rôle « mariés ». En mode serveur, le budget ne quitte
// même pas la base pour les autres organisateurs.
export default function BudgetPage() {
  const { data, act } = useAdmin();
  const [items, setItems] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [draft, setDraft] = useState({ label: "", planned: "" });

  useEffect(() => {
    if (data?.budget) setItems(data.budget.map((it) => ({ ...it })));
  }, [data?.budget]);

  if (data && data.role !== "couple") {
    return (
      <div className="card" style={{ textAlign: "center", padding: 40 }}>
        <h2>🔒 Réservé aux mariés</h2>
        <p className="hint" style={{ marginBottom: 0 }}>
          Le budget n'est visible que par les mariés.
        </p>
      </div>
    );
  }

  const update = (i, patch) => {
    setItems(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
    setDirty(true);
  };
  const remove = (i) => { setItems(items.filter((_, j) => j !== i)); setDirty(true); };
  const add = (e) => {
    e.preventDefault();
    if (!draft.label.trim()) return;
    setItems([...items, { label: draft.label, planned: Number(draft.planned) || 0, actual: 0, deposit: 0, due: null }]);
    setDraft({ label: "", planned: "" });
    setDirty(true);
  };
  const save = async () => {
    await act({ action: "saveList", list: "budget", items });
    setDirty(false);
  };

  const sum = (key) => items.reduce((acc, it) => acc + (Number(it[key]) || 0), 0);
  const fmt = (n) => Number(n || 0).toLocaleString("fr-FR") + " €";

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ marginBottom: 10 }}>Budget</h1>
        <button className="btn small" onClick={save} disabled={!dirty}>
          {dirty ? "Enregistrer" : "✓ À jour"}
        </button>
      </div>

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
              {items.map((it, i) => (
                <tr key={i}>
                  <td>
                    <input type="text" value={it.label} onChange={(e) => update(i, { label: e.target.value })} />
                  </td>
                  <td className="num" style={{ width: 110 }}>
                    <input type="number" value={it.planned} onChange={(e) => update(i, { planned: e.target.value })} />
                  </td>
                  <td className="num" style={{ width: 110 }}>
                    <input type="number" value={it.actual} onChange={(e) => update(i, { actual: e.target.value })} />
                  </td>
                  <td className="num" style={{ width: 110 }}>
                    <input type="number" value={it.deposit} onChange={(e) => update(i, { deposit: e.target.value })} />
                  </td>
                  <td style={{ width: 150 }}>
                    <input type="date" value={it.due || ""} onChange={(e) => update(i, { due: e.target.value })} />
                  </td>
                  <td><button className="icon-btn" aria-label="Supprimer" onClick={() => remove(i)}>✕</button></td>
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
