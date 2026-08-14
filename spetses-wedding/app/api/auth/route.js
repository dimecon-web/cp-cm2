import { db, isConfigured } from "@/lib/db";
import {
  currentUser, createSession, destroySession,
  hashPassword, verifyPassword, passwordProblem, setupCodeMatches,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

// Connexion, première définition de mot de passe, déconnexion, et mise à
// jour de son propre compte. Les trois comptes ont exactement les mêmes
// droits : rien ici ne dépend de qui est connecté.

export async function GET() {
  // setupReady : booléen seulement, jamais la valeur du code d'installation.
  const setupReady = Boolean(process.env.ADMIN_SETUP_CODE);
  if (!isConfigured) return Response.json({ configured: false, setupReady, user: null });
  const user = await currentUser();
  return Response.json({ configured: true, setupReady, user });
}

export async function POST(request) {
  if (!isConfigured) return Response.json({ error: "not_configured" }, { status: 503 });

  const body = await request.json();
  const email = (body.email || "").trim().toLowerCase();

  switch (body.action) {
    // Le formulaire demande d'abord si ce compte a déjà un mot de passe,
    // pour afficher « connexion » ou « première connexion ».
    case "probe": {
      const { data } = await db
        .from("wedding_users")
        .select("name, password_hash")
        .eq("email", email)
        .maybeSingle();
      if (!data) return Response.json({ known: false });
      return Response.json({ known: true, name: data.name, hasPassword: Boolean(data.password_hash) });
    }

    case "login": {
      const { data: user } = await db
        .from("wedding_users")
        .select("id, name, email, phone, password_hash, password_salt")
        .eq("email", email)
        .maybeSingle();

      const ok = user && (await verifyPassword(body.password || "", user.password_hash, user.password_salt));
      if (!ok) return Response.json({ error: "bad_credentials" }, { status: 401 });

      await createSession(user.id);
      await db.from("wedding_users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);
      return Response.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
    }

    // Première connexion : le compte existe mais n'a pas encore de mot de
    // passe. Le code d'installation évite qu'un tiers s'en empare.
    case "setPassword": {
      const { data: user } = await db
        .from("wedding_users")
        .select("id, name, email, phone, password_hash")
        .eq("email", email)
        .maybeSingle();

      if (!user) return Response.json({ error: "unknown_account" }, { status: 404 });
      if (user.password_hash) return Response.json({ error: "already_set" }, { status: 409 });
      if (!setupCodeMatches(body.setupCode)) return Response.json({ error: "bad_setup_code" }, { status: 401 });

      const problem = passwordProblem(body.password);
      if (problem) return Response.json({ error: "weak_password", message: problem }, { status: 400 });

      const { hash, salt } = await hashPassword(body.password);
      await db.from("wedding_users").update({ password_hash: hash, password_salt: salt }).eq("id", user.id);
      await createSession(user.id);
      return Response.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
    }

    case "logout": {
      await destroySession();
      return Response.json({ ok: true });
    }

    // Chacun met à jour ses propres coordonnées et son mot de passe.
    case "updateProfile": {
      const user = await currentUser();
      if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

      const patch = {};
      if (typeof body.phone === "string") patch.phone = body.phone.trim() || null;
      if (typeof body.newEmail === "string" && body.newEmail.trim()) {
        patch.email = body.newEmail.trim().toLowerCase();
      }

      if (body.password) {
        const { data: full } = await db
          .from("wedding_users")
          .select("password_hash, password_salt")
          .eq("id", user.id)
          .maybeSingle();
        const ok = await verifyPassword(body.currentPassword || "", full?.password_hash, full?.password_salt);
        if (!ok) return Response.json({ error: "bad_current_password" }, { status: 401 });

        const problem = passwordProblem(body.password);
        if (problem) return Response.json({ error: "weak_password", message: problem }, { status: 400 });

        const { hash, salt } = await hashPassword(body.password);
        patch.password_hash = hash;
        patch.password_salt = salt;
      }

      if (Object.keys(patch).length === 0) return Response.json({ ok: true });

      const { error } = await db.from("wedding_users").update(patch).eq("id", user.id);
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ ok: true });
    }

    default:
      return Response.json({ error: "unknown_action" }, { status: 400 });
  }
}
