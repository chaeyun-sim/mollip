import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import type { ExhibitionSummary } from '@/src/hooks/queries/useExploreScreenData';
import {
	applyExhibitionDateFilters,
	getExhibitionStatus,
	todayExhibitionDateString,
} from '@/src/utils/exhibitionSearch';
import { supabase } from '@/src/utils/supabase';

export type FeaturedBadge = 'special' | 'popular' | 'upcoming';

export interface FeaturedPick extends ExhibitionSummary {
	badge: FeaturedBadge;
}

export const FEATURED_TAGLINES: Record<FeaturedBadge, string> = {
	special: '지금 아니면 못 봐요!',
	popular: '요즘 가장 핫한 전시',
	upcoming: '곧 오픈하는 신규 전시',
};

const CANDIDATE_LIMIT = 5;
const UPCOMING_WINDOW_DAYS = 30;
const FEATURED_TRIO_STALE_MS = 5 * 60 * 1000;

export function featuredTrioQueryKey() {
	return ['exhibitions', 'featured-trio'] as const;
}

function addDays(base: Date, days: number): Date {
	const d = new Date(base);
	d.setDate(d.getDate() + days);
	return d;
}

interface ExhibitionRow {
	id: number;
	title: string;
	venue_name_fallback: string | null;
	event_site: string | null;
	image_url: string | null;
	start_date: string;
	end_date: string;
}

function mapRow(row: ExhibitionRow): ExhibitionSummary {
	return {
		id: String(row.id),
		title: row.title,
		venue: [row.venue_name_fallback, row.event_site].filter(Boolean).join(' '),
		thumbnail: row.image_url,
		status: getExhibitionStatus({ startDate: row.start_date, endDate: row.end_date }),
	};
}

interface FeaturedTrioPools {
	specialItems: ExhibitionSummary[];
	upcomingItems: ExhibitionSummary[];
}

async function fetchFeaturedTrioPools(): Promise<FeaturedTrioPools> {
	const today = todayExhibitionDateString();
	const upcomingUntil = todayExhibitionDateString(addDays(new Date(), UPCOMING_WINDOW_DAYS));

	const [specialRes, upcomingRes] = await Promise.all([
		applyExhibitionDateFilters(
			supabase
				.from('exhibitions')
				.select('id, title, venue_name_fallback, event_site, image_url, start_date, end_date')
				.eq('type', '특별전')
				.lte('start_date', today)
				.gte('end_date', today)
				.order('end_date', { ascending: true })
				.limit(CANDIDATE_LIMIT),
		),
		applyExhibitionDateFilters(
			supabase
				.from('exhibitions')
				.select('id, title, venue_name_fallback, event_site, image_url, start_date, end_date')
				.gt('start_date', today)
				.lte('start_date', upcomingUntil)
				.order('start_date', { ascending: true })
				.limit(CANDIDATE_LIMIT),
		),
	]);

	if (specialRes.error) throw specialRes.error;
	if (upcomingRes.error) throw upcomingRes.error;

	return {
		specialItems: ((specialRes.data ?? []) as ExhibitionRow[]).map(mapRow),
		upcomingItems: ((upcomingRes.data ?? []) as ExhibitionRow[]).map(mapRow),
	};
}

function pickFeaturedTrio(
	specialItems: ExhibitionSummary[],
	popularItems: ExhibitionSummary[],
	upcomingItems: ExhibitionSummary[],
): FeaturedPick[] {
	const pools: { badge: FeaturedBadge; items: ExhibitionSummary[] }[] = [
		{ badge: 'special', items: specialItems },
		{ badge: 'popular', items: popularItems },
		{ badge: 'upcoming', items: upcomingItems },
	];
	const used = new Set<string>();
	const result: FeaturedPick[] = [];

	for (const pool of pools) {
		const found = pool.items.find((item) => !used.has(item.id));
		if (!found) continue;
		used.add(found.id);
		result.push({ ...found, badge: pool.badge });
	}

	for (const pool of pools) {
		if (result.length >= 3) break;
		for (const item of pool.items) {
			if (result.length >= 3) break;
			if (used.has(item.id)) continue;
			used.add(item.id);
			result.push({ ...item, badge: pool.badge });
		}
	}

	return result.slice(0, 3);
}

/**
 * 메인 캐러셀용 특별전 · 인기 · 곧 개봉 3장.
 * 인기 목록은 이미 받은 popularItems를 재사용하고, 특별전/곧 개봉만 조회한다.
 */
export function useFeaturedTrio(popularItems: ExhibitionSummary[]) {
	const query = useQuery({
		queryKey: featuredTrioQueryKey(),
		queryFn: fetchFeaturedTrioPools,
		staleTime: FEATURED_TRIO_STALE_MS,
		retry: 1,
	});

	const picks = useMemo(
		() =>
			pickFeaturedTrio(
				query.data?.specialItems ?? [],
				popularItems,
				query.data?.upcomingItems ?? [],
			),
		[query.data, popularItems],
	);

	return { picks };
}
