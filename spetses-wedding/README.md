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
| `RESEND_API_KEY` | facultatif — clé Resend, pour l'envoi du lien « mot de passe oublié » |
| `MAIL_FROM` | facultatif — adresse d'expédition de ces emails |
| `SITE_URL` | facultatif — adresse publique du site, sinon déduite de la requête |

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

### Mot de passe oublié

Sur l'écran de connexion, « Mot de passe oublié ? » envoie un lien de
réinitialisation à l'adresse du compte. Le lien vaut une heure, ne sert
qu'une fois, et referme au passage toutes les sessions ouvertes ailleurs. La
base ne conserve que l'empreinte du jeton, jamais le lien lui-même. La
réponse affichée est la même que l'adresse existe ou non : un curieux ne peut
pas s'en servir pour deviner qui a un accès.

Cet envoi demande `RESEND_API_KEY` et `MAIL_FROM`. Sans elles, l'application
le dit franchement plutôt que de faire attendre un email qui n'arriverait
jamais. Attention : tant qu'aucun domaine n'est vérifié chez Resend, seule
`onboarding@resend.dev` fonctionne, et uniquement vers l'adresse du compte
Resend — il faut vérifier un domaine pour que Themis et Thierry reçoivent
leur lien.

**Voie de secours, disponible sans email** : dans « Mon compte », chacun peut
remettre le compte d'un autre à sa première connexion. Le mot de passe est
effacé, les sessions fermées ; la personne rechoisit son mot de passe avec le
code d'installation. Comme les trois comptes ont les mêmes droits, cela ne
donne à personne un pouvoir qu'il n'avait pas déjà.

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
