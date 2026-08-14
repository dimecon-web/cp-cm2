import "server-only";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { db, isConfigured } from "./db";

// Authentification de l'espace organisateurs.
//
// Les mots de passe ne sont jamais stockés ni transmis en clair : ils sont
// dérivés avec scrypt et un sel propre à chaque compte. Le navigateur ne
// détient qu'un jeton de session aléatoire, dans un cookie inaccessible au
// JavaScript de la page.

const scryptAsync = promisify(scrypt);

export const SESSION_COOKIE = "sw_session";
const SESSION_DAYS = 30;
const KEY_LENGTH = 64;
const RESET_MINUTES = 60;

export const MIN_PASSWORD_LENGTH = 10;

async function derive(password, salt) {
  const key = await scryptAsync(password.normalize("NFKC"), salt, KEY_LENGTH);
  return key.toString("hex");
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return { hash: await derive(password, salt), salt };
}

export async function verifyPassword(password, hash, salt) {
  if (!hash || !salt) return false;
  const candidate = Buffer.from(await derive(password, salt), "hex");
  const expected = Buffer.from(hash, "hex");
  // Comparaison à temps constant : ne renseigne pas un attaquant sur le
  // nombre de caractères corrects.
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

export function passwordProblem(password) {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`;
  }
  return null;
}

// Le code d'installation protège la toute première connexion de chaque
// compte : sans lui, connaître une adresse email ne suffit pas à s'attribuer
// le compte correspondant.
export function setupCodeMatches(code) {
  const expected = process.env.ADMIN_SETUP_CODE;
  if (!expected) return false;
  const a = Buffer.from(String(code || ""));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createSession(userId) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.from("wedding_sessions").insert({ token, user_id: userId, expires_at: expires.toISOString() });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires,
    path: "/",
  });
  return token;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.from("wedding_sessions").delete().eq("token", token);
  jar.delete(SESSION_COOKIE);
}

// Renvoie l'utilisateur connecté, ou null. Les sessions expirées sont
// refusées et nettoyées au passage.
export async function currentUser() {
  if (!isConfigured) return null;
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const { data } = await db
    .from("wedding_sessions")
    .select("expires_at, wedding_users(id, name, email, phone)")
    .eq("token", token)
    .maybeSingle();

  if (!data) return null;
  if (new Date(data.expires_at) < new Date()) {
    await db.from("wedding_sessions").delete().eq("token", token);
    return null;
  }
  return data.wedding_users || null;
}

// Ferme toutes les sessions d'un compte, partout. Utilisé après une
// réinitialisation : si quelqu'un s'était introduit, il est éjecté.
export async function revokeSessions(userId) {
  await db.from("wedding_sessions").delete().eq("user_id", userId);
}

// ---------- Mot de passe oublié ----------
//
// Le lien envoyé par email contient un jeton aléatoire de 32 octets. La base
// n'en garde que l'empreinte : même en cas de fuite du contenu de la table,
// on ne peut pas reconstituer un lien valable. Un jeton vaut une heure et ne
// sert qu'une fois.

const digest = (token) => createHash("sha256").update(String(token)).digest("hex");

export async function createResetToken(userId) {
  // Une seule demande valable à la fois : redemander annule la précédente.
  await db.from("wedding_password_resets").delete().eq("user_id", userId).is("used_at", null);

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + RESET_MINUTES * 60000);
  await db.from("wedding_password_resets").insert({
    user_id: userId,
    token_hash: digest(token),
    expires_at: expires.toISOString(),
  });
  return { token, expires, minutes: RESET_MINUTES };
}

export async function readResetToken(token) {
  if (!token) return null;
  const { data } = await db
    .from("wedding_password_resets")
    .select("id, expires_at, used_at, wedding_users(id, name, email, phone)")
    .eq("token_hash", digest(token))
    .maybeSingle();

  if (!data || data.used_at) return null;
  if (new Date(data.expires_at) < new Date()) return null;
  if (!data.wedding_users) return null;
  return { id: data.id, user: data.wedding_users };
}

export async function consumeResetToken(id) {
  await db.from("wedding_password_resets").update({ used_at: new Date().toISOString() }).eq("id", id);
}
