import { useCallback, useEffect, useState } from 'react';
import { getCultureExhibitionList } from '@/src/api/culture';
import { inferGenreAndTags } from '@/src/utils/exhibitionClassification';
import { supabase } from '@/src/utils/supabase';
import {
	applyExhibitionDateFilters,
	getExhibitionStatus,
	isExhibitionEndDateEligible,
	isExhibitionListingTitle,
	isValidExhibitionDateString,
	todayExhibitionDateString,
	type ExhibitionStatus,
} from '@/src/utils/exhibitionSearch';
import { formatDate } from '@/src/utils/cultureExhibitionMapper';
import { normalizeExhibitionTitle, stripHtml } from '@/src/utils/stripHtml';
import { isStale, markSynced } from '@/src/utils/syncCache';
import type { AsyncStatus } from '@/src/types/asyncStatus.types';

export interface CultureExhibitionItem {
	id: string;
	title: string;
	venue: string;
	startDate: string;
	endDate: string;
	thumbnail: string;
	status: ExhibitionStatus;
}

// 홈 UI에 쓸 진행 중 전시 수
const RECOMMENDED_COUNT = 5;
/** data_sync_meta key — 바꾸면 다음 앱 실행 시 재동기화 */
const CULTURE_SYNC_SOURCE = 'culture_period_v3';

function isOngoing(startDate: string, endDate: string, today: string): boolean {
	return startDate <= today && today <= endDate;
}

interface ExhibitionCultureRow {
	id: number;
	title: string;
	start_date: string;
	end_date: string;
	venue_name_fallback: string;
	image_url: string | null;
}

// exhibitions(source='culture'): 24h마다 period2에서 없는 제목만 추가. 기존 행은 유지.
async function syncCultureExhibitionsIfStale(): Promise<void> {
	if (!(await isStale(CULTURE_SYNC_SOURCE))) return;
	const res = await getCultureExhibitionList();
	const items = res.body.items
		.map(({ item }) => item)
		.filter((item) => item.startDate?.length === 8 && item.endDate?.length === 8);
	if (items.length === 0) return;
	const rows = items
		.map((item) => {
			const start_date = formatDate(item.startDate);
			const end_date = formatDate(item.endDate);
			if (
				!isValidExhibitionDateString(start_date) ||
				!isExhibitionEndDateEligible(end_date)
			) {
				return null;
			}
			const title = stripHtml(item.title);
			if (!isExhibitionListingTitle(title)) {
				return null;
			}
			const { genre, type, tags } = inferGenreAndTags({
				title,
				description: item.place,
				legacyGenre: item.realmName,
			});
			return {
				source: 'culture' as const,
				venue_name_fallback: item.place || '장소 정보 없음',
				title,
				start_date,
				end_date,
				genre,
				type,
				tags: tags.length > 0 ? JSON.stringify(tags) : null,
				image_url: item.thumbnail || null,
				synced_at: new Date().toISOString(),
			};
		})
		.filter((row): row is NonNullable<typeof row> => row != null);
	const { data: existing } = await supabase.from('exhibitions').select('title');
	const taken = new Set(
		(existing ?? []).map((row) => normalizeExhibitionTitle((row as { title?: string }).title ?? '')),
	);
	const deduped: typeof rows = [];
	const seenTitles = new Set<string>();
	for (const row of rows) {
		const key = normalizeExhibitionTitle(row.title);
		if (!key || taken.has(key) || seenTitles.has(key)) continue;
		seenTitles.add(key);
		deduped.push(row);
	}
	if (deduped.length === 0) {
		await markSynced(CULTURE_SYNC_SOURCE);
		return;
	}
	const { error: insertError } = await supabase.from('exhibitions').upsert(deduped, {
		onConflict: 'title,start_date,end_date',
		ignoreDuplicates: true,
	});
	if (insertError) throw insertError;
	await markSynced(CULTURE_SYNC_SOURCE);
}

let _cachedItems: CultureExhibitionItem[] | null = null;

export function useCultureExhibitions() {
	const [items, setItems] = useState<CultureExhibitionItem[]>(_cachedItems ?? []);
	const [status, setStatus] = useState<AsyncStatus>(_cachedItems ? 'success' : 'idle');

	const fetchExhibitions = useCallback(async () => {
		if (_cachedItems) {
			setItems(_cachedItems);
			setStatus('success');
			return;
		}
		setStatus('loading');
		try {
			try {
				await syncCultureExhibitionsIfStale();
			} catch {
				// 캐시가 이미 있으면 공공API 실패는 무시하고 캐시로 계속 서비스한다.
			}
			const { data, error } = await applyExhibitionDateFilters(
				supabase
					.from('exhibitions')
					.select('id, title, start_date, end_date, venue_name_fallback, image_url')
					.eq('source', 'culture')
					.gte('end_date', todayExhibitionDateString()),
			);
			if (error) throw error;

			const today = todayExhibitionDateString();
			const mapped = ((data ?? []) as ExhibitionCultureRow[])
				.filter(
					(item): item is ExhibitionCultureRow & { start_date: string; end_date: string } =>
						isValidExhibitionDateString(item.start_date) &&
						isValidExhibitionDateString(item.end_date) &&
						isOngoing(item.start_date, item.end_date, today),
				)
				.slice(0, RECOMMENDED_COUNT)
				.map((item) => ({
					id: String(item.id),
					title: stripHtml(item.title),
					venue: item.venue_name_fallback,
					startDate: item.start_date,
					endDate: item.end_date,
					thumbnail: item.image_url ?? '',
					status: getExhibitionStatus({ startDate: item.start_date, endDate: item.end_date }),
				}));
			_cachedItems = mapped;
			setItems(mapped);
			setStatus('success');
		} catch {
			setStatus('error');
		}
	}, []);

	useEffect(() => {
		fetchExhibitions();
	}, [fetchExhibitions]);

	return { items, status, refetch: fetchExhibitions };
}
