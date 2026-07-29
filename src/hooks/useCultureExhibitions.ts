import { useCallback, useEffect, useState } from 'react';
import { getCultureList } from '@/src/api/culture';
import { supabase } from '@/src/utils/supabase';
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

// 추천 전시 개수 — 온보딩/로그인 도입 후에는 사용자 취향 기반 추천으로 대체될 임시 상한.
const RECOMMENDED_COUNT = 5;
// 날짜 필터링 후에도 5개가 남도록 넉넉히 조회할 후보 풀 크기.
const CANDIDATE_POOL_SIZE = 30;

function formatDate(raw: string): string {
	if (raw.length !== 8) return raw;
	return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
}

function todayStr(): string {
	const now = new Date();
	return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}

function isOngoing(startDate: string, endDate: string, today: string): boolean {
	return startDate <= today && today <= endDate;
}

interface CultureExhibitionRow {
	seq: string;
	title: string;
	start_date: string | null;
	end_date: string | null;
	place: string | null;
	thumbnail: string | null;
}

// culture_exhibitions 캐시가 24시간 이상 오래됐으면 문화포털 realm2를 다시 호출해 테이블을 갱신한다.
async function syncCultureExhibitionsIfStale(): Promise<void> {
	if (!(await isStale('culture_realm'))) return;
	const res = await getCultureList(CANDIDATE_POOL_SIZE);
	const items = res.body.items.map(({ item }) => item);
	if (items.length === 0) return;
	const rows = items.map((item) => ({
		seq: item.seq,
		title: item.title,
		start_date: item.startDate || null,
		end_date: item.endDate || null,
		place: item.place || null,
		realm_name: item.realmName || null,
		area: item.area || null,
		thumbnail: item.thumbnail || null,
		gps_x: item.gpsX || null,
		gps_y: item.gpsY || null,
		sigungu: item.sigungu || null,
		service_name: item.serviceName || null,
	}));
	await supabase.from('culture_exhibitions').upsert(rows);
	await markSynced('culture_realm');
}

export function useCultureExhibitions() {
	const [items, setItems] = useState<CultureExhibitionItem[]>([]);
	const [status, setStatus] = useState<Status>('idle');

	const fetchExhibitions = useCallback(async () => {
		setStatus('loading');
		try {
			try {
				await syncCultureExhibitionsIfStale();
			} catch {
				// 캐시가 이미 있으면 공공API 실패는 무시하고 캐시로 계속 서비스한다.
			}
			const { data, error } = await supabase
				.from('culture_exhibitions')
				.select('seq, title, start_date, end_date, place, thumbnail')
				.limit(CANDIDATE_POOL_SIZE);
			if (error) throw error;

			const today = todayStr();
			setItems(
				((data ?? []) as CultureExhibitionRow[])
					.filter(
						(item): item is CultureExhibitionRow & { start_date: string; end_date: string } =>
							!!item.start_date && !!item.end_date && isOngoing(item.start_date, item.end_date, today),
					)
					.slice(0, RECOMMENDED_COUNT)
					.map((item) => ({
						id: item.seq,
						title: item.title,
						venue: item.place ?? '',
						startDate: formatDate(item.start_date),
						endDate: formatDate(item.end_date),
						thumbnail: item.thumbnail ?? '',
					})),
			);
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
