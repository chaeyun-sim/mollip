import { getCultureByArea } from '@/src/api/culture';
import { supabase } from '@/src/utils/supabase';
import {
	KCISA_EXHIBITION_COLUMNS,
	mapKcisaRowToExhibition,
} from '@/src/utils/kcisaExhibitionMapper';
import type { Exhibition } from '@/src/data/exhibitions';

interface FindRelatedParams {
	excludeId: string;
	venue?: string;
	artist?: string;
	genre?: string;
	// 문화포털 소스에서만 신뢰할 수 있는 지역 정보 (같은 시/도 폴백용).
	area?: string;
	sigungu?: string;
	limit?: number;
}

const RELATED_LIMIT = 6;

function escapeIlike(value: string): string {
	return value.replace(/[%_]/g, (c) => `\\${c}`);
}

function formatCultureDate(raw: string): string {
	if (raw.length !== 8) return raw;
	return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
}

interface ScoredExhibition {
	exhibition: Exhibition;
	score: number;
}

// KCISA 캐시(20개 기관만 커버)에서 같은 미술관 · 같은 작가 · 같은 장르 매칭.
async function findFromKcisa({
	excludeId,
	venue,
	artist,
	genre,
}: FindRelatedParams): Promise<ScoredExhibition[]> {
	const conditions: string[] = [];
	if (venue) conditions.push(`institution.ilike.%${escapeIlike(venue)}%`);
	if (artist) conditions.push(`author.eq.${escapeIlike(artist)}`);
	if (genre) conditions.push(`genre.eq.${escapeIlike(genre)}`);
	if (conditions.length === 0) return [];

	const { data } = await supabase
		.from('kcisa_exhibitions')
		.select(KCISA_EXHIBITION_COLUMNS)
		.or(conditions.join(','))
		.neq('id', excludeId)
		.limit(RELATED_LIMIT * 3);

	return (data ?? []).map((row) => {
		let score = 0;
		if (venue && row.institution && venue.includes(row.institution)) score += 4;
		if (artist && row.author === artist) score += 3;
		if (genre && row.genre === genre) score += 1;
		return { exhibition: mapKcisaRowToExhibition(row), score };
	});
}

// KCISA에 없는 기관(예: 국립민속박물관 같은 소규모/비주요 기관)은 문화포털 지역 검색(area2)으로
// "같은 시/도에서 하는 전시"를 폴백으로 채운다. 우리 culture_exhibitions 캐시는 홈 화면용
// 30건 샘플이라 특정 지역 검색엔 안 맞아서, 이건 그때그때 라이브로 조회한다.
async function findFromCultureArea({
	excludeId,
	venue,
	area,
	sigungu,
}: FindRelatedParams): Promise<ScoredExhibition[]> {
	if (!area || !sigungu) return [];
	try {
		const res = await getCultureByArea(area, sigungu);
		return res.body.items
			.map(({ item }) => item)
			.filter((item) => item.seq !== excludeId)
			.map((item) => {
				const score = venue && item.place === venue ? 4 : 2;
				const exhibition: Exhibition = {
					id: item.seq,
					title: item.title,
					venue: item.place,
					startDate: formatCultureDate(item.startDate),
					endDate: formatCultureDate(item.endDate),
					description: '',
					posterColor: '#E8E4DC',
					genre: '전시',
					heroImageUri: item.thumbnail || undefined,
					openHours: '운영시간 정보 없음',
					admission: '정보 없음',
					artworks: [],
					relatedExhibitionIds: [],
				};
				return { exhibition, score };
			});
	} catch {
		return [];
	}
}

// 같은 미술관 · 같은 작가 · 같은 시/도 중 하나라도 겹치면 "관련 전시" 후보로 본다.
// description 없는(대부분 비주요 기관) 전시는 큐레이션된 relatedExhibitionIds가 없으므로
// 이 넓은 매칭으로 채운다. 매칭 강도(미술관 > 작가 > 지역 > 장르 순)로 정렬해 최대 6개.
export async function findRelatedExhibitions(params: FindRelatedParams): Promise<Exhibition[]> {
	const [kcisaResults, areaResults] = await Promise.all([
		findFromKcisa(params),
		findFromCultureArea(params),
	]);

	const merged = new Map<string, ScoredExhibition>();
	for (const candidate of [...kcisaResults, ...areaResults]) {
		const existing = merged.get(candidate.exhibition.id);
		if (!existing || existing.score < candidate.score) {
			merged.set(candidate.exhibition.id, candidate);
		}
	}

	return Array.from(merged.values())
		.sort((a, b) => b.score - a.score)
		.slice(0, params.limit ?? RELATED_LIMIT)
		.map((m) => m.exhibition);
}
