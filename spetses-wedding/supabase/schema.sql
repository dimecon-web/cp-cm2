-- Schéma Supabase cible (v2) pour le site de mariage à Spetses.
-- La v1 fonctionne en mode démo (localStorage) ; ce schéma est le modèle
-- vers lequel lib/store.js sera migré.

-- Foyers invités : un token unique par foyer = le lien d'invitation (choix B1a).
create table households (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,            -- ex. 'a7f2k9' → site.com/i/a7f2k9
  name text not null,
  email text,
  phone text,                            -- numéro WhatsApp
  lang text not null default 'fr' check (lang in ('fr','en','el')),
  invited_at timestamptz,                -- date d'envoi de l'invitation
  created_at timestamptz not null default now()
);

-- Réponse RSVP : une par foyer, modifiable jusqu'à la date limite (choix C2c).
create table rsvps (
  household_id uuid primary key references households(id) on delete cascade,
  attending text check (attending in ('yes','no')),
  email text,                            -- collecté si absent du foyer (choix B3c)
  arrival date,
  departure date,
  transport text check (transport in ('plane','ferry','car','other')),
  accommodation text check (accommodation in ('booked','searching','hosted','unknown')),
  notes text,
  updated_at timestamptz not null default now()
);

-- Participants d'un foyer : adultes/enfants, allergies, présence par événement (choix C1).
create table participants (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  type text not null default 'adult' check (type in ('adult','child')),
  age int,
  diet text not null default 'none' check (diet in ('none','veg','allergy')),
  diet_note text,                        -- détail de l'allergie grave
  events jsonb not null default '{}'    -- { "party": true, "wedding": true, ... }
);

-- Actualités : fil de news + futures photos du mur (choix D1).
create table news_posts (
  id uuid primary key default gen_random_uuid(),
  published_at timestamptz not null default now(),
  title jsonb not null,                  -- { fr, en, el }
  body jsonb not null,
  author_id uuid,                        -- organisateur, ou null
  photo_url text,
  submitted_by uuid references households(id),  -- post d'invité (mur de photos)
  approved boolean not null default true        -- modération organisateurs (choix D1d)
);

-- Messages du formulaire de contact (choix E1a).
create table messages (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id),
  name text not null,
  email text not null,
  body text not null,
  created_at timestamptz not null default now(),
  handled boolean not null default false
);

-- Organisateurs : liés à Supabase Auth ; rôle 'couple' voit le budget (choix F2b).
create table organizers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'organisateur' check (role in ('couple','organisateur'))
);

create table budget_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  planned numeric not null default 0,
  actual numeric not null default 0,
  deposit numeric not null default 0,
  due date
);

create table todos (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  who text,
  due date,
  done boolean not null default false
);

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  phone text,
  email text,
  notes text
);

-- Relances automatiques (choix C4a) : journal des envois, alimenté par un
-- cron (Supabase Edge Function + Resend) à J-30 / J-14 / J-7 de la deadline.
create table reminders_log (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  kind text not null,                    -- 'invite' | 'reminder' | 'news'
  channel text not null,                 -- 'email'
  sent_at timestamptz not null default now()
);

-- ============ Row Level Security ============
alter table households enable row level security;
alter table rsvps enable row level security;
alter table participants enable row level security;
alter table news_posts enable row level security;
alter table messages enable row level security;
alter table organizers enable row level security;
alter table budget_items enable row level security;
alter table todos enable row level security;
alter table suppliers enable row level security;
alter table reminders_log enable row level security;

-- Les invités accèdent à leurs données via une Edge Function qui vérifie le
-- token du foyer (pas d'accès direct anon). Les organisateurs authentifiés
-- lisent tout ; le budget est réservé au rôle 'couple'.
create policy organizers_read_all on households for select
  using (exists (select 1 from organizers o where o.user_id = auth.uid()));
create policy organizers_rsvps on rsvps for select
  using (exists (select 1 from organizers o where o.user_id = auth.uid()));
create policy organizers_participants on participants for select
  using (exists (select 1 from organizers o where o.user_id = auth.uid()));
create policy organizers_messages on messages for all
  using (exists (select 1 from organizers o where o.user_id = auth.uid()));
create policy organizers_todos on todos for all
  using (exists (select 1 from organizers o where o.user_id = auth.uid()));
create policy organizers_suppliers on suppliers for all
  using (exists (select 1 from organizers o where o.user_id = auth.uid()));
create policy couple_budget on budget_items for all
  using (exists (select 1 from organizers o where o.user_id = auth.uid() and o.role = 'couple'));
create policy news_public_read on news_posts for select using (approved = true);
