"use client";

// Couche de données du navigateur.
//
// Deux modes, choisis automatiquement au premier appel :
//   • mode serveur — les variables SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY
//     sont configurées : tout passe par les routes de app/api/, donc par la
//     base partagée. C'est le mode réel, celui qui permet à un invité de
//     répondre depuis son téléphone et aux organisateurs de le voir.
//   • mode démo — aucune variable configurée : les données restent dans le
//     navigateur (localStorage), avec des exemples. Le site reste navigable,
//     ce qui évite qu'il casse tant que la configuration n'est pas faite.

import { EVENT_IDS } from "./config";

const ls = {
  get(key, fallback) {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(value));
  },
};

// ---------- Détection du mode (une seule requête, mise en cache) ----------
let modePromise = null;

export function getMode() {
  if (!modePromise) {
    modePromise = fetch("/api/status")
      .then((r) => r.json())
      .catch(() => ({ configured: false, adminEnabled: false }));
  }
  return modePromise;
}

// ---------- Données d'exemple du mode démo ----------
export const SEED_HOUSEHOLDS = [
  { token: "demo", name: "Famille Démo", email: "", phone: "", lang: "fr", category: "", side: "" },
  { token: "a7f2k9", name: "Sophie & Marc Durand", email: "sophie.durand@example.com", phone: "+33600000001", lang: "fr", category: "Famille", side: "thierry" },
  { token: "b3x8m1", name: "The Wilson family", email: "wilsons@example.com", phone: "+44700000002", lang: "en", category: "Amis Bruxelles", side: "thierry" },
  { token: "c9p4t6", name: "Οικογένεια Παπαδόπουλου", email: "", phone: "+30690000003", lang: "el", category: "Famille", side: "themis" },
  { token: "d5r2w8", name: "Léa Martin", email: "lea.martin@example.com", phone: "", lang: "fr", category: "Amis Bruxelles", side: "both" },
  { token: "g4h9j2", name: "Nikos & Eleni", email: "nikos.eleni@example.com", phone: "+30690000007", lang: "el", category: "Amis Athènes", side: "themis" },
];

const SEED_RSVPS = {
  a7f2k9: {
    attending: "yes",
    email: "sophie.durand@example.com",
    participants: [
      { firstName: "Sophie", lastName: "Durand", type: "adult", age: "", events: { party: true, tour: true, wedding: true, beach: true } },
      { firstName: "Marc", lastName: "Durand", type: "adult", age: "", events: { party: true, tour: false, wedding: true, beach: true } },
      { firstName: "Jules", lastName: "Durand", type: "child", age: "7", events: { party: false, tour: false, wedding: true, beach: true } },
    ],
    phone: "+33600000001",
    arrival: "2027-07-07", departure: "2027-07-12",
    notes: "On a trop hâte !", updatedAt: "2026-07-20T10:00:00Z",
  },
  b3x8m1: {
    attending: "yes",
    email: "wilsons@example.com",
    participants: [
      { firstName: "Emma", lastName: "Wilson", type: "adult", age: "", events: { party: true, tour: true, wedding: true, beach: false } },
      { firstName: "James", lastName: "Wilson", type: "adult", age: "", events: { party: true, tour: true, wedding: true, beach: false } },
    ],
    phone: "+44700000002",
    arrival: "2027-07-08", departure: "2027-07-11",
    notes: "", updatedAt: "2026-07-25T09:00:00Z",
  },
  d5r2w8: {
    attending: "no", email: "lea.martin@example.com", phone: "", participants: [],
    arrival: "", departure: "",
    notes: "Je serai à l'étranger, pardon…", updatedAt: "2026-07-22T18:30:00Z",
  },
};

const SEED_NEWS = [
  {
    id: 1, date: "2026-07-01", audience: "all", photo: null,
    title: { fr: "Le site est ouvert !", en: "The website is live!", el: "Η ιστοσελίδα άνοιξε!" },
    body: {
      fr: "Bienvenue sur notre site de mariage. Première mission : répondez au RSVP, ça nous aide énormément pour la suite.",
      en: "Welcome to our wedding website. First mission: reply to the RSVP — it helps us enormously.",
      el: "Καλώς ήρθατε στην ιστοσελίδα του γάμου μας. Πρώτη αποστολή: απαντήστε στο RSVP!",
    },
  },
];

const SEED_TODOS = [
  { id: 1, label: "Confirmer le lieu de réception", who: "Les mariés", due: "2026-10-15", done: false },
  { id: 2, label: "Établir la liste complète des invités", who: "Les mariés", due: "2026-10-31", done: false },
  { id: 3, label: "Liste d'hôtels à recommander aux invités", who: "Témoins", due: "2026-11-30", done: false },
];

const SEED_BUDGET = [
  { id: 1, label: "Lieu de réception", planned: 12000, actual: 0, deposit: 0, due: "2026-12-01" },
  { id: 2, label: "Traiteur", planned: 9000, actual: 0, deposit: 0, due: "2027-02-01" },
  { id: 3, label: "Photographe", planned: 2500, actual: 0, deposit: 0, due: "2027-03-01" },
];

