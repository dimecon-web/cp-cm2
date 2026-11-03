import "server-only";

// Envoi d'emails depuis le serveur — aujourd'hui uniquement le lien de
// réinitialisation de mot de passe. Un seul appel HTTP vers Resend, donc
// aucune dépendance supplémentaire à installer ni à maintenir.
//
// Sans RESEND_API_KEY ni MAIL_FROM, l'application ne prétend pas envoyer :
// elle le dit franchement et renvoie vers l'autre voie de récupération
// (un organisateur connecté remet un compte à sa première connexion).

export const mailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);

export async function sendMail({ to, bcc, subject, text }) {
  if (!mailConfigured) return { sent: false, reason: "not_configured" };
  try {
    const payload = { from: process.env.MAIL_FROM, to: [to], subject, text };
    // Une notification part en copie cachée : les invités ne voient pas les
    // adresses des autres, et un seul envoi suffit par langue.
    if (bcc?.length) payload.bcc = bcc;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { sent: false, reason: await res.text().catch(() => "envoi refusé") };
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}
