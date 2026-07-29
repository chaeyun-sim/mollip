import { useEffect, useState } from 'react';
import { supabase } from '@/src/utils/supabase';
import { fetchArtworksForExhibition } from '@/src/utils/fetchArtworksForExhibition';
import { findRelatedExhibitions } from '@/src/utils/findRelatedExhibitions';
import {
	KCISA_EXHIBITION_COLUMNS,
	mapKcisaRowToExhibition,
} from '@/src/utils/kcisaExhibitionMapper';
import type { Exhibition } from '@/src/data/exhibitions';

type Status = 'idle' | 'loading' | 'success' | 'error';

// 다른 훅(useVenueExhibitions 등)이 여기서 계속 import할 수 있도록 재노출 —
// 실제 정의는 require cycle을 피하기 위해 src/utils/kcisaExhibitionMapper.ts에 있다.
export { KCISA_EXHIBITION_COLUMNS, mapKcisaRowToExhibition };

export function useKcisaExhibitionDetail(id: string | undefined) {
	const [exhibition, setExhibition] = useState<Exhibition | null>(null);
	const [status, setStatus] = useState<Status>('idle');

	useEffect(() => {
		if (!id) return;
		let cancelled = false;
		setStatus('loading');
		supabase
			.from('kcisa_exhibitions')
			.select(KCISA_EXHIBITION_COLUMNS)
			.eq('id', id)
			.maybeSingle()
			.then(async ({ data, error }) => {
				if (cancelled) return;
				if (error || !data) {
					setStatus('error');
					return;
				}
				const mapped = mapKcisaRowToExhibition(data);
				const [artworks, relatedExhibitions] = await Promise.all([
					fetchArtworksForExhibition(mapped.artist),
					findRelatedExhibitions({
						excludeId: data.id,
						venue: data.institution ?? undefined,
						artist: data.author ?? undefined,
						genre: data.genre ?? undefined,
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
