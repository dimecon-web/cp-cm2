import "server-only";
import { db } from "./db";
import { mailConfigured, sendMail } from "./mail";
import { config } from "./config";

// Notification d'une actualité, envoyée à tout le monde sauf aux foyers qui
// ont répondu « non ». Un foyer sans réponse la reçoit : c'est souvent lui
// qu'il faut tenir informé.
//
// On ramasse toutes les adresses connues : celle du carnet d'adresses, celle
// laissée dans la réponse, et celle de chaque adulte nommé.

const VALID = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;

export async function notifyRecipients() {
  const [{ data: households }, { data: rsvps }, { data: people }] = await Promise.all([
    db.from("wedding_households").select("id, email, lang"),
    db.from("wedding_rsvps").select("household_id, attending, email"),
    db.from("wedding_participants").select("household_id, email"),
  ]);

  const answer = new Map((rsvps || []).map((r) => [r.household_id, r]));
  const byHousehold = new Map();
  for (const p of people || []) {
    if (!byHousehold.has(p.household_id)) byHousehold.set(p.household_id, []);
    byHousehold.get(p.household_id).push(p.email);
  }

  // Une adresse n'apparaît qu'une fois, même si deux foyers la partagent.
  const seen = new Set();
  const byLang = { fr: [], en: [], el: [] };

  for (const h of households || []) {
    const r = answer.get(h.id);
    if (r?.attending === "no") continue;
    const lang = ["fr", "en", "el"].includes(h.lang) ? h.lang : "fr";
    for (const raw of [h.email, r?.email, ...(byHousehold.get(h.id) || [])]) {
      const email = (raw || "").trim().toLowerCase();
      if (!VALID.test(email) || seen.has(email)) continue;
      seen.add(email);
      byLang[lang].push(email);
    }
  }
  return { byLang, total: seen.size };
}

const INTRO = {
  fr: "Des nouvelles du mariage",
  en: "News from the wedding",
  el: "Νέα από τον γάμο",
};
const OUTRO = {
  fr: "Tout est aussi sur votre page personnelle, via le lien que nous vous avons envoyé.",
  en: "Everything is also on your personal page, through the link we sent you.",
  el: "Όλα βρίσκονται και στη δική σας σελίδα, μέσω του συνδέσμου που σας στείλαμε.",
};
const REACH = {
  fr: "Pour nous joindre", en: "To reach us", el: "Για να επικοινωνήσετε μαζί μας",
};

function body(lang, title, text) {
  const contacts = config.couple.map((c) => `${c.name} — ${c.phone} — ${c.email}`).join("\n");
  return [
    title,
    "",
    text,
    "",
    OUTRO[lang],
    "",
    `— ${config.coupleNames}`,
    "",
    `${REACH[lang]} :`,
    contacts,
  ].join("\n");
}

// Envoie l'actualité, une fois par langue, en copie cachée.
export async function notifyNews({ title, text }) {
  if (!mailConfigured) {
    const { total } = await notifyRecipients();
    return { sent: 0, total, configured: false };
  }

  const { byLang, total } = await notifyRecipients();
  const pick = (obj, lang) => (obj?.[lang]?.trim() ? obj[lang] : obj?.fr || "");
  let sent = 0;
  const failures = [];

  for (const lang of ["fr", "en", "el"]) {
    const bcc = byLang[lang];
    if (!bcc.length) continue;
    const subject = pick(title, lang) || INTRO[lang];
    const res = await sendMail({
      to: process.env.MAIL_FROM,
      bcc,
      subject,
      text: body(lang, subject, pick(text, lang)),
    });
    if (res.sent) sent += bcc.length;
    else failures.push(`${lang}: ${res.reason}`);
  }
  return { sent, total, configured: true, failures };
}
