import { useEffect, useMemo, useState } from 'react';

import type { ExhibitionSummary } from '@/src/hooks/useExploreScreenData';
import { supabase } from '@/src/utils/supabase';
import {
	applyExhibitionDateFilters,
	getExhibitionStatus,
	todayExhibitionDateString,
} from '@/src/utils/exhibitionSearch';
import type { AsyncStatus } from '@/src/types/asyncStatus.types';

export type FeaturedBadge = 'special' | 'popular' | 'upcoming';

export interface FeaturedPick extends ExhibitionSummary {
	badge: FeaturedBadge;
}

/** 캐러셀 헤드라인에 쓸 카피 — 전시 원제목 대신 노출 */
export const FEATURED_TAGLINES: Record<FeaturedBadge, string> = {
	special: '지금 아니면 못 봐요!',
	popular: '요즘 가장 핫한 전시',
	upcoming: '곧 오픈하는 신규 전시',
};

const CANDIDATE_LIMIT = 5;
const UPCOMING_WINDOW_DAYS = 30;

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

/**
 * 메인 캐러셀에 노출할 "특별전 · 인기 · 곧 개봉" 3장을 고른다.
 * - 특별전: type='특별전', 종료일이 가까운 순
 * - 인기: usePopularExhibitions 결과를 그대로 재사용(중복 조회 없음)
 * - 곧 개봉: 시작일이 오늘 이후 30일 이내, 시작일이 가까운 순
 * 카테고리가 비면 다른 카테고리 여분으로 채워 항상 최대 3장을 반환한다(REQ: 대체 노출).
 */
export function useFeaturedTrio(popularItems: ExhibitionSummary[]) {
	const [specialItems, setSpecialItems] = useState<ExhibitionSummary[]>([]);
	const [upcomingItems, setUpcomingItems] = useState<ExhibitionSummary[]>([]);
	const [status, setStatus] = useState<AsyncStatus>('loading');

	useEffect(() => {
		let cancelled = false;

		async function load() {
			const today = todayExhibitionDateString();
			const upcomingUntil = todayExhibitionDateString(addDays(new Date(), UPCOMING_WINDOW_DAYS));

			const [specialRes, upcomingRes] = await Promise.all([
				applyExhibitionDateFilters(
					supabase
						.from('exhibitions')
						.select('id, title, venue_name_fallback, event_site, image_url, start_date, end_date')
						.eq('type', '특별전')
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

			if (cancelled) return;

			if (specialRes.error || upcomingRes.error) {
				setStatus('error');
				return;
			}

			setSpecialItems(((specialRes.data ?? []) as ExhibitionRow[]).map(mapRow));
			setUpcomingItems(((upcomingRes.data ?? []) as ExhibitionRow[]).map(mapRow));
			setStatus('success');
		}

		void load();

		return () => {
			cancelled = true;
		};
	}, []);

	const picks = useMemo<FeaturedPick[]>(() => {
		const pools: { badge: FeaturedBadge; items: ExhibitionSummary[] }[] = [
			{ badge: 'special', items: specialItems },
			{ badge: 'popular', items: popularItems },
			{ badge: 'upcoming', items: upcomingItems },
		];
		const used = new Set<string>();
		const result: FeaturedPick[] = [];

		// 1순위: 카테고리별 대표 1장씩
		for (const pool of pools) {
			const found = pool.items.find((item) => !used.has(item.id));
			if (!found) continue;
			used.add(found.id);
			result.push({ ...found, badge: pool.badge });
		}

		// 2순위: 빈 자리는 다른 카테고리 여분으로 채운다
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
	}, [specialItems, popularItems, upcomingItems]);

	return { picks, status };
}
