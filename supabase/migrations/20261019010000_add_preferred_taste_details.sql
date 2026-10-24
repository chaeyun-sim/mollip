alter table public.profiles
	add column if not exists preferred_taste_details jsonb not null
	default '{"moods": [], "venueScales": [], "artMovements": []}'::jsonb;

comment on column public.profiles.preferred_taste_details is
	'Optional exhibition preference details: moods, venue scales, and art movements.';
