import { useQuery } from '@tanstack/react-query';

import { getCultureDetail } from '@/src/api/culture';
import type { Exhibition } from '@/src/data/exhibitions';
import { mapCultureItemToExhibition } from '@/src/utils/cultureExhibitionMapper';
import { fetchArtworksForExhibition } from '@/src/utils/fetchArtworksForExhibition';
import { findRelatedExhibitions } from '@/src/utils/findRelatedExhibitions';
import { stripHtml } from '@/src/utils/stripHtml';
import { supabase } from '@/src/utils/supabase';

const CULTURE_DETAIL_STALE_MS = 5 * 60 * 1000;

class ExhibitionNotFoundError extends Error {
	constructor() {
		super('exhibition not found');
		this.name = 'ExhibitionNotFoundError';
	}
}

export const cultureExhibitionDetailQueryKey = (seq: string) =>
	['exhibition', 'culture-detail', seq] as const;

// 문화포털 detail2는 설명(contents1)이 거의 항상 비어있다. exhibitions(source='kcisa')에
// 제목이 정확히 같은 국공립 전시가 있으면 그 설명만 가져와 채운다.
// 네트워크 오류 등 예외는 삼켜서 상세 조회 자체는 항상 성공하도록 한다 (best-effort).
const findDescriptionFromKcisa = async (title: string): Promise<string | null> => {
	try {
		const { data } = await supabase
			.from('exhibitions')
			.select('description')
			.eq('source', 'kcisa')
			.eq('title', title)
			.not('description', 'is', null)
			.neq('description', '')
			.limit(1)
			.maybeSingle();

		return data?.description ? stripHtml(data.description) : null;
	} catch {
		return null;
	}
};

const fetchCultureExhibitionDetail = async (seq: string): Promise<Exhibition> => {
	const res = await getCultureDetail(seq);
	const item = res.body.items[0]?.item;
	if (!item) throw new ExhibitionNotFoundError();

	const mapped = mapCultureItemToExhibition(item);
	if (!mapped.description) {
		const kcisaDescription = await findDescriptionFromKcisa(mapped.title);
		if (kcisaDescription) mapped.description = kcisaDescription;
	}

	const [artworks, relatedExhibitions] = await Promise.all([
		fetchArtworksForExhibition(mapped.artist),
		findRelatedExhibitions({
			excludeId: mapped.id,
			excludeTitle: mapped.title,
			venue: mapped.venue,
			venueDisplay: mapped.venue,
			artist: mapped.artist,
			tags: mapped.tags,
			area: item.area || undefined,
			sigungu: item.sigungu || undefined,
		}),
	]);
	mapped.artworks = artworks;
	mapped.relatedExhibitions = relatedExhibitions;
	return mapped;
};

export function useCultureExhibitionDetail(seq: string | undefined) {
	const enabled = seq != null && seq !== '';

	return useQuery({
		queryKey: cultureExhibitionDetailQueryKey(seq ?? ''),
		queryFn: () => {
			if (!seq) throw new ExhibitionNotFoundError();
			return fetchCultureExhibitionDetail(seq);
		},
		enabled,
		staleTime: CULTURE_DETAIL_STALE_MS,
		retry: (failureCount, error) => {
			if (error instanceof ExhibitionNotFoundError) return false;
			return failureCount < 1;
		},
	});
}
