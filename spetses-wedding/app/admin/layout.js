"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AdminProvider, useAdmin } from "@/lib/admin";
import { probeAccount, login, setPassword, logout, requestReset } from "@/lib/store";

export default function AdminLayout({ children }) {
  return (
    <AdminProvider>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}

function AdminShell({ children }) {
  const pathname = usePathname();
  const { session, user, loading, reload } = useAdmin();

  if (loading) {
    return (
      <main className="page">
        <div className="wrap"><p className="hint">Chargement…</p></div>
      </main>
    );
  }

  if (!session?.configured) return <NotConfigured />;
  if (!user) {
    return <LoginScreen onSuccess={reload} setupReady={session.setupReady} mailReady={session.mailReady} />;
  }

  const links = [
    ["/admin", "Tableau de bord"],
    ["/admin/invites", "Invités & envois"],
    ["/admin/news", "Actualités"],
    ["/admin/budget", "Budget"],
    ["/admin/todos", "To-dos"],
    ["/admin/fournisseurs", "Fournisseurs"],
    ["/admin/compte", "Mon compte"],
  ];

  return (
    <>
      <header className="admin-header">
        <div className="wrap">
          <strong style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: 18 }}>
            Espace organisateurs
          </strong>
          <nav className="admin-nav" aria-label="Navigation organisateurs">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className={pathname === href ? "active" : ""}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="role-switch">
            <span>{user.name}</span>
            <button onClick={async () => { await logout(); reload(); }}>Se déconnecter</button>
          </div>
        </div>
      </header>
      <main className="page">
        <div className="wrap">{children}</div>
      </main>
    </>
  );
}

function NotConfigured() {
  return (
    <div className="landing">
      <h1>Configuration incomplète</h1>
      <p style={{ color: "var(--muted)", maxWidth: "48ch" }}>
        L'application n'est pas reliée à sa base de données. Ajoutez les variables
        d'environnement <code>SUPABASE_URL</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code> et
        <code> ADMIN_SETUP_CODE</code> dans les réglages Vercel, puis redéployez.
      </p>
      <p style={{ marginTop: 24, fontSize: 13 }}><Link href="/">Retour à l'accueil</Link></p>
    </div>
  );
}

// Connexion en deux temps : on saisit d'abord son adresse, puis soit le mot
// de passe, soit — à la première connexion — le code d'installation et le
// mot de passe que l'on choisit.
function LoginScreen({ onSuccess, setupReady, mailReady }) {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("email");   // email | password | create | sent
  const [account, setAccount] = useState(null);
  const [password, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submitEmail = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await probeAccount(email);
    setBusy(false);
    if (!res.known) {
      setError("Cette adresse ne correspond à aucun compte.");
      return;
    }
    setAccount(res);
    setStep(res.hasPassword ? "password" : "create");
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await login(email, password);
    setBusy(false);
    if (res.ok) onSuccess();
    else setError("Mot de passe incorrect.");
  };

  // Mot de passe oublié : le serveur envoie un lien à l'adresse du compte.
  const askReset = async () => {
    setBusy(true);
    setError("");
    const res = await requestReset(email);
    setBusy(false);
    if (res.ok) setStep("sent");
    else if (res.error === "mail_not_configured") {
      setError("L'envoi d'emails n'est pas encore configuré sur le serveur. Demandez à Dimitri, Themis ou Thierry de réinitialiser votre accès depuis « Mon compte » : vous pourrez alors rechoisir un mot de passe avec le code d'installation.");
    } else setError("L'envoi du lien a échoué. Réessayez dans un instant.");
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await setPassword(email, password, setupCode);
    setBusy(false);
    if (res.ok) onSuccess();
    else if (res.error === "bad_setup_code") setError("Code d'installation incorrect.");
    else setError(res.message || "Impossible de définir le mot de passe.");
  };

  return (
    <div className="landing">
      <h1>Espace organisateurs</h1>

      {step === "email" && (
        <>
          <p style={{ color: "var(--muted)", maxWidth: "40ch" }}>
            Connectez-vous avec votre adresse email.
          </p>
          <form onSubmit={submitEmail} style={{ display: "flex", gap: 10, width: "min(380px, 100%)" }}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email" aria-label="Adresse email" autoFocus required />
            <button className="btn" type="submit" disabled={busy}>{busy ? "…" : "Continuer"}</button>
          </form>
        </>
      )}

      {step === "password" && (
        <>
          <p style={{ color: "var(--muted)" }}>Bonjour {account?.name} 👋</p>
          <form onSubmit={submitPassword} style={{ display: "flex", gap: 10, width: "min(380px, 100%)" }}>
            <input type="password" value={password} onChange={(e) => setPwd(e.target.value)}
              placeholder="Mot de passe" aria-label="Mot de passe" autoFocus required />
            <button className="btn" type="submit" disabled={busy}>{busy ? "…" : "Entrer"}</button>
          </form>
          <p style={{ marginTop: 14, fontSize: 13 }}>
            <button className="link-name" onClick={askReset} disabled={busy}>
              Mot de passe oublié ?
            </button>
            {mailReady === false && (
              <span className="hint"> — l'envoi d'emails n'est pas encore configuré.</span>
            )}
          </p>
        </>
      )}

      {step === "sent" && (
        <>
          <p style={{ maxWidth: "44ch" }}>
            Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation
            vient d'y être envoyé.
          </p>
          <p style={{ color: "var(--muted)", maxWidth: "44ch" }}>
            Le lien est valable une heure et ne sert qu'une fois. Pensez à regarder
            dans les indésirables.
          </p>
        </>
      )}

      {step === "create" && !setupReady && (
        <p style={{ color: "var(--danger)", maxWidth: "44ch" }}>
          Aucun code d'installation n'est défini sur le serveur. Ajoutez la variable
          <code> ADMIN_SETUP_CODE</code> dans les réglages Vercel, redéployez, puis
          revenez créer votre mot de passe.
        </p>
      )}

      {step === "create" && setupReady && (
        <>
          <p style={{ color: "var(--muted)", maxWidth: "42ch" }}>
            Bonjour {account?.name} ! Première connexion : choisissez votre mot de passe.
            Le code d'installation vous a été communiqué par Dimitri.
          </p>
          <form onSubmit={submitCreate} style={{ display: "grid", gap: 10, width: "min(380px, 100%)" }}>
            <input type="text" value={setupCode} onChange={(e) => setSetupCode(e.target.value)}
              placeholder="Code d'installation" aria-label="Code d'installation" autoFocus required />
            <input type="password" value={password} onChange={(e) => setPwd(e.target.value)}
              placeholder="Mot de passe (10 caractères minimum)" aria-label="Mot de passe" required />
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirmez le mot de passe" aria-label="Confirmation" required />
            <button className="btn" type="submit" disabled={busy}>{busy ? "…" : "Créer mon accès"}</button>
          </form>
        </>
      )}

      {error && <p style={{ color: "var(--danger)", fontSize: 14, marginTop: 12 }}>{error}</p>}

      {step !== "email" && (
        <p style={{ marginTop: 16, fontSize: 13 }}>
          <button className="link-name" onClick={() => { setStep("email"); setError(""); setPwd(""); }}>
            ← Changer d'adresse
          </button>
        </p>
      )}

      <p style={{ marginTop: 30, fontSize: 13 }}><Link href="/">Retour à l'accueil</Link></p>
    </div>
  );
}
