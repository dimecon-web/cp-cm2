import { cookies } from "next/headers";
import { db, isConfigured, checkPassword, adminEnabled, rowToRsvp, rowToNews, rowToPhoto } from "@/lib/db";

export const dynamic = "force-dynamic";

const COOKIE = "sw_admin";
const TOKEN_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // sans caractères ambigus

async function currentRole() {
  const jar = await cookies();
  return checkPassword(jar.get(COOKIE)?.value);
}

async function makeToken() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const token = Array.from({ length: 6 }, () =>
      TOKEN_ALPHABET[Math.floor(Math.random() * TOKEN_ALPHABET.length)]
    ).join("");
    const { data } = await db.from("wedding_households").select("id").eq("token", token).maybeSingle();
    if (!data) return token;
  }
  throw new Error("token_generation_failed");
}

// Lecture de l'ensemble du tableau de bord.
export async function GET() {
  if (!isConfigured) return Response.json({ error: "not_configured" }, { status: 503 });
  const role = await currentRole();
  if (!role) return Response.json({ role: null }, { status: 401 });

  const [households, news, photos, messages, todos, suppliers, sends] = await Promise.all([
    db.from("wedding_households").select("*, wedding_rsvps(*), wedding_participants(*)").order("created_at"),
    db.from("wedding_news").select("*").order("published_at", { ascending: false }),
    db.from("wedding_photos").select("*, wedding_households(name)").order("created_at", { ascending: false }),
    db.from("wedding_messages").select("*, wedding_households(name)").order("created_at", { ascending: false }),
    db.from("wedding_todos").select("*"),
    db.from("wedding_suppliers").select("*"),
    db.from("wedding_sends").select("kind, channel, sent_at, wedding_households(token)"),
  ]);

  // Le budget ne quitte le serveur que pour le rôle « mariés ».
  const budget = role === "couple"
    ? (await db.from("wedding_budget_items").select("*")).data || []
    : null;

  return Response.json({
    role,
    households: (households.data || []).map((h) => {
      const rsvpRow = Array.isArray(h.wedding_rsvps) ? h.wedding_rsvps[0] : h.wedding_rsvps;
      const parts = h.wedding_participants || [];
      return {
        token: h.token,
        name: h.name,
        email: h.email || "",
        phone: h.phone || "",
        lang: h.lang,
        category: h.category || "",
        side: h.side || "",
        rsvp: rsvpRow || parts.length ? rowToRsvp(rsvpRow, parts) : null,
      };
    }),
    news: (news.data || []).map(rowToNews),
    photos: (photos.data || []).map((p) => rowToPhoto(p, p.wedding_households?.name || "")),
    messages: (messages.data || []).map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      message: m.body,
      date: m.created_at,
      handled: m.handled,
      householdName: m.wedding_households?.name || "",
    })),
    todos: todos.data || [],
    suppliers: suppliers.data || [],
    // { token: { saveDate: "2026-08-07T…", invite: … } } — dernier envoi par type
    sends: (sends.data || []).reduce((acc, s) => {
      const token = s.wedding_households?.token;
      if (!token) return acc;
      acc[token] = acc[token] || {};
      if (!acc[token][s.kind] || acc[token][s.kind] < s.sent_at) acc[token][s.kind] = s.sent_at;
      return acc;
    }, {}),
    budget,
  });
}

