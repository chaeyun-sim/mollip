-- Save the exact artwork pieces selected on the preference wall.
-- preferred_genres remains the normalized recommendation input.
alter table public.profiles
add column if not exists preferred_wall_piece_ids text[] not null default '{}';

comment on column public.profiles.preferred_wall_piece_ids is
  'Ordered onboarding preference wall artwork piece ids';