const SEED_SUPPLIERS = [
  { id: 1, name: "Poseidonion Grand Hotel", role: "Lieu / hébergement", phone: "+30 22980 74553", email: "", notes: "Devis demandé pour la réception." },
];

// ---------- Formulaire RSVP vierge ----------
export function emptyRsvp() {
  const events = Object.fromEntries(EVENT_IDS.map((id) => [id, id === "wedding"]));
  return {
    attending: null,
    participants: [{ firstName: "", lastName: "", type: "adult", age: "", events: { ...events } }],
    email: "", phone: "", arrival: "", departure: "", notes: "", updatedAt: null,
  };
}

// ---------- Espace invité ----------
// Renvoie tout ce dont les pages invité ont besoin : le foyer, sa réponse,
// les actualités qui lui sont destinées et le mur de photos validées.
export async function loadGuest(token) {
  const { configured } = await getMode();

  if (configured) {
    const res = await fetch(`/api/guest/${encodeURIComponent(token)}`);
    if (res.status === 404) return { household: null, rsvp: null, news: [], photos: [] };
    if (!res.ok) throw new Error("guest_load_failed");
    return res.json();
  }

  const extras = ls.get("sw:households", []);
  const household = [...SEED_HOUSEHOLDS, ...extras].find((h) => h.token === token) || null;
  const rsvp = ls.get(`sw:rsvp:${token}`, SEED_RSVPS[token] || null);
  const news = ls
    .get("sw:news", SEED_NEWS)
    .filter((n) => n.audience !== "yes" || rsvp?.attending === "yes")
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const photos = ls.get("sw:photos", []).filter((p) => p.approved);
  return { household, rsvp, news, photos };
}

