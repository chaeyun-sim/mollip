import { useEffect, useState } from 'react';
import { supabase } from '@/src/utils/supabase';
import { KCISA_EXHIBITION_COLUMNS, mapKcisaRowToExhibition } from './useKcisaExhibitionDetail';
import type { Exhibition } from '@/src/data/exhibitions';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface ManualExhibitionRow {
	id: string;
	venue_name: string;
	title: string;
	genre: string;
	description: string;
	image_url: string | null;
	url: string | null;
	artist: string | null;
	phone: string | null;
	admission: string;
	admission_free: boolean;
	start_date: string;
	end_date: string;
	open_hours: string;
}

function mapManualRowToExhibition(row: ManualExhibitionRow): Exhibition {
	return {
		id: row.id,
		title: row.title,
		venue: row.venue_name,
		startDate: row.start_date,
		endDate: row.end_date,
		artist: row.artist || undefined,
		description: row.description,
		posterColor: '#E8E4DC',
		genre: row.genre || '전시',
		heroImageUri: row.image_url || undefined,
		openHours: row.open_hours || '운영시간 정보 없음',
		admission: row.admission || '정보 없음',
		admissionFree: row.admission_free,
		ticketUrl: row.url || undefined,
		phone: row.phone || undefined,
		artworks: [],
		relatedExhibitionIds: [],
	};
}

function escapeIlike(value: string): string {
	return value.replace(/[%_]/g, (c) => `\\${c}`);
}

// KCISA institution 컬럼은 "국립현대미술관"처럼 분관 접미사 없는 짧은 공식 명칭인 반면,
// 지도 마커 이름은 "국립현대미술관 서울관"처럼 분관까지 포함한다. 뒤에서부터 단어를 하나씩
// 떼어내며 후보를 만들어 ilike OR 조건으로 넓게 조회한다 (예: "국립현대미술관 서울관" → "국립현대미술관").
// 이 단계는 일부러 느슨하게(포함 관계) 잡고, 실제 동일 장소 여부는 isSameVenue로 다시 거른다.
function institutionCandidates(venueName: string): string[] {
	const words = venueName.trim().split(/\s+/).filter(Boolean);
	const candidates: string[] = [];
	for (let i = words.length; i >= 1; i--) {
		candidates.push(words.slice(0, i).join(' '));
	}
	return candidates;
}

// "경주예술의전당" !== "예술의전당" (단순 포함이면 오탐) 이지만
// "예술의전당(한가림디자인미술관)" === "예술의전당" (한쪽이 다른 한쪽의 접두사) 이길 원하므로,
// 부분 문자열 포함이 아니라 양방향 접두사(startsWith) 관계로 동일 장소 여부를 판단한다.
function isSameVenue(a: string, b: string): boolean {
	const x = a.trim();
	const y = b.trim();
	if (!x || !y) return false;
	return x.startsWith(y) || y.startsWith(x);
}

// 지도 마커(미술관 API 등)로 추가된, 정적 전시 데이터가 없는 장소를 위해
// 장소 이름으로 KCISA 캐시 + 수동 큐레이션(manual_exhibitions) 테이블을 함께 조회한다.
// 두 API 모두 커버하지 못하는 소규모 갤러리는 manual_exhibitions에 직접 행을 추가해 채운다.
export function useVenueExhibitions(venueName: string | null) {
	const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
	const [status, setStatus] = useState<Status>('idle');

	useEffect(() => {
		if (!venueName) {
			setExhibitions([]);
			setStatus('idle');
			return;
		}
		let cancelled = false;
		setStatus('loading');

		const orFilter = institutionCandidates(venueName)
			.map((c) => `institution.ilike.%${escapeIlike(c)}%`)
			.join(',');

		Promise.all([
			supabase
				.from('kcisa_exhibitions')
				.select(KCISA_EXHIBITION_COLUMNS)
				.or(orFilter)
				.order('period', { ascending: false })
				.limit(50),
			supabase
				.from('manual_exhibitions')
				.select('*')
				.eq('venue_name', venueName)
				.limit(10),
		]).then(([kcisaRes, manualRes]) => {
			if (cancelled) return;
			if (kcisaRes.error && manualRes.error) {
				setStatus('error');
				return;
			}
			const manual = (manualRes.data ?? []).map(mapManualRowToExhibition);

			// 1) 느슨하게 넓혀 가져온 후보 중, 실제로 같은 장소인 것만 남긴다
			//    (예: "경주예술의전당"이 "예술의전당" 조회에 섞여 들어오는 것을 제외).
			const sameVenueRows = (kcisaRes.data ?? []).filter((row) =>
				row.institution ? isSameVenue(row.institution, venueName) : false,
			);
			// 2) 그중에서도 여러 분관이 섞여 있으면 event_site(분관명)로 한 번 더 좁힌다.
			//    분관 구분 정보가 없거나 매칭이 없으면(=단일 분관) 전체를 그대로 둔다.
			const branchMatched = sameVenueRows.filter(
				(row) => row.event_site && venueName.includes(row.event_site),
			);
			const finalRows = branchMatched.length > 0 ? branchMatched : sameVenueRows;
			const kcisa = finalRows.slice(0, 10).map(mapKcisaRowToExhibition);

			setExhibitions([...manual, ...kcisa]);
			setStatus('success');
		});
		return () => {
			cancelled = true;
		};
	}, [venueName]);

	return { exhibitions, status };
}
