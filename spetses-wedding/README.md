# 💍 Site de mariage à Spetses

Site privé du mariage de Thierry & Themis, le samedi 10 juillet 2027.
Espace invités trilingue (FR/EN/ΕΛ) avec RSVP et questionnaire logistique,
et espace organisateurs (tableau de bord, budget, to-dos, fournisseurs).
Voir [SPEC.md](./SPEC.md) pour la spécification complète.

## Démarrer

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000 :

- **Espace invité** : le code d'invitation sur la page d'accueil, ou
  directement `/i/<code>` (par exemple `/i/demo`).
- **Espace organisateurs** : `/admin`.

## Les deux modes de fonctionnement

Le site choisit son mode tout seul, selon la présence des variables
d'environnement :

| | Mode démo | Mode base |
|---|---|---|
| Déclenché par | aucune variable configurée | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` |
| Données | dans le navigateur (localStorage) | base Supabase partagée |
| Les invités peuvent répondre pour de vrai | non | oui |
| Accès organisateurs | bascule de rôle libre | mot de passe |

Le mode démo existe pour que le site reste navigable et présentable même
sans configuration : rien ne casse pendant la mise en place.

## Configuration

Copier `.env.example` vers `.env.local` (en local) ou reporter ces variables
dans **Vercel → Project Settings → Environment Variables** :

| Variable | Rôle |
|---|---|
| `SUPABASE_URL` | adresse du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | clé de service, **secrète**, jamais exposée au navigateur |
| `ADMIN_PASSWORD` | mot de passe de l'espace organisateurs |
| `COUPLE_PASSWORD` | mot de passe des mariés : ajoute l'accès au budget |

La clé de service se trouve dans Supabase → Project Settings → API Keys →
`service_role`. Après ajout des variables, redéployer pour qu'elles soient
prises en compte.

## Sécurité

Le navigateur ne parle jamais directement à la base. Les pages passent par
les routes de `app/api/`, qui s'exécutent sur le serveur :

- un invité est identifié par le jeton de son lien, et ne peut lire et
  écrire que les données de son propre foyer ;
- les actualités réservées aux foyers ayant accepté ne sortent pas du
  serveur pour les autres ;
- le budget ne sort du serveur que pour le rôle « mariés » ;
- les tables ont la sécurité au niveau des lignes activée sans aucune
  politique : la clé publique ne donne accès à rien, même si elle fuitait.

## Personnaliser

- `lib/config.js` — noms, initiales, dates, programme, frise, lien du groupe
  WhatsApp ;
- `app/i/[token]/histoire/page.js` — textes « notre histoire » ;
- `app/i/[token]/spetses/page.js` — guide de l'île ;
- `supabase/schema.sql` — schéma de la base (tables préfixées `wedding_`).

## Déployer

Ce dépôt s'importe tel quel sur Vercel : l'application est à la racine, donc
aucun « Root Directory » à préciser. Chaque push redéploie automatiquement.
