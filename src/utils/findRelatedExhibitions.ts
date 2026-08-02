import { getCultureByArea } from '@/src/api/culture';
import { supabase } from '@/src/utils/supabase';
import { EXHIBITION_COLUMNS, mapExhibitionRowToExhibition, type ExhibitionRow } from '@/src/utils/exhibitionMapper';
import type { Exhibition } from '@/src/data/exhibitions';
import { isExhibitionListed, todayExhibitionDateString, applyExhibitionDateFilters } from '@/src/utils/exhibitionSearch';

interface FindRelatedParams {
	excludeId: string;
	venue?: string;
	venueDisplay?: string;
	artist?: string;
	genre?: string;
	tags?: string[];
	museumId?: number | null;
	area?: string;
	sigungu?: string;
	limit?: number;
}

const RELATED_LIMIT = 6;
const MIN_RELATED = 2;

function escapeIlike(value: string): string {
	return value.replace(/[%_]/g, (c) => `\\${c}`);
}

function formatCultureDate(raw: string): string {
	if (raw.length !== 8) return raw;
	return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
}

function countSharedTags(a: string[] | undefined, b: string[] | undefined): number {
	if (!a?.length || !b?.length) return 0;
	const set = new Set(a);
	return b.filter((t) => set.has(t)).length;
}

function isSameVenue(a: string, b: string): boolean {
	const wordsA = a.trim().split(/\s+/).filter(Boolean);
	const wordsB = b.trim().split(/\s+/).filter(Boolean);
	if (wordsA.length === 0 || wordsB.length === 0) return false;
	const [longer, shorter] = wordsA.length >= wordsB.length ? [wordsA, wordsB] : [wordsB, wordsA];
	const isPrefix = shorter.every((w, i) => longer[i] === w);
	const isSuffix = shorter.every((w, i) => longer[longer.length - shorter.length + i] === w);
	return isPrefix || isSuffix;
}

interface ScoredExhibition {
	exhibition: Exhibition;
	score: number;
}

function listedRowsToScored(
	rows: ExhibitionRow[],
	scoreFor: (row: ExhibitionRow, ex: Exhibition) => number,
): ScoredExhibition[] {
	return rows
		.map((row) => {
			const exhibition = mapExhibitionRowToExhibition(row);
			return { exhibition, score: scoreFor(row, exhibition) };
		})
		.filter(({ exhibition }) => isExhibitionListed(exhibition));
}

async function findFromKcisa({
	excludeId,
	venue,
	artist,
	genre,
}: FindRelatedParams): Promise<ScoredExhibition[]> {
	const conditions: string[] = [];
	if (venue) conditions.push(`venue_name_fallback.ilike.%${escapeIlike(venue)}%`);
	if (artist) conditions.push(`artist.eq.${escapeIlike(artist)}`);
	if (genre) conditions.push(`genre.eq.${escapeIlike(genre)}`);
	if (conditions.length === 0) return [];

	const { data } = await applyExhibitionDateFilters(
		supabase
			.from('exhibitions')
			.select(EXHIBITION_COLUMNS)
			.or(conditions.join(','))
			.neq('id', excludeId)
			.gte('end_date', todayExhibitionDateString())
			.limit(RELATED_LIMIT * 3),
	);

	return (data ?? [])
		.map((row) => {
			let score = 0;
			if (venue && row.venue_name_fallback && venue.includes(row.venue_name_fallback)) score += 4;
			if (artist && row.artist === artist) score += 3;
			if (genre && row.genre === genre) score += 1;
			return { exhibition: mapExhibitionRowToExhibition(row), score };
		})
		.filter(({ exhibition }) => isExhibitionListed(exhibition));
}

