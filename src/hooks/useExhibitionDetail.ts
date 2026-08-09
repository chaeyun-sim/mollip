import { useEffect, useState } from 'react';
import { supabase } from '@/src/utils/supabase';
import { fetchArtworksForExhibition } from '@/src/utils/fetchArtworksForExhibition';
import { findRelatedExhibitions } from '@/src/utils/findRelatedExhibitions';
import { shouldFetchExhibitionArtworks } from '@/src/utils/shouldFetchExhibitionArtworks';
import {
	EXHIBITION_COLUMNS,
	mapExhibitionRowToExhibition,
	type ExhibitionRow,
	type MuseumJoinRow,
} from '@/src/utils/exhibitionMapper';
import type { Exhibition } from '@/src/data/exhibitions';

type Status = 'idle' | 'loading' | 'success' | 'error';

type ExhibitionDetailRow = ExhibitionRow & {
	museums: MuseumJoinRow | MuseumJoinRow[] | null;
};

function normalizeMuseumJoin(raw: ExhibitionDetailRow['museums']): MuseumJoinRow | null {
	if (!raw) return null;
	return Array.isArray(raw) ? raw[0] ?? null : raw;
}

// exhibitions.id(정수)로 상세 조회 — source(kcisa/culture/manual)와 무관.
export function useExhibitionDetail(id: string | undefined) {
	const [exhibition, setExhibition] = useState<Exhibition | null>(null);
	const [status, setStatus] = useState<Status>('idle');

	useEffect(() => {
		if (!id) return;
		const numericId = Number(id);
		if (!Number.isFinite(numericId)) {
			setStatus('error');
			return;
		}
		let cancelled = false;
		setStatus('loading');
		supabase
			.from('exhibitions')
			.select(`${EXHIBITION_COLUMNS}, museums ( name, address, phone, homepage_url, open_hours, rstdeInfo )`)
			.eq('id', numericId)
			.maybeSingle()
			.then(async ({ data, error }) => {
				if (cancelled) return;
				if (error || !data) {
					setStatus('error');
					return;
				}
				const row = data as ExhibitionDetailRow;
				const museum = normalizeMuseumJoin(row.museums);
				const mapped = mapExhibitionRowToExhibition(row, museum);
				const fetchArtworks = shouldFetchExhibitionArtworks(mapped);
				const [artworks, relatedExhibitions] = await Promise.all([
					fetchArtworks ? fetchArtworksForExhibition(mapped.artist) : Promise.resolve([]),
					findRelatedExhibitions({
						excludeId: mapped.id,
						venue: row.venue_name_fallback,
						venueDisplay: mapped.venue,
						artist: mapped.artist,
						genre: row.genre ?? undefined,
						tags: mapped.tags,
						museumId: row.museum_id,
					}),
				]);
				if (cancelled) return;
				mapped.artworks = artworks;
				mapped.relatedExhibitions = relatedExhibitions;
				setExhibition(mapped);
				setStatus('success');
			});
		return () => {
			cancelled = true;
		};
	}, [id]);

	return { exhibition, status };
}
