"use client";

// Couche de données v1 (mode démo) : localStorage + données seed.
// En v2, ces fonctions seront remplacées par des appels Supabase
// (même signatures — voir supabase/schema.sql pour le modèle cible).

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

// ---------- Foyers invités (seed démo) ----------
// En production : table `households`, un token unique par foyer.

export const SEED_HOUSEHOLDS = [
  { token: "demo", name: "Famille Démo", email: "", phone: "", lang: "fr" },
  { token: "a7f2k9", name: "Sophie & Marc Durand", email: "sophie.durand@example.com", phone: "+33600000001", lang: "fr" },
  { token: "b3x8m1", name: "The Wilson family", email: "wilsons@example.com", phone: "+44700000002", lang: "en" },
  { token: "c9p4t6", name: "Οικογένεια Παπαδόπουλου", email: "", phone: "+30690000003", lang: "el" },
  { token: "d5r2w8", name: "Léa Martin", email: "lea.martin@example.com", phone: "", lang: "fr" },
  { token: "e1q7z3", name: "Famille Ben Salah", email: "bensalah@example.com", phone: "+33600000005", lang: "fr" },
  { token: "f8n3v5", name: "Anna & Jens Müller", email: "", phone: "+49150000006", lang: "en" },
  { token: "g4h9j2", name: "Nikos & Eleni", email: "nikos.eleni@example.com", phone: "+30690000007", lang: "el" },
];

// Réponses RSVP simulées pour rendre le tableau de bord parlant.
const SEED_RSVPS = {
  a7f2k9: {
    attending: "yes",
    email: "sophie.durand@example.com",
    participants: [
      { name: "Sophie Durand", type: "adult", age: "", diet: "none", dietNote: "", events: { party: true, tour: true, wedding: true, brunch: true } },
      { name: "Marc Durand", type: "adult", age: "", diet: "none", dietNote: "", events: { party: true, tour: false, wedding: true, brunch: true } },
      { name: "Jules Durand", type: "child", age: "7", diet: "allergy", dietNote: "Arachides (grave)", events: { party: false, tour: false, wedding: true, brunch: true } },
    ],
    arrival: "2027-06-02",
    departure: "2027-06-07",
    transport: "plane",
    accommodation: "booked",
    notes: "On a trop hâte !",
    updatedAt: "2026-07-20T10:00:00Z",
  },
  b3x8m1: {
    attending: "yes",
    email: "wilsons@example.com",
    participants: [
      { name: "Emma Wilson", type: "adult", age: "", diet: "veg", dietNote: "", events: { party: true, tour: true, wedding: true, brunch: false } },
      { name: "James Wilson", type: "adult", age: "", diet: "none", dietNote: "", events: { party: true, tour: true, wedding: true, brunch: false } },
    ],
    arrival: "2027-06-03",
    departure: "2027-06-06",
    transport: "plane",
    accommodation: "searching",
    notes: "",
    updatedAt: "2026-07-25T09:00:00Z",
  },
  d5r2w8: {
    attending: "no",
    email: "lea.martin@example.com",
    participants: [],
    arrival: "",
    departure: "",
    transport: "",
    accommodation: "",
    notes: "Je serai à l'étranger, pardon…",
    updatedAt: "2026-07-22T18:30:00Z",
  },
  g4h9j2: {
    attending: "yes",
    email: "nikos.eleni@example.com",
    participants: [
      { name: "Nikos K.", type: "adult", age: "", diet: "none", dietNote: "", events: { party: true, tour: false, wedding: true, brunch: true } },
      { name: "Eleni K.", type: "adult", age: "", diet: "none", dietNote: "", events: { party: true, tour: false, wedding: true, brunch: true } },
    ],
    arrival: "2027-06-04",
    departure: "2027-06-06",
    transport: "ferry",
    accommodation: "booked",
    notes: "",
    updatedAt: "2026-08-01T12:00:00Z",
  },
};

export function getHousehold(token) {
  const extras = ls.get("sw:households", []);
  return [...SEED_HOUSEHOLDS, ...extras].find((h) => h.token === token) || null;
}

export function getAllHouseholds() {
  const extras = ls.get("sw:households", []);
  return [...SEED_HOUSEHOLDS, ...extras];
}

// Token court, sans caractères ambigus (0/O, 1/l) — il finit sur un faire-part.
export function makeToken() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let token;
  do {
    token = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  } while (getHousehold(token));
  return token;
}

