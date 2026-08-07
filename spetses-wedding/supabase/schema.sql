-- Schéma de la base du site de mariage à Spetses.
--
-- Toutes les tables sont préfixées `wedding_` : le schéma peut donc être
-- appliqué dans un projet Supabase dédié comme dans un projet existant
-- déjà utilisé par une autre application, sans aucun risque de collision.
--
-- Modèle d'accès : le navigateur ne parle JAMAIS directement à la base.
-- Les pages passent par les routes serveur de l'application (app/api/…),
-- qui utilisent la clé de service et vérifient le jeton du foyer ou le mot
-- de passe organisateur. La sécurité au niveau des lignes est donc en
-- « tout refuser » : aucune lecture ni écriture n'est possible avec la clé
-- publique, même si celle-ci venait à fuiter.

-- ---------- Foyers invités ----------
-- Le jeton est le lien d'invitation : site.com/i/<token>
create table if not exists wedding_households (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  name text not null,
  email text,
  phone text,                       -- numéro WhatsApp, format international
  lang text not null default 'fr' check (lang in ('fr', 'en', 'el')),
  invited_at timestamptz,           -- date d'envoi de l'invitation
  created_at timestamptz not null default now()
);

-- ---------- Réponse RSVP : une par foyer, modifiable jusqu'à la date limite ----------
create table if not exists wedding_rsvps (
  household_id uuid primary key references wedding_households(id) on delete cascade,
  attending text check (attending in ('yes', 'no')),
  email text,                       -- collecté si absent du carnet d'adresses
  arrival date,
  departure date,
  transport text check (transport in ('plane', 'ferry', 'car', 'other')),
  accommodation text check (accommodation in ('booked', 'searching', 'hosted', 'unknown')),
  notes text,
  updated_at timestamptz not null default now()
);

-- ---------- Participants : adultes/enfants, allergies, présence par événement ----------
create table if not exists wedding_participants (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references wedding_households(id) on delete cascade,
  position int not null default 0,  -- ordre d'affichage dans le formulaire
  name text not null,
  type text not null default 'adult' check (type in ('adult', 'child')),
  age int check (age is null or (age >= 0 and age < 18)),
  diet text not null default 'none' check (diet in ('none', 'veg', 'allergy')),
  diet_note text,                   -- détail obligatoire côté application si diet = 'allergy'
  events jsonb not null default '{}'::jsonb   -- { "party": true, "wedding": true, … }
);

create index if not exists wedding_participants_household_idx
  on wedding_participants(household_id);

-- ---------- Actualités ----------
-- audience : 'all' = tous les foyers ; 'yes' = seulement ceux qui ont accepté
create table if not exists wedding_news (
  id uuid primary key default gen_random_uuid(),
  published_at timestamptz not null default now(),
  audience text not null default 'all' check (audience in ('all', 'yes')),
  title jsonb not null,             -- { "fr": …, "en": …, "el": … }
  body jsonb not null,
  photo_url text
);

-- ---------- Mur de photos des invités, publié après validation ----------
create table if not exists wedding_photos (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references wedding_households(id) on delete set null,
  caption text,
  url text not null,                -- Supabase Storage en production
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists wedding_photos_approved_idx
  on wedding_photos(approved, created_at desc);

-- ---------- Messages du formulaire de contact ----------
create table if not exists wedding_messages (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references wedding_households(id) on delete set null,
  name text not null,
  email text not null,
  body text not null,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Outils organisateurs ----------
create table if not exists wedding_budget_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  planned numeric not null default 0,
  actual numeric not null default 0,
  deposit numeric not null default 0,
  due date
);

create table if not exists wedding_todos (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  who text,
  due date,
  done boolean not null default false
);

create table if not exists wedding_suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  phone text,
  email text,
  notes text
);

-- ---------- Journal des envois (invitations, relances, actualités) ----------
create table if not exists wedding_sends (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references wedding_households(id) on delete cascade,
  kind text not null check (kind in ('invite', 'reminder', 'news')),
  channel text not null check (channel in ('email', 'whatsapp')),
  sent_at timestamptz not null default now()
);

-- ---------- Sécurité : tout refuser côté client ----------
-- RLS activée sans aucune politique = aucun accès avec la clé publique.
-- Seule la clé de service, utilisée exclusivement côté serveur, contourne
-- ces règles. Les invités sont identifiés par leur jeton, vérifié par les
-- routes serveur ; les organisateurs par un mot de passe.
alter table wedding_households   enable row level security;
alter table wedding_rsvps        enable row level security;
alter table wedding_participants enable row level security;
alter table wedding_news         enable row level security;
alter table wedding_photos       enable row level security;
alter table wedding_messages     enable row level security;
alter table wedding_budget_items enable row level security;
alter table wedding_todos        enable row level security;
alter table wedding_suppliers    enable row level security;
alter table wedding_sends        enable row level security;
