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

  const [households, news, photos, messages, todos, suppliers] = await Promise.all([
    db.from("wedding_households").select("*, wedding_rsvps(*), wedding_participants(*)").order("created_at"),
    db.from("wedding_news").select("*").order("published_at", { ascending: false }),
    db.from("wedding_photos").select("*, wedding_households(name)").order("created_at", { ascending: false }),
    db.from("wedding_messages").select("*, wedding_households(name)").order("created_at", { ascending: false }),
    db.from("wedding_todos").select("*"),
    db.from("wedding_suppliers").select("*"),
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
      const { name, email, phone, lang } = body;
      if (!name?.trim()) return Response.json({ error: "missing_name" }, { status: 400 });
      const token = await makeToken();
      const { error } = await db.from("wedding_households").insert({
        token,
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        lang: ["fr", "en", "el"].includes(lang) ? lang : "fr",
      });
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ ok: true, token });
    }

    case "importHouseholds": {
      const created = [];
      for (const line of (body.csv || "").split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const [name, email = "", phone = "", lang = "fr"] = trimmed
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
        });
        if (!error) created.push({ token, name });
      }
      return Response.json({ ok: true, created });
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
