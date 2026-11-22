import { useVisitExhibitionMeta } from '@/src/hooks/queries/useVisitExhibitionMeta';
import type { DayVisit } from '@/src/store/visitStore';

/**
 * 기록마다 연결된 전시 포스터 URL — visitKey → 포스터 URL.
 * 다이어리 벽과 같은 캐시를 쓰므로 한 번 받은 포스터는 다시 요청하지 않는다.
 */
export function useExhibitionPosterUrls(visits: Record<string, DayVisit>): Record<string, string> {
	return useVisitExhibitionMeta(visits).posterUrls;
}