export async function saveRsvp(token, rsvp) {
  const { configured } = await getMode();
  if (configured) {
    const res = await fetch(`/api/guest/${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(rsvp),
    });
    if (!res.ok) throw new Error("rsvp_save_failed");
    return;
  }
  ls.set(`sw:rsvp:${token}`, { ...rsvp, updatedAt: new Date().toISOString() });
}

export async function submitPhoto(token, { dataUrl, caption }) {
  const { configured } = await getMode();
  if (configured) {
    const res = await fetch("/api/public", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "photo", token, dataUrl, caption }),
    });
    if (!res.ok) throw new Error("photo_failed");
    return;
  }
  const all = ls.get("sw:photos", []);
  const household = [...SEED_HOUSEHOLDS, ...ls.get("sw:households", [])].find((h) => h.token === token);
  all.unshift({
    id: Date.now(), dataUrl, caption, approved: false,
    date: new Date().toISOString(), householdName: household?.name || "",
  });
  ls.set("sw:photos", all);
}

export async function sendMessage(token, { name, email, message }) {
  const { configured } = await getMode();
  if (configured) {
    const res = await fetch("/api/public", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "contact", token, name, email, message }),
    });
    if (!res.ok) throw new Error("message_failed");
    return;
  }
  const all = ls.get("sw:messages", []);
  const household = [...SEED_HOUSEHOLDS, ...ls.get("sw:households", [])].find((h) => h.token === token);
  all.unshift({
    id: Date.now(), name, email, message,
    date: new Date().toISOString(), householdName: household?.name || "",
  });
  ls.set("sw:messages", all);
}

// ---------- Espace organisateurs ----------
export async function adminLogin(password) {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "login", password }),
  });
  if (!res.ok) return null;
  const { role } = await res.json();
  return role;
}

export async function adminLogout() {
  await fetch("/api/admin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "logout" }),
  });
}

// Charge le tableau de bord complet. En mode démo, reconstitue la même
// structure à partir du localStorage pour que les pages soient identiques.
export async function adminLoad() {
  const { configured } = await getMode();

  if (configured) {
    const res = await fetch("/api/admin");
    if (res.status === 401) return { role: null };
    if (!res.ok) throw new Error("admin_load_failed");
    return res.json();
  }

  const edits = ls.get("sw:householdEdits", {});
  const households = [...SEED_HOUSEHOLDS, ...ls.get("sw:households", [])].map((h) => ({
    ...h,
    ...(edits[h.token] || {}),
    rsvp: ls.get(`sw:rsvp:${h.token}`, SEED_RSVPS[h.token] || null),
  }));
  return {
    role: ls.get("sw:role", "couple"),
    demo: true,
    households,
    news: ls.get("sw:news", SEED_NEWS),
    photos: ls.get("sw:photos", []),
    messages: ls.get("sw:messages", []),
    sends: ls.get("sw:sends", {}),
    todos: ls.get("sw:todos", SEED_TODOS),
    suppliers: ls.get("sw:suppliers", SEED_SUPPLIERS),
    budget: ls.get("sw:budget", SEED_BUDGET),
  };
}

export async function adminAction(payload) {
  const { configured } = await getMode();

  if (configured) {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`action_failed:${payload.action}`);
    return res.json();
  }

  // Équivalents locaux, pour que le mode démo reste pleinement utilisable.
  switch (payload.action) {
    case "addHousehold": {
      const token = makeLocalToken();
      ls.set("sw:households", [
        ...ls.get("sw:households", []),
        {
          token,
          name: payload.name,
          email: payload.email || "",
          phone: payload.phone || "",
          lang: payload.lang || "fr",
          category: payload.category || "",
          side: payload.side || "",
        },
      ]);
      return { ok: true, token };
    }
    case "importHouseholds": {
      const created = [];
      const extras = ls.get("sw:households", []);
      for (const line of (payload.csv || "").split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const [name, email = "", phone = "", lang = "fr"] = trimmed.split(/[,;]/).map((c) => c.trim().replace(/^"|"$/g, ""));
        if (!name || /^(nom|name)$/i.test(name)) continue;
        const token = makeLocalToken();
        extras.push({ token, name, email, phone, lang: ["fr", "en", "el"].includes(lang) ? lang : "fr" });
        created.push({ token, name });
      }
      ls.set("sw:households", extras);
      return { ok: true, created };
    }
    case "updateHousehold": {
      const { action, token, ...fields } = payload;
      const extras = ls.get("sw:households", []);
      const found = extras.find((h) => h.token === token);
      if (found) {
        ls.set("sw:households", extras.map((h) => (h.token === token ? { ...h, ...fields } : h)));
      } else {
        // Foyer d'exemple : on stocke la version modifiée par-dessus.
        const seed = SEED_HOUSEHOLDS.find((h) => h.token === token);
        ls.set("sw:householdEdits", { ...ls.get("sw:householdEdits", {}), [token]: { ...seed, ...fields } });
      }
      return { ok: true };
    }
    case "markSent": {
      const all = ls.get("sw:sends", {});
      all[payload.token] = { ...(all[payload.token] || {}), [payload.kind]: new Date().toISOString() };
      ls.set("sw:sends", all);
      return { ok: true };
    }
    case "removeHousehold":
      ls.set("sw:households", ls.get("sw:households", []).filter((h) => h.token !== payload.token));
      return { ok: true };
    case "publishNews":
      ls.set("sw:news", [
        { id: Date.now(), date: new Date().toISOString().slice(0, 10), audience: payload.audience, title: payload.title, body: payload.body, photo: payload.photo || null },
        ...ls.get("sw:news", SEED_NEWS),
      ]);
      return { ok: true };
    case "removeNews":
      ls.set("sw:news", ls.get("sw:news", SEED_NEWS).filter((n) => n.id !== payload.id));
      return { ok: true };
    case "approvePhoto":
      ls.set("sw:photos", ls.get("sw:photos", []).map((p) => (p.id === payload.id ? { ...p, approved: true } : p)));
      return { ok: true };
    case "removePhoto":
      ls.set("sw:photos", ls.get("sw:photos", []).filter((p) => p.id !== payload.id));
      return { ok: true };
    case "saveList":
      ls.set({ todos: "sw:todos", suppliers: "sw:suppliers", budget: "sw:budget" }[payload.list], payload.items);
      return { ok: true };
    case "setRole":
      ls.set("sw:role", payload.role);
      return { ok: true };
    default:
      return { ok: false };
  }
}

function makeLocalToken() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

// ---------- Réduction d'image avant envoi ----------
export function shrinkImage(file, maxSize = 900) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ---------- Export CSV des réponses ----------
function sideLabel(side) {
  return { themis: "Themis", thierry: "Thierry", both: "Les deux" }[side] || "";
}

export function rsvpsToCsv(households) {
  const rows = [[
    "Foyer", "Catégorie", "Côté", "Lien", "Statut", "Prénom", "Nom", "Type", "Âge",
    ...EVENT_IDS, "Arrivée", "Départ", "Email", "Téléphone", "Notes",
  ]];
  const blanks = EVENT_IDS.map(() => "");
  for (const h of households) {
    const r = h.rsvp;
    if (!r?.attending) {
      rows.push([h.name, h.category || "", sideLabel(h.side), h.token, "sans réponse", "", "", "", "", ...blanks, "", "", h.email, h.phone, ""]);
    } else if (r.attending === "no") {
      rows.push([h.name, h.category || "", sideLabel(h.side), h.token, "non", "", "", "", "", ...blanks, "", "", r.email || h.email, r.phone || h.phone, r.notes]);
    } else {
      for (const p of r.participants) {
        rows.push([
          h.name, h.category || "", sideLabel(h.side), h.token, "oui",
          p.firstName ?? p.name, p.lastName ?? "", p.type === "child" ? "enfant" : "adulte", p.age,
          ...EVENT_IDS.map((id) => (p.events?.[id] ? "oui" : "non")),
          r.arrival, r.departure, r.email || h.email, r.phone || h.phone, r.notes,
        ]);
      }
    }
  }
  return rows.map((row) => row.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function downloadCsv(households) {
  const blob = new Blob(["﻿" + rsvpsToCsv(households)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rsvps-spetses.csv";
  a.click();
  URL.revokeObjectURL(url);
}
