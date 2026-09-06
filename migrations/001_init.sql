-- Sixth Lens: initial schema
-- Run against a Postgres 13+ database (Supabase / Neon compatible).

create extension if not exists pgcrypto;

create table if not exists photographers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  studio_name text not null default 'Sixth Lens',
  created_at timestamptz not null default now()
);

create table if not exists galleries (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  cover_photo_id uuid,
  pin_hash text,
  expires_at timestamptz,
  download_enabled boolean not null default true,
  photographer_id uuid not null references photographers(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references galleries(id) on delete cascade,
  r2_key_original text not null,
  r2_key_web text not null,
  r2_key_thumb text not null,
  width int not null,
  height int not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Added after photos exists so galleries -> photos -> galleries cycle is possible.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'fk_galleries_cover_photo'
  ) then
    alter table galleries
      add constraint fk_galleries_cover_photo
      foreign key (cover_photo_id) references photos(id) on delete set null;
  end if;
end $$;

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references galleries(id) on delete cascade,
  viewer_id text not null,
  photo_id uuid not null references photos(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (gallery_id, viewer_id, photo_id)
);

create table if not exists downloads (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references galleries(id) on delete cascade,
  photo_id uuid references photos(id) on delete set null,
  viewer_id text,
  created_at timestamptz not null default now()
);

-- Not in the spec's core data model, but needed to show "view counts" on the
-- admin dashboard alongside favorites/downloads. One row per gallery page load.
create table if not exists gallery_views (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references galleries(id) on delete cascade,
  viewer_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_photos_gallery on photos(gallery_id, sort_order);
create index if not exists idx_gallery_views_gallery on gallery_views(gallery_id);
create index if not exists idx_favorites_gallery on favorites(gallery_id);
create index if not exists idx_favorites_gallery_viewer on favorites(gallery_id, viewer_id);
create index if not exists idx_downloads_gallery on downloads(gallery_id);
create index if not exists idx_galleries_slug on galleries(slug);
create index if not exists idx_galleries_photographer on galleries(photographer_id);
