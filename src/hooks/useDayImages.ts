import { useMemo } from 'react';

import { dateKeyOf, type DayVisit } from '@/src/store/visitStore';
import { useExhibitionPosterUrls } from '@/src/hooks/useExhibitionPosterUrls';

type DayImageMap = Record<string, { source?: { uri: string }; color?: string }>;

// @MX:NOTE: 관람 기록(키: "날짜::전시")에서 날짜별 대표 이미지(포스터 URL)와 색상을 매핑하는 훅
// @MX:NOTE: 다이어리 캘린더의 날짜 셀 배경에 사용됨 — 하루에 여러 전시가 있으면 첫 번째 것을 대표로 쓴다
export function useDayImages(visits: Record<string, DayVisit>): DayImageMap {
	const exhibitionPosterUrls = useExhibitionPosterUrls(visits);

	return useMemo(() => {
		const map: DayImageMap = {};
		for (const [visitKey, visit] of Object.entries(visits)) {
			const dateKey = dateKeyOf(visitKey);
			if (map[dateKey]) continue; // 그 날짜는 이미 대표 이미지가 정해짐
			const posterUrl = exhibitionPosterUrls[visitKey];
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