export function addHousehold({ name, email = "", phone = "", lang = "fr" }) {
  const household = { token: makeToken(), name, email, phone, lang };
  ls.set("sw:households", [...ls.get("sw:households", []), household]);
  return household;
}

// Import CSV : « nom,email,téléphone,langue » — une ligne par foyer,
// en-tête optionnel. Renvoie les foyers créés.
export function importHouseholdsCsv(text) {
  const created = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const [name, email = "", phone = "", lang = "fr"] = line
      .split(/[,;]/)
      .map((c) => c.trim().replace(/^"|"$/g, ""));
    if (!name || /^(nom|name)$/i.test(name)) continue;
    created.push(addHousehold({ name, email, phone, lang: ["fr", "en", "el"].includes(lang) ? lang : "fr" }));
  }
  return created;
}

export function removeHousehold(token) {
  ls.set("sw:households", ls.get("sw:households", []).filter((h) => h.token !== token));
}

// Destinataires d'un envoi d'actualité (choix D1b) : tous, ou seulement les « oui ».
export function recipientsFor(audience) {
  return getAllHouseholds()
    .filter((h) => {
      if (audience !== "yes") return true;
      return getRsvp(h.token)?.attending === "yes";
    })
    .map((h) => ({ ...h, email: getRsvp(h.token)?.email || h.email }))
    .filter((h) => h.email);
}

export function emptyRsvp() {
  const events = Object.fromEntries(EVENT_IDS.map((id) => [id, id === "wedding"]));
  return {
    attending: null,
    email: "",
    participants: [{ name: "", type: "adult", age: "", diet: "none", dietNote: "", events: { ...events } }],
    arrival: "",
    departure: "",
    transport: "",
    accommodation: "",
    notes: "",
    updatedAt: null,
  };
}

export function getRsvp(token) {
  return ls.get(`sw:rsvp:${token}`, SEED_RSVPS[token] || null);
}

export function saveRsvp(token, rsvp) {
  ls.set(`sw:rsvp:${token}`, { ...rsvp, updatedAt: new Date().toISOString() });
}

// ---------- Actualités (choix D1) ----------
// audience : 'all' = tous les foyers, 'yes' = seulement ceux qui ont dit oui.
export const SEED_NEWS = [
  {
    id: 1,
    date: "2026-07-01",
    audience: "all",
    photo: null,
    title: { fr: "Le site est ouvert !", en: "The website is live!", el: "Η ιστοσελίδα άνοιξε!" },
    body: {
      fr: "Bienvenue sur notre site de mariage. Première mission : répondez au RSVP, ça nous aide énormément pour la suite.",
      en: "Welcome to our wedding website. First mission: reply to the RSVP — it helps us enormously.",
      el: "Καλώς ήρθατε στην ιστοσελίδα του γάμου μας. Πρώτη αποστολή: απαντήστε στο RSVP!",
    },
  },
  {
    id: 2,
    date: "2026-08-01",
    audience: "all",
    photo: null,
    title: { fr: "Pensez aux ferries", en: "Think about ferries", el: "Σκεφτείτε τα πλοία" },
    body: {
      fr: "Les billets de ferry Le Pirée → Spetses s'ouvrent à la réservation environ 3 mois avant. On vous fera signe au bon moment.",
      en: "Piraeus → Spetses ferry tickets open for booking about 3 months ahead. We'll nudge you at the right time.",
      el: "Τα εισιτήρια Πειραιάς → Σπέτσες ανοίγουν περίπου 3 μήνες πριν. Θα σας ειδοποιήσουμε.",
    },
  },
];

export const newsStore = {
  all: () => ls.get("sw:news", SEED_NEWS),
  save: (items) => ls.set("sw:news", items),
  add(post) {
    const all = this.all();
    this.save([{ ...post, id: Date.now(), date: new Date().toISOString().slice(0, 10) }, ...all]);
  },
  remove(id) {
    this.save(this.all().filter((p) => p.id !== id));
  },
};

