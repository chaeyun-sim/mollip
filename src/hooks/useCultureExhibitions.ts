import { useCallback, useEffect, useState } from 'react';
import { getCultureExhibitionList } from '@/src/api/culture';
import { inferGenreAndTags } from '@/src/utils/exhibitionClassification';
import { supabase } from '@/src/utils/supabase';
import { applyExhibitionDateFilters, isValidExhibitionDateString } from '@/src/utils/exhibitionSearch';
import { isStale, markSynced } from '@/src/utils/syncCache';

export interface CultureExhibitionItem {
	id: string;
	title: string;
	venue: string;
	startDate: string;
	endDate: string;
	thumbnail: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

// 홈 UI에 쓸 진행 중 전시 수
const RECOMMENDED_COUNT = 5;
// Supabase에 넣을 culture 전시 풀 (period2에서 전시만 모아 저장)
const CULTURE_SYNC_STORE_SIZE = 300;
/** data_sync_meta key — 바꾸면 다음 앱 실행 시 재동기화 */
const CULTURE_SYNC_SOURCE = 'culture_period_v2';

function formatDate(raw: string): string {
	if (raw.length !== 8) return raw;
	return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
}

function todayStr(): string {
	const now = new Date();
	return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
}

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

// exhibitions(source='culture'): 24h마다 period2 전시 목록으로 Supabase 캐시 갱신
// id가 자동증가 정수라 upsert 대신 source='culture' 행을 통째로 갈아끼운다.
async function syncCultureExhibitionsIfStale(): Promise<void> {
	if (!(await isStale(CULTURE_SYNC_SOURCE))) return;
	const res = await getCultureExhibitionList(CULTURE_SYNC_STORE_SIZE);
	const items = res.body.items
		.map(({ item }) => item)
		.filter((item) => item.startDate?.length === 8 && item.endDate?.length === 8);
	if (items.length === 0) return;
	const rows = items.map((item) => {
		const start_date = formatDate(item.startDate);
		const end_date = formatDate(item.endDate);
		if (!isValidExhibitionDateString(start_date) || !isValidExhibitionDateString(end_date)) {
			return null;
		}
		const { genre, type, tags } = inferGenreAndTags({
			title: item.title,
			description: item.place,
			legacyGenre: item.realmName,
		});
		return {
			source: 'culture' as const,
			venue_name_fallback: item.place || '장소 정보 없음',
			title: item.title,
			start_date,
			end_date,
			genre,
			type,
			tags: tags.length > 0 ? JSON.stringify(tags) : null,
			image_url: item.thumbnail || null,
			synced_at: new Date().toISOString(),
		};
	}).filter((row): row is NonNullable<typeof row> => row != null);
	const { error: deleteError } = await supabase.from('exhibitions').delete().eq('source', 'culture');
	if (deleteError) throw deleteError;
	const { error: insertError } = await supabase.from('exhibitions').upsert(rows, {
		onConflict: 'title,start_date,end_date',
		ignoreDuplicates: true,
	});
	if (insertError) throw insertError;
	await markSynced(CULTURE_SYNC_SOURCE);
}

let _cachedItems: CultureExhibitionItem[] | null = null;

export function useCultureExhibitions() {
	const [items, setItems] = useState<CultureExhibitionItem[]>(_cachedItems ?? []);
	const [status, setStatus] = useState<Status>(_cachedItems ? 'success' : 'idle');

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
					.limit(CULTURE_SYNC_STORE_SIZE),
			);
			if (error) throw error;

			const today = todayStr();
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
					title: item.title,
					venue: item.venue_name_fallback,
					startDate: item.start_date,
					endDate: item.end_date,
					thumbnail: item.image_url ?? '',
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
