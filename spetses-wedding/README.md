# 💍 Site de mariage à Spetses

Site privé de mariage : espace invités trilingue (FR/EN/ΕΛ) avec RSVP et
questionnaire logistique, et espace organisateurs (tableau de bord, budget,
to-dos, fournisseurs). Voir [SPEC.md](./SPEC.md) pour la spécification complète.

## Démarrer

```bash
cd spetses-wedding
npm install
npm run dev
```

Puis ouvrir http://localhost:3000 :

- **Espace invité (démo)** : http://localhost:3000/i/demo — ou le code `demo`
  sur la page d'accueil. Autres foyers de test : `a7f2k9`, `b3x8m1`, `c9p4t6`…
- **Espace organisateurs** : http://localhost:3000/admin — bascule de rôle
  « Mariés / Organisateur » en haut à droite (le budget n'est visible que par
  les mariés).

La v1 fonctionne entièrement en mode démo (données d'exemple + localStorage,
aucun service externe). La migration vers Supabase (schéma dans
`supabase/schema.sql`) et l'envoi d'emails sont décrits dans la feuille de
route de SPEC.md.

## Personnaliser

Tout le contenu personnel est centralisé :

- `lib/config.js` — noms, initiales, dates, événements du programme, frise,
  email de contact, lien du groupe WhatsApp ;
- `app/i/[token]/histoire/page.js` — textes « notre histoire » ;
- `app/i/[token]/spetses/page.js` — guide de l'île ;
- `lib/store.js` — foyers invités (v1) et actualités.

## Déployer sur Vercel

Importer le dépôt sur vercel.com avec **Root Directory = `spetses-wedding`**.
Aucune variable d'environnement n'est requise en v1.
