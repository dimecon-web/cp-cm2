"use client";

// Accès aux données depuis le navigateur.
//
// Tout passe par les routes de app/api/, qui vérifient côté serveur le jeton
// du foyer (invités) ou la session (organisateurs). Le navigateur ne joint
// jamais la base directement et ne détient aucune clé.

import { EVENT_IDS } from "./config";

// ---------- État de la configuration (une seule requête, mise en cache) ----------
let modePromise = null;

export function getMode() {
  if (!modePromise) {
    modePromise = fetch("/api/status")
      .then((r) => r.json())
      .catch(() => ({ configured: false }));
  }
  return modePromise;
}

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
export async function loadGuest(token) {
  const res = await fetch(`/api/guest/${encodeURIComponent(token)}`);
  if (res.status === 404) return { household: null, rsvp: null, news: [], photos: [] };
  if (!res.ok) throw new Error("guest_load_failed");
  return res.json();
}

export async function saveRsvp(token, rsvp) {
  const res = await fetch(`/api/guest/${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(rsvp),
  });
  if (!res.ok) throw new Error("rsvp_save_failed");
}

export async function submitPhoto(token, { dataUrl, caption }) {
  const res = await fetch("/api/public", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "photo", token, dataUrl, caption }),
  });
  if (!res.ok) throw new Error("photo_failed");
}

export async function sendMessage(token, { name, email, message }) {
  const res = await fetch("/api/public", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "contact", token, name, email, message }),
  });
  if (!res.ok) throw new Error("message_failed");
}

// ---------- Comptes organisateurs ----------
async function authPost(payload) {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, ...data };
}

export const probeAccount = (email) => authPost({ action: "probe", email });
export const login = (email, password) => authPost({ action: "login", email, password });
export const setPassword = (email, password, setupCode) =>
  authPost({ action: "setPassword", email, password, setupCode });
export const logout = () => authPost({ action: "logout" });
export const updateProfile = (patch) => authPost({ action: "updateProfile", ...patch });

export async function loadSession() {
  const res = await fetch("/api/auth");
  if (!res.ok) return { configured: false, user: null };
  return res.json();
}

// ---------- Espace organisateurs ----------
export async function adminLoad() {
  const res = await fetch("/api/admin");
  if (res.status === 401) return { user: null };
  if (!res.ok) throw new Error("admin_load_failed");
  return res.json();
}

export async function adminAction(payload) {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`action_failed:${payload.action}`);
  return res.json();
}

// ---------- Récupération d'une saisie faite avant la mise en base ----------
// Les foyers saisis quand l'application n'était pas encore reliée à la base
// sont restés dans ce navigateur. Ces deux fonctions permettent de les
// retrouver et de les verser en base, puis d'effacer la copie locale.
const LOCAL_KEY = "sw:households";

export function localHouseholds() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function localHouseholdsAsCsv() {
  return localHouseholds()
    .map((h) => [h.name, h.email || "", h.phone || "", h.lang || "fr", h.category || "", h.side || ""].join(","))
    .join("\n");
}

export function clearLocalHouseholds() {
  if (typeof window !== "undefined") localStorage.removeItem(LOCAL_KEY);
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
  a.download = "invites-spetses.csv";
  a.click();
  URL.revokeObjectURL(url);
}
