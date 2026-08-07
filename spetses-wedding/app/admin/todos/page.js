"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/lib/admin";

// To-dos : qui fait quoi, pour quand.
export default function TodosPage() {
  const { data, act } = useAdmin();
  const [items, setItems] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [draft, setDraft] = useState({ label: "", who: "", due: "" });

  useEffect(() => {
    if (data?.todos) setItems(data.todos.map((it) => ({ ...it })));
  }, [data?.todos]);

  const toggle = (i) => {
    setItems(items.map((it, j) => (j === i ? { ...it, done: !it.done } : it)));
    setDirty(true);
  };
  const remove = (i) => { setItems(items.filter((_, j) => j !== i)); setDirty(true); };
  const add = (e) => {
    e.preventDefault();
    if (!draft.label.trim()) return;
    setItems([...items, { ...draft, done: false }]);
    setDraft({ label: "", who: "", due: "" });
    setDirty(true);
  };
  const save = async () => {
    await act({ action: "saveList", list: "todos", items });
    setDirty(false);
  };

  const order = [...items.keys()].sort((a, b) => {
    const x = items[a], y = items[b];
    if (x.done !== y.done) return x.done ? 1 : -1;
    return (x.due || "9999") < (y.due || "9999") ? -1 : 1;
  });

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ marginBottom: 10 }}>To-dos</h1>
        <button className="btn small" onClick={save} disabled={!dirty}>
          {dirty ? "Enregistrer" : "✓ À jour"}
        </button>
      </div>

      <div className="card">
        {order.map((i) => {
          const it = items[i];
          return (
            <div className="check-row" key={i}
              style={{ padding: "9px 0", borderBottom: "1px solid var(--line)", opacity: it.done ? 0.5 : 1 }}>
              <input type="checkbox" checked={it.done} onChange={() => toggle(i)} id={`todo-${i}`} />
              <label htmlFor={`todo-${i}`} style={{ flex: 1, cursor: "pointer", textDecoration: it.done ? "line-through" : "none" }}>
                {it.label}
              </label>
              {it.who && <span className="badge sea">{it.who}</span>}
              {it.due && (
                <span className="badge grey">
                  {new Date(it.due + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
              )}
              <button className="icon-btn" aria-label="Supprimer" onClick={() => remove(i)}>✕</button>
            </div>
          );
        })}
        <form onSubmit={add} style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <input type="text" placeholder="Nouvelle tâche…" value={draft.label} style={{ flex: 2, minWidth: 160 }}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
          <input type="text" placeholder="Qui ?" value={draft.who} style={{ flex: 1, minWidth: 100 }}
            onChange={(e) => setDraft({ ...draft, who: e.target.value })} />
          <input type="date" value={draft.due} style={{ flex: 1, minWidth: 130 }}
            onChange={(e) => setDraft({ ...draft, due: e.target.value })} />
          <button className="btn small" type="submit">Ajouter</button>
        </form>
      </div>
    </>
  );
}
