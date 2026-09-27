import { useQuery } from '@tanstack/react-query';

import type { Exhibition } from '@/src/data/exhibitions';
import { fetchArtworksForExhibition } from '@/src/utils/fetchArtworksForExhibition';
import { findRelatedExhibitions } from '@/src/utils/findRelatedExhibitions';
import {
	EXHIBITION_COLUMNS,
	mapExhibitionRowToExhibition,
	type ExhibitionRow,
	type MuseumJoinRow,
} from '@/src/utils/exhibitionMapper';
import { shouldFetchExhibitionArtworks } from '@/src/utils/shouldFetchExhibitionArtworks';
import { supabase } from '@/src/utils/supabase';

type ExhibitionDetailRow = ExhibitionRow & {
	museums: MuseumJoinRow | MuseumJoinRow[] | null;
};

const EXHIBITION_DETAIL_STALE_MS = 5 * 60 * 1000;

export function exhibitionDetailQueryKey(id: number) {
	return ['exhibition', 'detail', id] as const;
}

function normalizeMuseumJoin(raw: ExhibitionDetailRow['museums']): MuseumJoinRow | null {
	if (!raw) return null;
	return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

async function fetchExhibitionDetail(numericId: number): Promise<Exhibition> {
	const { data, error } = await supabase
		.from('exhibitions')
		.select(
			`${EXHIBITION_COLUMNS}, museums ( id, name, address, phone, homepage_url, open_hours, rstdeInfo, description, amenities, parking, notes, gps_x, gps_y, venue_group_name, accessibility )`,
		)
		.eq('id', numericId)
		.maybeSingle();

	if (error) throw error;
	if (!data) throw new Error('exhibition not found');

	const row = data as ExhibitionDetailRow;
	const museum = normalizeMuseumJoin(row.museums);
	const mapped = mapExhibitionRowToExhibition(row, museum);
	const fetchArtworks = shouldFetchExhibitionArtworks(mapped);
	const [artworks, relatedExhibitions] = await Promise.all([
		fetchArtworks ? fetchArtworksForExhibition(mapped.artist) : Promise.resolve([]),
		findRelatedExhibitions({
			excludeId: mapped.id,
			excludeTitle: mapped.title,
			venue: row.venue_name_fallback,
			venueDisplay: mapped.venue,
			artist: mapped.artist,
			genre: row.genre ?? undefined,
			tags: mapped.tags,
			museumId: row.museum_id,
		}),
	]);
	mapped.artworks = artworks;
	mapped.relatedExhibitions = relatedExhibitions;
	return mapped;
}

// exhibitions.id(정수)로 상세 조회 — source(kcisa/culture/manual)와 무관.
export function useExhibitionDetail(id: string | undefined) {
	const hasId = id != null && id !== '';
	const numericId = hasId ? Number(id) : Number.NaN;
	const isValidId = hasId && Number.isFinite(numericId);

	return useQuery({
		queryKey: exhibitionDetailQueryKey(numericId),
		queryFn: () => fetchExhibitionDetail(numericId),
		enabled: isValidId,
		staleTime: EXHIBITION_DETAIL_STALE_MS,
		retry: (failureCount, error) => {
			if (error instanceof Error && error.message === 'exhibition not found') return false;
			return failureCount < 1;
		},
	});
}