async function findBySameLocation({
	excludeId,
	museumId,
	venue,
	venueDisplay,
}: FindRelatedParams): Promise<ScoredExhibition[]> {
	const venueLabels = [venue, venueDisplay].filter(Boolean) as string[];
	const byId = new Map<string, ScoredExhibition>();

	if (museumId != null) {
		const { data } = await applyExhibitionDateFilters(
			supabase
				.from('exhibitions')
				.select(EXHIBITION_COLUMNS)
				.eq('museum_id', museumId)
				.neq('id', excludeId)
				.gte('end_date', todayExhibitionDateString())
				.limit(24),
		);
		for (const row of (data ?? []) as ExhibitionRow[]) {
			const exhibition = mapExhibitionRowToExhibition(row);
			if (!isExhibitionListed(exhibition)) continue;
			byId.set(exhibition.id, { exhibition, score: 6 });
		}
	}

	if (venueLabels.length > 0) {
		const orFilter = venueLabels
			.flatMap((v) => {
				const e = escapeIlike(v.trim());
				return [`venue_name_fallback.eq.${e}`, `venue_name_fallback.ilike.%${e}%`];
			})
			.join(',');
		const { data } = await applyExhibitionDateFilters(
			supabase
				.from('exhibitions')
				.select(EXHIBITION_COLUMNS)
				.or(orFilter)
				.neq('id', excludeId)
				.gte('end_date', todayExhibitionDateString())
				.limit(40),
		);
		for (const row of (data ?? []) as ExhibitionRow[]) {
			const exhibition = mapExhibitionRowToExhibition(row);
			if (!isExhibitionListed(exhibition)) continue;
			const label = venueDisplay ?? venue ?? '';
			const samePlace =
				venueLabels.some((v) => row.venue_name_fallback.trim() === v.trim()) ||
				(label && isSameVenue(label, row.venue_name_fallback));
			if (!samePlace) continue;
			const prev = byId.get(exhibition.id);
			const score = row.venue_name_fallback.trim() === (venue ?? '').trim() ? 5 : 4;
			if (!prev || prev.score < score) byId.set(exhibition.id, { exhibition, score });
		}
	}

	return Array.from(byId.values());
}

async function findBySharedTags(
	excludeId: string,
	tags: string[] | undefined,
	minShared: number,
): Promise<ScoredExhibition[]> {
	if (!tags?.length || tags.length < minShared) return [];

	const { data } = await applyExhibitionDateFilters(
		supabase
			.from('exhibitions')
			.select(EXHIBITION_COLUMNS)
			.overlaps('tags', tags)
			.neq('id', excludeId)
			.gte('end_date', todayExhibitionDateString())
			.limit(60),
	);

	return listedRowsToScored((data ?? []) as ExhibitionRow[], (_row, ex) => {
		const shared = countSharedTags(tags, ex.tags);
		return shared >= minShared ? 3 + shared : 0;
	}).filter(({ score }) => score > 0);
}

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
			})
			.filter(({ exhibition }) => isExhibitionListed(exhibition));
	} catch {
		return [];
	}
}

function mergeScored(
	target: Map<string, ScoredExhibition>,
	candidates: ScoredExhibition[],
): void {
	for (const candidate of candidates) {
		const existing = target.get(candidate.exhibition.id);
		if (!existing || existing.score < candidate.score) {
			target.set(candidate.exhibition.id, candidate);
		}
	}
}

function toExhibitionList(merged: Map<string, ScoredExhibition>, limit: number): Exhibition[] {
	return Array.from(merged.values())
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map((m) => m.exhibition)
		.filter((ex) => isExhibitionListed(ex));
}

async function ensureMinimumRelated(
	params: FindRelatedParams,
	merged: Map<string, ScoredExhibition>,
): Promise<void> {
	if (merged.size >= MIN_RELATED) return;

	const [byLocation, byTags2] = await Promise.all([
		findBySameLocation(params),
		findBySharedTags(params.excludeId, params.tags, 2),
	]);
	mergeScored(merged, byLocation);
	mergeScored(merged, byTags2);

	if (merged.size >= MIN_RELATED) return;

	const byTags1 = await findBySharedTags(params.excludeId, params.tags, 1);
	mergeScored(merged, byTags1);

	if (merged.size >= MIN_RELATED) return;

	const { data: recent } = await applyExhibitionDateFilters(
		supabase
			.from('exhibitions')
			.select(EXHIBITION_COLUMNS)
			.neq('id', params.excludeId)
			.gte('end_date', todayExhibitionDateString())
			.order('start_date', { ascending: false })
			.limit(12),
	);
	for (const row of (recent ?? []) as ExhibitionRow[]) {
		if (merged.size >= MIN_RELATED) break;
		const exhibition = mapExhibitionRowToExhibition(row);
		if (!isExhibitionListed(exhibition) || merged.has(exhibition.id)) continue;
		merged.set(exhibition.id, { exhibition, score: 1 });
	}
}

export async function findRelatedExhibitions(params: FindRelatedParams): Promise<Exhibition[]> {
	const targetLimit = params.limit ?? RELATED_LIMIT;
	const merged = new Map<string, ScoredExhibition>();

	const [kcisaResults, areaResults] = await Promise.all([
		findFromKcisa(params),
		findFromCultureArea(params),
	]);
	mergeScored(merged, kcisaResults);
	mergeScored(merged, areaResults);

	await ensureMinimumRelated(params, merged);

	return toExhibitionList(merged, targetLimit);
}
