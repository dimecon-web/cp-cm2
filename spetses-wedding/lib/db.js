import "server-only";
import { createClient } from "@supabase/supabase-js";

// Accès à la base, exclusivement côté serveur.
// La clé de service ne quitte jamais le serveur : les pages appellent les
// routes de app/api/, qui vérifient le jeton du foyer ou le mot de passe
// organisateur avant de toucher aux données.

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isConfigured = Boolean(url && serviceKey);

export const db = isConfigured
  ? createClient(url, serviceKey, { auth: { persistSession: false } })
  : null;

// Conversions entre le format de la base (colonnes) et celui de l'application.
export function rowToRsvp(rsvp, participants) {
  return {
    attending: rsvp?.attending ?? null,
    email: rsvp?.email ?? "",
    phone: rsvp?.phone ?? "",
    arrival: rsvp?.arrival ?? "",
    departure: rsvp?.departure ?? "",
    transport: rsvp?.transport ?? "",
    accommodation: rsvp?.accommodation ?? "",
    notes: rsvp?.notes ?? "",
    updatedAt: rsvp?.updated_at ?? null,
    participants: (participants || [])
      .sort((a, b) => a.position - b.position)
      .map((p) => ({
        firstName: p.first_name ?? "",
        lastName: p.last_name ?? "",
        name: p.name,
        type: p.type,
        age: p.age == null ? "" : String(p.age),
        events: p.events || {},
      })),
  };
}

export function rowToNews(row) {
  return {
    id: row.id,
    date: (row.published_at || "").slice(0, 10),
    audience: row.audience,
    photo: row.photo_url,
    title: row.title,
    body: row.body,
  };
}

export function rowToPhoto(row, householdName = "") {
  return {
    id: row.id,
    caption: row.caption ?? "",
    dataUrl: row.url,
    approved: row.approved,
    date: row.created_at,
    householdName,
  };
}
