import { useMemo } from 'react';

import type { DayVisit } from '@/src/store/visitStore';
import { useExhibitionPosterUrls } from '@/src/hooks/useExhibitionPosterUrls';

type DayImageMap = Record<string, { source?: { uri: string }; color?: string }>;

// @MX:NOTE: 날짜별 방문 기록에서 대표 이미지(포스터 URL)와 색상을 매핑하는 훅
// @MX:NOTE: 다이어리 캘린더·그리드의 날짜 셀 배경에 사용됨
export function useDayImages(visits: Record<string, DayVisit>): DayImageMap {
	const exhibitionPosterUrls = useExhibitionPosterUrls(visits);

	return useMemo(() => {
		const map: DayImageMap = {};
		for (const [dateKey, visit] of Object.entries(visits)) {
			const posterUrl = exhibitionPosterUrls[dateKey];
			const listenedImageUrl = visit.listened.find((l) => l.imageUrl)?.imageUrl;
			const imageUrl = posterUrl ?? listenedImageUrl;
			if (imageUrl) {
				map[dateKey] = { source: { uri: imageUrl } };
			} else if (visit.exhibitionTitle) {
				map[dateKey] = { color: '#C4A882' };
			}
		}
		return map;
	}, [visits, exhibitionPosterUrls]);
}
