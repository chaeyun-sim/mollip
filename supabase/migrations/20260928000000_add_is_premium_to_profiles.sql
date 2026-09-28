-- RevenueCat/server-side subscription sync flag.
-- This column is intentionally not used as the sole source of truth for access
-- until it is maintained by a trusted server-side integration.
alter table public.profiles
add column if not exists is_premium boolean not null default false;

comment on column public.profiles.is_premium is
  'Server-synchronized premium entitlement flag; do not trust client writes';
