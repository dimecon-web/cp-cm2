"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/lib/admin";
import {
  updateProfile, listUsers, clearAccess,
  localHouseholds, localHouseholdsAsCsv, clearLocalHouseholds,
} from "@/lib/store";

// Chacun gère ses propres coordonnées et son mot de passe. Les trois comptes
// ont les mêmes droits : il n'y a rien à administrer pour les autres.
export default function AccountPage() {
  const { user, reload, act } = useAdmin();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [pending, setPending] = useState([]);
  const [recovering, setRecovering] = useState(false);
  const [others, setOthers] = useState([]);

  const refreshUsers = () => listUsers().then((r) => setOthers(r.users || []));

  useEffect(() => {
    setPhone(user?.phone || "");
    setEmail(user?.email || "");
    setPending(localHouseholds());
    refreshUsers();
  }, [user]);

  // Voie de secours quand quelqu'un n'arrive plus à se connecter et que le
  // lien par email ne lui parvient pas : on remet son compte à zéro, il
  // rechoisit son mot de passe avec le code d'installation.
  const resetOther = async (target) => {
    const ok = window.confirm(
      `Réinitialiser l'accès de ${target.name} ?\n\n` +
      `Son mot de passe actuel sera effacé et ses sessions fermées. ` +
      `${target.name} devra se reconnecter avec ${target.email} et le code d'installation ` +
      `pour choisir un nouveau mot de passe.`
    );
    if (!ok) return;
    setError(""); setNote("");
    const res = await clearAccess(target.id);
    if (res.ok) {
      setNote(`L'accès de ${target.name} a été réinitialisé. Communiquez-lui le code d'installation.`);
      refreshUsers();
    } else setError("La réinitialisation a échoué.");
  };

  const saveContact = async (e) => {
    e.preventDefault();
    setBusy(true); setError(""); setNote("");
    const res = await updateProfile({ phone, newEmail: email });
    setBusy(false);
    if (res.ok) { setNote("Coordonnées mises à jour."); reload(); }
    else setError("La mise à jour a échoué.");
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (next !== confirm) { setError("Les deux mots de passe ne correspondent pas."); return; }
    setBusy(true); setError(""); setNote("");
    const res = await updateProfile({ currentPassword: current, password: next });
    setBusy(false);
    if (res.ok) {
      setNote("Mot de passe modifié.");
      setCurrent(""); setNext(""); setConfirm("");
    } else if (res.error === "bad_current_password") setError("Mot de passe actuel incorrect.");
    else setError(res.message || "La modification a échoué.");
  };

  // Les foyers saisis avant la mise en base sont restés dans ce navigateur.
  const recover = async () => {
    setRecovering(true); setError(""); setNote("");
    try {
      const { created } = await act({ action: "importHouseholds", csv: localHouseholdsAsCsv() });
      clearLocalHouseholds();
      setPending([]);
      setNote(`${created?.length || 0} foyer(s) récupéré(s) et enregistré(s) en base.`);
    } catch {
      setError("La récupération a échoué. Rien n'a été effacé de cet appareil.");
    } finally {
      setRecovering(false);
    }
  };

  return (
    <>
      <h1>Mon compte</h1>
      <p className="hint" style={{ marginBottom: 18 }}>
        Connecté en tant que <strong>{user?.name}</strong>. Les trois comptes — Dimitri,
        Themis et Thierry — ont exactement les mêmes droits ; seules les coordonnées diffèrent.
        Les emails et messages WhatsApp que vous envoyez partent de vos propres comptes.
      </p>

      {note && <div className="notice ok" role="status">{note}</div>}
      {error && <div className="notice" role="alert">{error}</div>}

      {pending.length > 0 && (
        <div className="card" style={{ borderColor: "var(--bougain)" }}>
          <h3>Foyers saisis sur cet appareil</h3>
          <p>
            <strong>{pending.length} foyer(s)</strong> ont été saisis depuis ce navigateur avant que
            l'application ne soit reliée à sa base de données. Ils ne sont donc visibles que sur cet
            appareil. Récupérez-les pour qu'ils rejoignent la base et deviennent visibles par tous.
          </p>
          <p className="hint">
            {pending.slice(0, 5).map((h) => h.name).join(", ")}
            {pending.length > 5 ? `, et ${pending.length - 5} autre(s)` : ""}
          </p>
          <button className="btn small" onClick={recover} disabled={recovering}>
            {recovering ? "…" : `Récupérer ces ${pending.length} foyer(s)`}
          </button>
        </div>
      )}

      <form className="card" onSubmit={saveContact}>
        <h3>Mes coordonnées</h3>
        <div className="grid-2">
          <label className="field">
            <span className="lbl">Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <div className="hint">Sert aussi d'identifiant de connexion.</div>
          </label>
          <label className="field">
            <span className="lbl">Téléphone (WhatsApp)</span>
            <input type="tel" placeholder="+32…" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
        </div>
        <button className="btn small" type="submit" disabled={busy}>Enregistrer</button>
      </form>

      <form className="card" onSubmit={savePassword}>
        <h3>Changer mon mot de passe</h3>
        <div className="grid-2">
          <label className="field">
            <span className="lbl">Mot de passe actuel</span>
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </label>
          <div />
          <label className="field">
            <span className="lbl">Nouveau mot de passe</span>
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} required />
            <div className="hint">10 caractères minimum.</div>
          </label>
          <label className="field">
            <span className="lbl">Confirmation</span>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </label>
        </div>
        <button className="btn small" type="submit" disabled={busy}>Modifier</button>
        <p className="hint" style={{ marginTop: 8 }}>
          Mot de passe oublié ? Sur l'écran de connexion, « Mot de passe oublié ? » envoie
          un lien à votre adresse. Le lien vaut une heure et ne sert qu'une fois.
        </p>
      </form>

      {others.length > 1 && (
        <div className="card">
          <h3>Accès des organisateurs</h3>
          <p className="hint">
            Si l'un de nous ne parvient plus à se connecter et que le lien par email ne lui
            arrive pas, n'importe lequel des deux autres peut remettre son compte à sa
            première connexion.
          </p>
          <table className="data" style={{ marginTop: 10 }}>
            <thead>
              <tr><th>Nom</th><th>Email</th><th>Accès</th><th /></tr>
            </thead>
            <tbody>
              {others.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}{u.isSelf && " (vous)"}</td>
                  <td>{u.email}</td>
                  <td>{u.hasPassword ? "mot de passe défini" : "en attente de première connexion"}</td>
                  <td>
                    {!u.isSelf && u.hasPassword && (
                      <button className="btn small ghost" onClick={() => resetOther(u)}>
                        Réinitialiser
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
