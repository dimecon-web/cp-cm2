"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { checkReset, resetPassword } from "@/lib/store";

// Le lien est vérifié à l'ouverture : inutile de faire choisir un mot de passe
// si le jeton a expiré ou a déjà servi.
export default function ResetForm({ token }) {
  const [state, setState] = useState("checking");   // checking | ready | invalid | done
  const [account, setAccount] = useState(null);
  const [password, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    let cancelled = false;
    checkReset(token).then((res) => {
      if (cancelled) return;
      if (res.valid) { setAccount(res); setState("ready"); }
      else setState("invalid");
    });
    return () => { cancelled = true; };
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError("Les deux mots de passe ne correspondent pas."); return; }
    setBusy(true); setError("");
    const res = await resetPassword(token, password);
    setBusy(false);
    if (res.ok) setState("done");
    else if (res.error === "invalid_token") setState("invalid");
    else setError(res.message || "La réinitialisation a échoué.");
  };

  return (
    <div className="landing">
      <h1>Nouveau mot de passe</h1>

      {state === "checking" && <p className="hint">Vérification du lien…</p>}

      {state === "invalid" && (
        <>
          <p style={{ color: "var(--danger)", maxWidth: "44ch" }}>
            Ce lien n'est plus valable. Un lien de réinitialisation ne dure qu'une heure
            et ne sert qu'une fois.
          </p>
          <p style={{ color: "var(--muted)", maxWidth: "44ch" }}>
            Retournez à l'espace organisateurs et redemandez un lien.
          </p>
          <Link className="btn" href="/admin">Espace organisateurs</Link>
        </>
      )}

      {state === "ready" && (
        <>
          <p style={{ color: "var(--muted)", maxWidth: "44ch" }}>
            Bonjour {account?.name} 👋 Choisissez votre nouveau mot de passe pour
            le compte <strong>{account?.email}</strong>. Vos éventuelles sessions
            ouvertes ailleurs seront fermées.
          </p>
          <form onSubmit={submit} style={{ display: "grid", gap: 10, width: "min(380px, 100%)" }}>
            <input type="password" value={password} onChange={(e) => setPwd(e.target.value)}
              placeholder="Nouveau mot de passe (10 caractères minimum)"
              aria-label="Nouveau mot de passe" autoFocus required />
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirmez le mot de passe" aria-label="Confirmation" required />
            <button className="btn" type="submit" disabled={busy}>
              {busy ? "…" : "Enregistrer et me connecter"}
            </button>
          </form>
        </>
      )}

      {state === "done" && (
        <>
          <p style={{ maxWidth: "44ch" }}>
            C'est fait : votre mot de passe est modifié et vous êtes connecté.
          </p>
          <Link className="btn" href="/admin">Aller à l'espace organisateurs</Link>
        </>
      )}

      {error && <p style={{ color: "var(--danger)", fontSize: 14, marginTop: 12 }}>{error}</p>}

      <p style={{ marginTop: 30, fontSize: 13 }}><Link href="/">Retour à l'accueil</Link></p>
    </div>
  );
}
