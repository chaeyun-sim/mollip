import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { DayVisit } from '@/src/store/visitStore';
import { supabase } from '@/src/utils/supabase';
import {
	buildVisitExhibitionMeta,
	visitExhibitionIds,
	type VisitExhibitionMetaMaps,
	type VisitExhibitionRow,
} from '@/src/utils/visitExhibitionMeta';

/** 포스터·영문 이름은 거의 바뀌지 않는다 — 탭을 오갈 때마다 다시 받지 않게 오래 둔다 */
const VISIT_EXHIBITION_META_STALE_MS = 30 * 60 * 1000;

const fetchVisitExhibitionRows = async (ids: number[]): Promise<VisitExhibitionRow[]> => {
	const { data, error } = await supabase
		.from('exhibitions')
		.select('id, image_url, title_en, museums(name_en)')
		.in('id', ids);
	if (error) throw error;
	return (data ?? []) as unknown as VisitExhibitionRow[];
};

export interface VisitExhibitionMeta extends VisitExhibitionMetaMaps {
	/** 아직 포스터를 받는 중인 전시가 있는지 — 벽이 내 사진으로 먼저 채웠다가 바뀌지 않게 쓴다 */
	isLoading: boolean;
}

/**
 * 기록에 연결된 전시의 포스터와 영문 제목·장소를 한 번의 요청으로 받는다.
 * 결과는 React Query 캐시에 남아 다이어리 탭을 다시 열어도 바로 보인다.
 */
export function useVisitExhibitionMeta(visits: Record<string, DayVisit>): VisitExhibitionMeta {
	const ids = visitExhibitionIds(visits);
	const idsKey = ids.join(',');

	const query = useQuery({
		queryKey: ['exhibition', 'visit-meta', idsKey],
		queryFn: () => fetchVisitExhibitionRows(ids),
		enabled: ids.length > 0,
		staleTime: VISIT_EXHIBITION_META_STALE_MS,
		// 기록이 하나 늘어도 이미 받은 포스터는 그대로 두고 새 것만 이어서 채운다
		placeholderData: keepPreviousData,
	});

	const rows = query.data;
	const maps = useMemo(() => buildVisitExhibitionMeta(visits, rows ?? []), [visits, rows]);

	// 한 번도 받은 적이 없을 때만 "받는 중"으로 본다 — 실패하면 기다리지 않고 내 사진으로 채운다
	const isLoading = ids.length > 0 && query.isPending && !query.isError;
	return { ...maps, isLoading };
}