// Actualités visibles par un foyer donné (filtre d'audience).
export function newsForHousehold(token) {
  const rsvp = getRsvp(token);
  return newsStore
    .all()
    .filter((p) => p.audience !== "yes" || rsvp?.attending === "yes")
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

// ---------- Mur de photos des invités, avec modération (choix D1d) ----------
export const photoStore = {
  all: () => ls.get("sw:photos", []),
  save: (items) => ls.set("sw:photos", items),
  approved() {
    return this.all().filter((p) => p.approved).sort((a, b) => (a.date < b.date ? 1 : -1));
  },
  pending() {
    return this.all().filter((p) => !p.approved);
  },
  submit(photo) {
    this.save([{ ...photo, id: Date.now(), date: new Date().toISOString(), approved: false }, ...this.all()]);
  },
  approve(id) {
    this.save(this.all().map((p) => (p.id === id ? { ...p, approved: true } : p)));
  },
  remove(id) {
    this.save(this.all().filter((p) => p.id !== id));
  },
};

// Réduit une image choisie par l'invité avant stockage (démo : localStorage).
// En v2, l'upload ira dans Supabase Storage sans cette contrainte de taille.
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

// ---------- Messages de contact ----------
export function getMessages() {
  return ls.get("sw:messages", []);
}
export function addMessage(msg) {
  const all = getMessages();
  all.unshift({ ...msg, id: Date.now(), date: new Date().toISOString() });
  ls.set("sw:messages", all);
}

// ---------- Espace organisateurs : budget / to-dos / fournisseurs ----------
const SEED_BUDGET = [
  { id: 1, label: "Lieu de réception", planned: 12000, actual: 0, deposit: 3000, due: "2026-10-01" },
  { id: 2, label: "Traiteur", planned: 9000, actual: 0, deposit: 0, due: "2026-12-01" },
  { id: 3, label: "DJ / musique", planned: 2000, actual: 0, deposit: 500, due: "2027-01-15" },
  { id: 4, label: "Photographe", planned: 2500, actual: 0, deposit: 0, due: "2027-02-01" },
];

const SEED_TODOS = [
  { id: 1, label: "Confirmer le lieu de réception", who: "Les mariés", due: "2026-09-15", done: false },
  { id: 2, label: "Liste d'hôtels à recommander", who: "Témoin 1", due: "2026-09-30", done: false },
  { id: 3, label: "Envoyer les invitations", who: "Les mariés", due: "2026-10-15", done: false },
];

const SEED_SUPPLIERS = [
  { id: 1, name: "Poseidonion Grand Hotel", role: "Lieu / hébergement", phone: "+30 22980 74553", email: "info@example.com", notes: "Devis demandé pour la réception." },
  { id: 2, name: "Water taxis Spetses", role: "Transport invités", phone: "+30 22980 72072", email: "", notes: "Tarifs de groupe à négocier." },
];

function makeCrud(key, seed) {
  return {
    all: () => ls.get(key, seed),
    save: (items) => ls.set(key, items),
  };
}

export const budgetStore = makeCrud("sw:budget", SEED_BUDGET);
export const todoStore = makeCrud("sw:todos", SEED_TODOS);
export const supplierStore = makeCrud("sw:suppliers", SEED_SUPPLIERS);

// ---------- Rôle organisateur (démo) ----------
export function getRole() {
  return ls.get("sw:role", "couple"); // 'couple' | 'organisateur'
}
export function setRole(role) {
  ls.set("sw:role", role);
}

// ---------- Export CSV ----------
export function rsvpsToCsv() {
  const rows = [
    ["Foyer", "Token", "Statut", "Participant", "Type", "Âge", "Alimentation", "Détail allergie", ...EVENT_IDS, "Arrivée", "Départ", "Transport", "Hébergement", "Email", "Notes"],
  ];
  for (const h of getAllHouseholds()) {
    const r = getRsvp(h.token);
    if (!r) {
      rows.push([h.name, h.token, "sans réponse", "", "", "", "", "", ...EVENT_IDS.map(() => ""), "", "", "", "", h.email, ""]);
      continue;
    }
    if (r.attending === "no") {
      rows.push([h.name, h.token, "non", "", "", "", "", "", ...EVENT_IDS.map(() => ""), "", "", "", "", r.email || h.email, r.notes]);
      continue;
    }
    for (const p of r.participants) {
      rows.push([
        h.name, h.token, "oui", p.name, p.type === "child" ? "enfant" : "adulte", p.age,
        p.diet, p.dietNote,
        ...EVENT_IDS.map((id) => (p.events?.[id] ? "oui" : "non")),
        r.arrival, r.departure, r.transport, r.accommodation, r.email || h.email, r.notes,
      ]);
    }
  }
  return rows.map((row) => row.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function downloadCsv() {
  const blob = new Blob(["﻿" + rsvpsToCsv()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rsvps-spetses.csv";
  a.click();
  URL.revokeObjectURL(url);
}
