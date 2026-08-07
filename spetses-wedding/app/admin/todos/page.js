"use client";

import { useEffect, useState } from "react";
import { todoStore } from "@/lib/store";

// To-dos : qui fait quoi, pour quand (choix F1c).
export default function TodosPage() {
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState({ label: "", who: "", due: "" });

  useEffect(() => { setItems(todoStore.all()); }, []);

  const save = (next) => { setItems(next); todoStore.save(next); };
  const toggle = (id) => save(items.map((it) => (it.id === id ? { ...it, done: !it.done } : it)));
  const remove = (id) => save(items.filter((it) => it.id !== id));
  const add = (e) => {
    e.preventDefault();
    if (!draft.label) return;
    save([...items, { id: Date.now(), ...draft, done: false }]);
    setDraft({ label: "", who: "", due: "" });
  };

  const sorted = [...items].sort((a, b) => (a.done === b.done ? (a.due || "9999") < (b.due || "9999") ? -1 : 1 : a.done ? 1 : -1));

  return (
    <>
      <h1>To-dos</h1>
      <div className="card">
        {sorted.map((it) => (
          <div className="check-row" key={it.id}
            style={{ padding: "9px 0", borderBottom: "1px solid var(--line)", opacity: it.done ? 0.5 : 1 }}>
            <input type="checkbox" checked={it.done} onChange={() => toggle(it.id)} id={`todo-${it.id}`} />
            <label htmlFor={`todo-${it.id}`} style={{ flex: 1, cursor: "pointer", textDecoration: it.done ? "line-through" : "none" }}>
              {it.label}
            </label>
            {it.who && <span className="badge sea">{it.who}</span>}
            {it.due && (
              <span className="badge grey">
                {new Date(it.due + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </span>
            )}
            <button className="icon-btn" aria-label="Supprimer" onClick={() => remove(it.id)}>✕</button>
          </div>
        ))}
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