export async function POST(request) {
  if (!isConfigured) return Response.json({ error: "not_configured" }, { status: 503 });
  const body = await request.json();

  // --- Connexion / déconnexion ---
  if (body.action === "login") {
    if (!adminEnabled) return Response.json({ error: "no_password_set" }, { status: 503 });
    const role = checkPassword(body.password);
    if (!role) return Response.json({ error: "bad_password" }, { status: 401 });
    const jar = await cookies();
    jar.set(COOKIE, body.password, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return Response.json({ role });
  }

  if (body.action === "logout") {
    const jar = await cookies();
    jar.delete(COOKIE);
    return Response.json({ ok: true });
  }

  const role = await currentRole();
  if (!role) return Response.json({ error: "unauthorized" }, { status: 401 });

  switch (body.action) {
    case "addHousehold": {
      const { name, email, phone, lang, category, side } = body;
      if (!name?.trim()) return Response.json({ error: "missing_name" }, { status: 400 });
      const token = await makeToken();
      const { error } = await db.from("wedding_households").insert({
        token,
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        lang: ["fr", "en", "el"].includes(lang) ? lang : "fr",
        category: category?.trim() || null,
        side: ["themis", "thierry", "both"].includes(side) ? side : null,
      });
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ ok: true, token });
    }

    // Modification d'une fiche depuis la liste des invités.
    case "updateHousehold": {
      const { token, name, email, phone, lang, category, side } = body;
      if (!token) return Response.json({ error: "missing_token" }, { status: 400 });
      if (!name?.trim()) return Response.json({ error: "missing_name" }, { status: 400 });
      const { error } = await db
        .from("wedding_households")
        .update({
          name: name.trim(),
          email: email?.trim() || null,
          phone: phone?.trim() || null,
          lang: ["fr", "en", "el"].includes(lang) ? lang : "fr",
          category: category?.trim() || null,
          side: ["themis", "thierry", "both"].includes(side) ? side : null,
        })
        .eq("token", token);
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ ok: true });
    }

    case "importHouseholds": {
      const created = [];
      for (const line of (body.csv || "").split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const [name, email = "", phone = "", lang = "fr", category = "", side = ""] = trimmed
          .split(/[,;]/)
          .map((c) => c.trim().replace(/^"|"$/g, ""));
        if (!name || /^(nom|name)$/i.test(name)) continue;
        const token = await makeToken();
        const { error } = await db.from("wedding_households").insert({
          token,
          name,
          email: email || null,
          phone: phone || null,
          lang: ["fr", "en", "el"].includes(lang) ? lang : "fr",
          category: category || null,
          side: ["themis", "thierry", "both"].includes(side.toLowerCase()) ? side.toLowerCase() : null,
        });
        if (!error) created.push({ token, name });
      }
      return Response.json({ ok: true, created });
    }

    // Journalise un envoi : sert au suivi « qui a déjà reçu quoi ».
    case "markSent": {
      const { data: h } = await db
        .from("wedding_households")
        .select("id")
        .eq("token", body.token)
        .maybeSingle();
      if (!h) return Response.json({ error: "unknown_token" }, { status: 404 });
      const kind = ["saveDate", "invite", "reminder", "custom", "news"].includes(body.kind) ? body.kind : "news";
      const channel = body.channel === "whatsapp" ? "whatsapp" : "email";
      const { error } = await db.from("wedding_sends").insert({ household_id: h.id, kind, channel });
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ ok: true });
    }

    case "removeHousehold": {
      const { error } = await db.from("wedding_households").delete().eq("token", body.token);
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ ok: true });
    }

    case "publishNews": {
      const { error } = await db.from("wedding_news").insert({
        audience: body.audience === "yes" ? "yes" : "all",
        title: body.title,
        body: body.body,
        photo_url: body.photo || null,
      });
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ ok: true });
    }

    case "removeNews": {
      const { error } = await db.from("wedding_news").delete().eq("id", body.id);
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ ok: true });
    }

    case "approvePhoto": {
      const { error } = await db.from("wedding_photos").update({ approved: true }).eq("id", body.id);
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ ok: true });
    }

    case "removePhoto": {
      const { error } = await db.from("wedding_photos").delete().eq("id", body.id);
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ ok: true });
    }

    // Remplacement en bloc pour les listes simples de l'espace organisateurs.
    case "saveList": {
      const tables = {
        todos: "wedding_todos",
        suppliers: "wedding_suppliers",
        budget: "wedding_budget_items",
      };
      const table = tables[body.list];
      if (!table) return Response.json({ error: "unknown_list" }, { status: 400 });
      if (body.list === "budget" && role !== "couple") {
        return Response.json({ error: "forbidden" }, { status: 403 });
      }
      await db.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      // Les champs vides deviennent NULL : une date vide ferait échouer l'insertion.
      const rows = (body.items || []).map(({ id, ...rest }) =>
        Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v === "" ? null : v]))
      );
      if (rows.length) {
        const { error } = await db.from(table).insert(rows);
        if (error) return Response.json({ error: error.message }, { status: 500 });
      }
      return Response.json({ ok: true });
    }

    default:
      return Response.json({ error: "unknown_action" }, { status: 400 });
  }
}
