import { useEffect, useState } from 'react';
import { getCultureDetail } from '@/src/api/culture';
import { supabase } from '@/src/utils/supabase';
import { stripHtml } from '@/src/utils/stripHtml';
import { fetchArtworksForExhibition } from '@/src/utils/fetchArtworksForExhibition';
import { findRelatedExhibitions } from '@/src/utils/findRelatedExhibitions';
import { mapCultureItemToExhibition } from '@/src/utils/cultureExhibitionMapper';
import type { Exhibition } from '@/src/data/exhibitions';

type Status = 'idle' | 'loading' | 'success' | 'error';

// 문화포털 detail2는 설명(contents1)이 거의 항상 비어있다. exhibitions(source='kcisa')에
// 제목이 유사한 국공립 전시가 있으면 그 설명만 가져와 채운다 (best-effort, 못 찾아도 무해함).
async function findDescriptionFromKcisa(title: string): Promise<string | null> {
	const escaped = title.replace(/[%_]/g, (c) => `\\${c}`);
	const { data } = await supabase
		.from('exhibitions')
		.select('description')
		.eq('source', 'kcisa')
		.ilike('title', `%${escaped}%`)
		.not('description', 'is', null)
		.neq('description', '')
		.limit(1)
		.maybeSingle();

	return data?.description ? stripHtml(data.description) : null;
}

export function useCultureExhibitionDetail(seq: string | undefined) {
	const [exhibition, setExhibition] = useState<Exhibition | null>(null);
	const [status, setStatus] = useState<Status>('idle');

	useEffect(() => {
		if (!seq) return;
		let cancelled = false;
		setStatus('loading');
		getCultureDetail(seq)
			.then(async (res) => {
				if (cancelled) return;
				const item = res.body.items[0]?.item;
				if (!item) {
					setStatus('error');
					return;
				}
				const mapped = mapCultureItemToExhibition(item);
				if (!mapped.description) {
					const kcisaDescription = await findDescriptionFromKcisa(mapped.title);
					if (!cancelled && kcisaDescription) {
						mapped.description = kcisaDescription;
					}
				}
				const [artworks, relatedExhibitions] = await Promise.all([
					fetchArtworksForExhibition(mapped.artist),
					findRelatedExhibitions({
						excludeId: mapped.id,
						venue: mapped.venue,
						venueDisplay: mapped.venue,
						artist: mapped.artist,
						tags: mapped.tags,
						area: item.area || undefined,
						sigungu: item.sigungu || undefined,
					}),
				]);
				if (!cancelled) {
					mapped.artworks = artworks;
					mapped.relatedExhibitions = relatedExhibitions;
					setExhibition(mapped);
					setStatus('success');
				}
			})
			.catch(() => {
				if (!cancelled) setStatus('error');
			});
		return () => {
			cancelled = true;
		};
	}, [seq]);

	return { exhibition, status };
}
