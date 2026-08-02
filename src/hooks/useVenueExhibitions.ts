import { useEffect, useState } from 'react';
import { supabase } from '@/src/utils/supabase';
import {
	EXHIBITION_COLUMNS,
	mapExhibitionRowToExhibition,
	type ExhibitionRow,
} from '@/src/utils/exhibitionMapper';
import { applyExhibitionDateFilters, isExhibitionListed, todayExhibitionDateString } from '@/src/utils/exhibitionSearch';
import type { Exhibition } from '@/src/data/exhibitions';

type Status = 'idle' | 'loading' | 'success' | 'error';

function escapeIlike(value: string): string {
	return value.replace(/[%_]/g, (c) => `\\${c}`);
}

// KCISA institution 컬럼은 "국립현대미술관"처럼 분관 접미사 없는 짧은 공식 명칭인 반면,
// 지도 마커 이름은 "국립현대미술관 서울관"처럼 분관까지 포함하거나, 반대로 "종로구립 고희동미술관"
// 처럼 앞에 소속 수식어가 붙기도 한다. 앞/뒤에서 단어를 하나씩 떼어내며 후보를 만들어 ilike OR
// 조건으로 넓게 조회한다. 이 단계는 일부러 느슨하게(포함 관계) 잡고, 실제 동일 장소 여부는
// isSameVenue로 다시 거른다.
function venueNameCandidates(venueName: string): string[] {
	const words = venueName.trim().split(/\s+/).filter(Boolean);
	const candidates = new Set<string>();
	for (let i = words.length; i >= 1; i--) {
		candidates.add(words.slice(0, i).join(' ')); // 뒤에서부터 제거 (분관 접미사 케이스)
		candidates.add(words.slice(words.length - i).join(' ')); // 앞에서부터 제거 (소속 접두사 케이스)
	}
	return Array.from(candidates);
}

// "경주예술의전당" !== "예술의전당" (단순 포함이면 오탐) 이지만
// "국립현대미술관 서울관" === "국립현대미술관" (분관 접미사)
// "종로구립 고희동미술관" === "고희동미술관" (소속 접두사) 이길 원하므로,
// 문자 단위 부분 문자열이 아니라 "단어 배열" 기준으로 한쪽이 다른 쪽의 앞/뒤 부분과
// 완전히 일치하는지를 본다 (단어 경계가 없는 "경주"+"예술의전당" 같은 붙여쓰기는 걸러진다).
function isSameVenue(a: string, b: string): boolean {
	const wordsA = a.trim().split(/\s+/).filter(Boolean);
	const wordsB = b.trim().split(/\s+/).filter(Boolean);
	if (wordsA.length === 0 || wordsB.length === 0) return false;
	const [longer, shorter] = wordsA.length >= wordsB.length ? [wordsA, wordsB] : [wordsB, wordsA];
	const isPrefix = shorter.every((w, i) => longer[i] === w);
	const isSuffix = shorter.every((w, i) => longer[longer.length - shorter.length + i] === w);
	return isPrefix || isSuffix;
}

// 지도 마커(미술관 API 등)로 추가된, 정적 전시 데이터가 없는 장소를 위해 통합 exhibitions
// 테이블을 장소 이름으로 조회한다. API가 못 채우는 소규모 갤러리는 source='manual' 행으로
// 채워 넣으면 여기서 함께 잡힌다 (kcisa/manual 구분 없이 같은 테이블, 같은 쿼리).
export function useVenueExhibitions(venueName: string | null, museumId?: number | null) {
	const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
	const [status, setStatus] = useState<Status>('idle');

	useEffect(() => {
		if (!venueName && museumId == null) {
			setExhibitions([]);
			setStatus('idle');
			return;
		}
		let cancelled = false;
		setStatus('loading');

		const loadByMuseumId = museumId != null;
		const query = applyExhibitionDateFilters(
			supabase
				.from('exhibitions')
				.select(EXHIBITION_COLUMNS)
				.gte('end_date', todayExhibitionDateString())
				.order('start_date', {
					ascending: false,
				}),
		);

		const request = loadByMuseumId
			? query.eq('museum_id', museumId!).limit(60)
			: (() => {
					const orFilter = venueNameCandidates(venueName!)
						.map((c) => `venue_name_fallback.ilike.%${escapeIlike(c)}%`)
						.join(',');
					return query.or(orFilter).limit(60);
				})();

		request.then(({ data, error }) => {
				if (cancelled) return;
				if (error || !data) {
					setStatus('error');
					return;
				}

				// 1) 느슨하게 넓혀 가져온 후보 중, 실제로 같은 장소인 것만 남긴다
				//    (예: "경주예술의전당"이 "예술의전당" 조회에 섞여 들어오는 것을 제외).
				let finalRows = data as ExhibitionRow[];
				if (!loadByMuseumId && venueName) {
					const sameVenueRows = finalRows.filter((row) =>
						isSameVenue(row.venue_name_fallback, venueName),
					);
					const branchMatched = sameVenueRows.filter(
						(row) => row.event_site && venueName.includes(row.event_site),
					);
					finalRows = branchMatched.length > 0 ? branchMatched : sameVenueRows;
				}

				setExhibitions(
					finalRows
						.slice(0, 20)
						.map((row) => mapExhibitionRowToExhibition(row))
						.filter((ex) => isExhibitionListed(ex)),
				);
				setStatus('success');
			});
		return () => {
			cancelled = true;
		};
	}, [venueName, museumId]);

	return { exhibitions, status };
}
