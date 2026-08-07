# Site de mariage à Spetses — Spécification

Spécification consolidée à partir du QCM (réponses du 07/08/2026).

## Décisions clés (issues du QCM)

| Sujet | Décision |
|---|---|
| Taille | 100–200 invités, mariage dans 6–12 mois |
| Langues | Trilingue FR / EN / ΕΛ côté invités ; espace organisateurs en FR (v1) |
| Accès | **Site entièrement privé** (G3a) : un lien personnel unique par foyer `/i/<token>`, pas de mot de passe (B1a), site non indexé (`noindex`) |
| Invitations | Faire-part papier avec QR code **et** envoi digital (B4c). WhatsApp : messages pré-remplis envoyés depuis le téléphone des mariés via `wa.me` (B2a) — pas d'API Business. Email : envoi via service (v2) |
| Coordonnées | Carnet incomplet : le RSVP collecte l'email si absent (B3c) |
| RSVP | Par foyer : nom de chaque participant, adulte/enfant + âge, présence **par événement**, restrictions alimentaires limitées aux cas sérieux (végé / allergie grave + détail) (C1) ; modifiable à tout moment jusqu'à la date limite (C2c) |
| Logistique | Dates arrivée/départ, transport, hébergement — avec mention explicite **non engageante** (C3) |
| Relances | Date limite + relances email automatiques aux non-répondants (C4a) — v2 ; en v1, boutons de relance manuelle email/WhatsApp |
| Communication | Fil d'actualités sur le site + emails segmentés + messages WhatsApp pré-rédigés + mur de photos d'invités **avec modération** (D1) ; un seul groupe WhatsApp, lien affiché sur le site quelques semaines avant (D2a) |
| Contact | Formulaire web → espace organisateurs + email (E1a) |
| Spetses | Page essentielle au lancement, enrichie au fil du temps (E2c) |
| Programme | Public, mais lieux/horaires précis révélés plus tard (E3c) — flag `detailsPublic` par événement |
| About us | Histoire + frise chronologique + galerie + « pourquoi Spetses » (E4 complet) |
| Organisateurs | 3–5 personnes ; tableau de bord RSVP, budget, to-dos, fournisseurs (F1 complet) ; **budget visible uniquement par les mariés** (F2b) ; export CSV (F3a) |
| Technique | Next.js + Supabase + Vercel (G1a), adresse `*.vercel.app` (G2b) |
| Design | Coloré & festif (H1d), ton chaleureux avec tutoiement (H2a), photos perso + illustrations + monogramme (H3), titres serif romantiques + sans-serif (H4a), mobile et desktop à égalité (H5c) |

## Architecture

```
.  (racine du dépôt)
├── app/
│   ├── page.js              Porte d'entrée privée (code / lien d'invitation)
│   ├── i/[token]/           Espace invités (trilingue)
│   │   ├── page.js          Accueil personnalisé + compte à rebours
│   │   ├── rsvp/            RSVP + questionnaire logistique fusionnés
│   │   ├── programme/       Programme, détails révélés plus tard
│   │   ├── spetses/         Guide de l'île (venir, circuler, dormir, histoire)
│   │   ├── histoire/        About us : histoire, frise, galerie, pourquoi Spetses
│   │   ├── news/            Fil d'actualités (+ futur mur de photos modéré)
│   │   └── contact/         Formulaire + futur lien groupe WhatsApp
│   └── admin/               Espace organisateurs (FR)
│       ├── page.js          Tableau de bord RSVP, arrivées/jour, relances, messages
│       ├── invites/         Foyers (ajout/import CSV), liens perso, QR codes, envois
│       ├── news/            Rédaction trilingue, envoi segmenté, modération photos
│       ├── budget/          Budget (rôle « mariés » uniquement)
│       ├── todos/           Qui fait quoi, pour quand
│       └── fournisseurs/    Annuaire fournisseurs
├── lib/
│   ├── config.js            Noms, dates, événements, liens — tout le personnalisable
│   ├── dict.js              Dictionnaire FR/EN/ΕΛ
│   ├── i18n.js              Contexte de langue + sélecteur
│   ├── store.js             Bascule base ↔ mode démo, appels aux routes API
│   ├── admin.js             État partagé de l'espace organisateurs
│   └── db.js                Client Supabase, côté serveur uniquement
├── app/api/                 Routes serveur (guest, public, admin, status)
└── supabase/schema.sql      Schéma de la base (tables préfixées wedding_)
```

## État actuel — v2, base partagée

Les données vivent dans une base Supabase (tables préfixées `wedding_`,
hébergées dans le projet `personal-hub`). Un invité répond depuis son
téléphone, les organisateurs voient la réponse : c'est ce qui rend le site
réellement utilisable.

Le navigateur ne joint jamais la base directement. Les pages passent par les
routes de `app/api/`, exécutées côté serveur avec la clé de service :
`guest/[token]` limite lecture et écriture au foyer du jeton, `public` reçoit
messages et photos, `admin` sert le tableau de bord après vérification du mot
de passe. Les tables ont la sécurité au niveau des lignes activée sans
politique, donc la clé publique ne donne accès à rien.

Un **mode démo** prend le relais tant que les variables d'environnement sont
absentes : les données restent alors dans le navigateur. Le site ne casse donc
jamais pendant la configuration.

Couvert en v1 : parcours RSVP complet, actualités publiées depuis l'espace
organisateurs (trilingue, segment « tous » / « oui », email pré-rempli en copie
cachée, texte prêt pour WhatsApp), mur de photos des invités avec file de
modération, ajout et import CSV de foyers, QR codes des liens personnels,
export CSV des réponses.

Limites connues : les photos sont réduites côté navigateur puis stockées en
base (Supabase Storage serait plus adapté au-delà de quelques centaines), et
l'envoi d'emails passe encore par votre messagerie.

## Feuille de route

- **v3 — Emails** : service d'envoi (Resend), invitation groupée, relances
  automatiques J-30/J-14/J-7, envoi d'actualités segmenté (tous / les « oui »).
- **v4 — Contenu & finitions** : vraie histoire + photos, traductions finales
  relues, liste d'hôtels recommandés, monogramme définitif, lien du groupe
  WhatsApp, mur de photos avec modération.

## Reste à faire

- Renseigner les variables d'environnement sur Vercel (voir README) pour
  activer le mode base en production.
- Saisir la vraie liste des foyers dans `/admin/invites`.
- Remplacer les textes et photos par les vôtres.

## À fournir par les mariés

Noms & initiales, date exacte et date limite RSVP, textes « notre histoire » /
« pourquoi Spetses », photos, liste des foyers (nom + email/téléphone + langue),
adresses d'hébergement à recommander, lien du groupe WhatsApp (le moment venu).
Tout se change dans `lib/config.js` et les fichiers de contenu des pages.
