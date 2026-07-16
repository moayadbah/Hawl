-- Hawl — Phase 2 database schema.
-- Run this once in your Supabase project's SQL Editor (Dashboard → SQL Editor → New query).
-- Supabase provides gen_random_uuid() (pgcrypto) by default — no extension setup needed.

-- Phone-only mock auth (no password, no real OTP verification). `phone` is null for
-- guest accounts (multiple guests can each have a null phone — Postgres treats NULLs
-- as distinct under a UNIQUE constraint, so this doesn't collide).
create table if not exists users (
  id           uuid primary key default gen_random_uuid(),
  phone        text unique,                       -- Saudi format 05XXXXXXXX when set
  is_guest     boolean not null default false,
  display_name text,
  email        text,
  created_at   timestamptz not null default now()
);

-- Which mock banks a user has "connected" (UI persistence only — not real AIS state).
create table if not exists bank_links (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references users(id) on delete cascade,
  bank      text not null check (bank in ('alinma','rajhi','snb')),
  status    text not null default 'connected' check (status in ('connected','disconnected')),
  linked_at timestamptz not null default now(),
  unique (user_id, bank)
);

-- Saved payment cards — store ONLY brand + last4, never a full card number (even a
-- fake/demo one). Keeps the "add a card, see it saved" UX without normalizing bad
-- practice around persisting card numbers.
create table if not exists payment_cards (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  brand      text not null check (brand in ('mada','visa','mastercard','amex')),
  last4      char(4) not null check (last4 ~ '^[0-9]{4}$'),
  exp_month  smallint check (exp_month between 1 and 12),
  exp_year   smallint,
  created_at timestamptz not null default now()
);
create index if not exists idx_payment_cards_user on payment_cards(user_id);

-- One row per user: default card + auto-pay preference + last-chosen zakat basis.
create table if not exists payment_settings (
  user_id            uuid primary key references users(id) on delete cascade,
  auto_pay_enabled   boolean not null default false,
  auto_pay_frequency text not null default 'annual' check (auto_pay_frequency in ('monthly','annual')),
  default_card_id    uuid references payment_cards(id) on delete set null,
  basis              text not null default 'end' check (basis in ('end','lowest')),
  updated_at         timestamptz not null default now()
);

-- One row per user: reminder preferences (UI-only for now — no real delivery yet).
create table if not exists notification_settings (
  user_id            uuid primary key references users(id) on delete cascade,
  enabled            boolean not null default true,
  remind_before_days smallint not null default 7 check (remind_before_days >= 0),
  notify_sms         boolean not null default true,
  notify_email       boolean not null default false,
  updated_at         timestamptz not null default now()
);

-- Shared daily cache for the real, date-varying nisab (lib/server/silverPrice.ts).
-- SPARSE: one row per real Yahoo Finance trading day. The read helper forward-fills
-- weekends/holidays. `price_date` (not `date`) avoids the reserved-word column name.
create table if not exists silver_prices (
  price_date     date primary key,
  price_usd_oz   numeric(12,4) not null,
  price_sar_gram numeric(12,6) not null,
  nisab_sar      integer not null,
  source         text not null default 'yahoo:SI=F',
  fetched_at     timestamptz not null default now()
);

-- Default-deny: enable RLS with no policies on every table. The anon/authenticated
-- roles get zero access; only the service-role key (used server-side only, in
-- lib/server/supabase.ts) bypasses RLS. All DB access in this app happens inside
-- Next.js API routes, never directly from the browser.
alter table users                  enable row level security;
alter table bank_links             enable row level security;
alter table payment_cards          enable row level security;
alter table payment_settings       enable row level security;
alter table notification_settings  enable row level security;
alter table silver_prices          enable row level security;
