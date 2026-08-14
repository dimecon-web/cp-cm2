import { db, isConfigured } from "@/lib/db";
import {
  currentUser, createSession, destroySession, revokeSessions,
  hashPassword, verifyPassword, passwordProblem, setupCodeMatches,
  createResetToken, readResetToken, consumeResetToken,
} from "@/lib/auth";
import { mailConfigured, sendMail } from "@/lib/mail";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

const now = () => new Date().toISOString();

// L'adresse publique du site, telle que le navigateur l'a jointe : le lien
// de réinitialisation doit ramener sur le même domaine.
function siteUrl(request) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

function resetEmail(name, link, minutes) {
  return [
    `Bonjour ${name},`,
    "",
    "Vous avez demandé à réinitialiser votre mot de passe pour l'espace",
    `organisateurs du mariage de ${config.coupleNames}.`,
    "",
    `Choisissez un nouveau mot de passe ici (lien valable ${minutes} minutes,`,
    "utilisable une seule fois) :",
    link,
    "",
    "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message :",
    "votre mot de passe actuel reste valable.",
    "",
    `— Site du mariage de ${config.coupleNames}, Spetses`,
  ].join("\n");
}

// Connexion, première définition de mot de passe, déconnexion, et mise à
// jour de son propre compte. Les trois comptes ont exactement les mêmes
// droits : rien ici ne dépend de qui est connecté.

export async function GET() {
  // setupReady : booléen seulement, jamais la valeur du code d'installation.
  const setupReady = Boolean(process.env.ADMIN_SETUP_CODE);
  const mailReady = mailConfigured;
  if (!isConfigured) return Response.json({ configured: false, setupReady, mailReady, user: null });
  const user = await currentUser();
  return Response.json({ configured: true, setupReady, mailReady, user });
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
      await db.from("wedding_users").update({ last_login_at: now() }).eq("id", user.id);
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
      await db
        .from("wedding_users")
        .update({ password_hash: hash, password_salt: salt, last_login_at: now() })
        .eq("id", user.id);
      await createSession(user.id);
      return Response.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
    }

    // ---------- Mot de passe oublié ----------

    // Envoi du lien. La réponse est identique que l'adresse existe ou non :
    // un inconnu ne peut pas s'en servir pour deviner qui a un accès.
    case "requestReset": {
      if (!mailConfigured) return Response.json({ error: "mail_not_configured" }, { status: 503 });

      const { data: user } = await db
        .from("wedding_users")
        .select("id, name, email")
        .eq("email", email)
        .maybeSingle();

      if (user) {
        const { token, minutes } = await createResetToken(user.id);
        const link = `${siteUrl(request)}/reinitialiser?token=${token}`;
        const { sent, reason } = await sendMail({
          to: user.email,
          subject: `Réinitialiser votre mot de passe — mariage de ${config.coupleNames}`,
          text: resetEmail(user.name, link, minutes),
        });
        // Un échec d'envoi est un problème de serveur, pas un secret : on le
        // dit, sinon la personne attend un email qui n'arrivera jamais.
        if (!sent) {
          console.error("Envoi du lien de réinitialisation refusé :", reason);
          return Response.json({ error: "mail_failed" }, { status: 502 });
        }
      }
      return Response.json({ ok: true });
    }

    // La page de réinitialisation vérifie le lien avant d'afficher le
    // formulaire, pour ne pas faire saisir un mot de passe pour rien.
    case "checkReset": {
      const entry = await readResetToken(body.token);
      if (!entry) return Response.json({ valid: false });
      return Response.json({ valid: true, name: entry.user.name, email: entry.user.email });
    }

    case "resetPassword": {
      const entry = await readResetToken(body.token);
      if (!entry) return Response.json({ error: "invalid_token" }, { status: 400 });

      const problem = passwordProblem(body.password);
      if (problem) return Response.json({ error: "weak_password", message: problem }, { status: 400 });

      const { hash, salt } = await hashPassword(body.password);
      await db
        .from("wedding_users")
        .update({ password_hash: hash, password_salt: salt, last_login_at: now() })
        .eq("id", entry.user.id);
      await consumeResetToken(entry.id);
      // Toute session ouverte ailleurs est fermée avant d'en ouvrir une ici.
      await revokeSessions(entry.user.id);
      await createSession(entry.user.id);

      const { id, name, phone } = entry.user;
      return Response.json({ user: { id, name, email: entry.user.email, phone } });
    }

    // ---------- Entraide entre organisateurs ----------
    // Les trois comptes ont les mêmes droits : chacun peut remettre le compte
    // d'un autre à sa première connexion. C'est la voie de secours quand
    // l'email ne passe pas — la personne rechoisit son mot de passe avec le
    // code d'installation.
    case "listUsers": {
      const me = await currentUser();
      if (!me) return Response.json({ error: "unauthorized" }, { status: 401 });
      const { data } = await db
        .from("wedding_users")
        .select("id, name, email, password_hash, last_login_at")
        .order("name");
      return Response.json({
        users: (data || []).map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          hasPassword: Boolean(u.password_hash),
          lastLoginAt: u.last_login_at,
          isSelf: u.id === me.id,
        })),
      });
    }

    case "clearAccess": {
      const me = await currentUser();
      if (!me) return Response.json({ error: "unauthorized" }, { status: 401 });
      if (!body.targetId || body.targetId === me.id) {
        return Response.json({ error: "not_yourself" }, { status: 400 });
      }
      await db
        .from("wedding_users")
        .update({ password_hash: null, password_salt: null })
        .eq("id", body.targetId);
      await revokeSessions(body.targetId);
      await db.from("wedding_password_resets").delete().eq("user_id", body.targetId);
      return Response.json({ ok: true });
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
