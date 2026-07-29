import { useEffect, useState } from 'react';
import { getCultureDetail } from '@/src/api/culture';
import { supabase } from '@/src/utils/supabase';
import { stripHtml } from '@/src/utils/stripHtml';
import { fetchArtworksForExhibition } from '@/src/utils/fetchArtworksForExhibition';
import { findRelatedExhibitions } from '@/src/utils/findRelatedExhibitions';
import type { Exhibition } from '@/src/data/exhibitions';

type Status = 'idle' | 'loading' | 'success' | 'error';

function formatDate(raw: string): string {
	if (raw.length !== 8) return raw;
	return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
}

// 문화포털 상세 API는 정적 데이터(src/data/exhibitions.ts)와 달리 큐레이터 노트, 태그,
// 작품 목록, 운영시간 등을 제공하지 않는다. 없는 필드는 화면이 자연스럽게 숨기거나
// 안내 문구로 대체하도록 빈 값/플레이스홀더로 채운다.
function parseCoordinate(raw: string | undefined): number | undefined {
	const n = raw ? Number(raw) : NaN;
	return Number.isFinite(n) ? n : undefined;
}

function mapToExhibition(item: {
	seq: string;
	title: string;
	place: string;
	placeAddr: string;
	startDate: string;
	endDate: string;
	contents1: string;
	price: string;
	url: string;
	phone: string;
	imgUrl: string;
	gpsX?: string;
	gpsY?: string;
}): Exhibition {
	const longitude = parseCoordinate(item.gpsX);
	const latitude = parseCoordinate(item.gpsY);
	return {
		id: item.seq,
		title: item.title,
		venue: item.place,
		venueAddress: item.placeAddr || undefined,
		startDate: formatDate(item.startDate),
		endDate: formatDate(item.endDate),
		// contents1(설명)은 문화포털 데이터 자체에 거의 항상 비어있음 — 빈 문자열로 두고
		// 화면에서 없을 때 안내 URL 링크로 대체하도록 한다.
		description: item.contents1,
		posterColor: '#E8E4DC',
		genre: '전시',
		heroImageUri: item.imgUrl || undefined,
		openHours: '운영시간 정보 없음',
		admission: item.price || '정보 없음',
		admissionFree: item.price?.includes('무료'),
		ticketUrl: item.url || undefined,
		phone: item.phone || undefined,
		coordinates: latitude != null && longitude != null ? { latitude, longitude } : undefined,
		artworks: [],
		relatedExhibitionIds: [],
	};
}

// 문화포털 detail2는 설명(contents1)이 거의 항상 비어있다. KCISA 캐시 테이블(kcisa_exhibitions)에
// 제목이 유사한 국공립 전시가 있으면 그 설명만 가져와 채운다 (best-effort, 못 찾아도 무해함).
async function findDescriptionFromKcisa(title: string): Promise<string | null> {
	const escaped = title.replace(/[%_]/g, (c) => `\\${c}`);
	const { data } = await supabase
		.from('kcisa_exhibitions')
		.select('description')
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
				const mapped = mapToExhibition(item);
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
						artist: mapped.artist,
						// KCISA엔 없는 소규모 기관도 문화포털 지역 검색으로 "같은 시/도" 관련 전시를 채운다.
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
