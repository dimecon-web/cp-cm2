"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AdminProvider, useAdmin } from "@/lib/admin";
import { adminLogin, adminLogout, adminAction } from "@/lib/store";

export default function AdminLayout({ children }) {
  return (
    <AdminProvider>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}

function AdminShell({ children }) {
  const pathname = usePathname();
  const { data, mode, loading, reload } = useAdmin();

  if (loading) {
    return (
      <main className="page">
        <div className="wrap"><p className="hint">Chargement…</p></div>
      </main>
    );
  }

  // Mode serveur sans session valide : on demande le mot de passe.
  if (mode?.configured && !data?.role) {
    return <LoginScreen adminEnabled={mode.adminEnabled} onSuccess={reload} />;
  }

  const links = [
    ["/admin", "Tableau de bord"],
    ["/admin/invites", "Invités & envois"],
    ["/admin/news", "Actualités"],
    ["/admin/budget", "Budget"],
    ["/admin/todos", "To-dos"],
    ["/admin/fournisseurs", "Fournisseurs"],
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
          <RoleControls />
        </div>
      </header>
      <main className="page">
        <div className="wrap">
          {data?.demo && (
            <div className="notice">
              🔧 <strong>Mode démo</strong> — la base n'est pas configurée : ces données
              d'exemple restent dans ce navigateur. Ajoutez les variables d'environnement
              sur Vercel pour basculer sur la base partagée.
            </div>
          )}
          {children}
        </div>
      </main>
    </>
  );
}

function RoleControls() {
  const { data, mode, reload, act } = useAdmin();

  // En mode démo, on garde la bascule de rôle pour pouvoir tout essayer.
  if (!mode?.configured) {
    return (
      <div className="role-switch">
        <span>Rôle :</span>
        <button className={data?.role === "couple" ? "active" : ""}
          onClick={() => act({ action: "setRole", role: "couple" })}>
          Mariés
        </button>
        <button className={data?.role === "organisateur" ? "active" : ""}
          onClick={() => act({ action: "setRole", role: "organisateur" })}>
          Organisateur
        </button>
      </div>
    );
  }

  return (
    <div className="role-switch">
      <span>{data?.role === "couple" ? "Mariés" : "Organisateur"}</span>
      <button onClick={async () => { await adminLogout(); reload(); }}>Se déconnecter</button>
    </div>
  );
}

function LoginScreen({ adminEnabled, onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const role = await adminLogin(password);
    setBusy(false);
    if (role) onSuccess();
    else setError("Mot de passe incorrect.");
  };

  return (
    <div className="landing">
      <h1>Espace organisateurs</h1>
      {adminEnabled ? (
        <>
          <p style={{ color: "var(--muted)", maxWidth: "40ch" }}>
            Cet espace est réservé aux mariés et à leurs témoins.
          </p>
          <form onSubmit={submit} style={{ display: "flex", gap: 10, width: "min(360px, 100%)" }}>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe" aria-label="Mot de passe" autoFocus />
            <button className="btn" type="submit" disabled={busy}>{busy ? "…" : "Entrer"}</button>
          </form>
          {error && <p style={{ color: "var(--danger)", fontSize: 14, marginTop: 10 }}>{error}</p>}
        </>
      ) : (
        <p style={{ color: "var(--muted)", maxWidth: "44ch" }}>
          Aucun mot de passe n'est défini pour l'espace organisateurs. Ajoutez la variable
          d'environnement <code>ADMIN_PASSWORD</code> (et éventuellement <code>COUPLE_PASSWORD</code>
          pour l'accès au budget) dans les réglages Vercel, puis rechargez cette page.
        </p>
      )}
      <p style={{ marginTop: 30, fontSize: 13 }}><Link href="/">Retour à l'accueil</Link></p>
    </div>
  );
}
