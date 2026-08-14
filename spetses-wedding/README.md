# 💍 Site de mariage à Spetses

Site privé du mariage de Themis & Thierry, le samedi 10 juillet 2027.
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
  directement `/i/<code>`.
- **Espace organisateurs** : `/admin`.

## Configuration

Copier `.env.example` vers `.env.local` (en local) ou reporter ces variables
dans **Vercel → Project Settings → Environment Variables** :

| Variable | Rôle |
|---|---|
| `SUPABASE_URL` | adresse du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | clé de service, **secrète**, jamais exposée au navigateur |
| `ADMIN_SETUP_CODE` | code demandé une seule fois à chacun, pour créer son mot de passe |

La clé de service se trouve dans Supabase → Project Settings → API Keys →
`service_role`. Après ajout des variables, redéployer pour qu'elles soient
prises en compte. Sans elles, l'application affiche un message de
configuration incomplète plutôt que des données.

## Comptes de l'espace organisateurs

Trois comptes, **aux droits identiques** : Dimitri, Themis et Thierry.
Chacun a ses propres coordonnées — l'email sert d'identifiant, et les
messages aux invités partent depuis la messagerie et le WhatsApp de la
personne connectée.

À la première connexion, chacun saisit son adresse, le code d'installation,
et choisit son mot de passe. Ensuite, adresse et mot de passe suffisent.
Chacun peut modifier ses coordonnées et son mot de passe depuis « Mon
compte ».

## Sécurité

Le navigateur ne parle jamais directement à la base. Les pages passent par
les routes de `app/api/`, qui s'exécutent sur le serveur :

- un invité est identifié par le jeton de son lien, et ne peut lire et
  écrire que les données de son propre foyer ;
- les organisateurs se connectent par mot de passe : celui-ci est stocké
  haché (scrypt, sel unique par compte) et le navigateur ne détient qu'un
  jeton de session aléatoire, dans un cookie inaccessible au JavaScript ;
- les actualités réservées aux foyers ayant accepté ne sortent pas du
  serveur pour les autres ;
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
