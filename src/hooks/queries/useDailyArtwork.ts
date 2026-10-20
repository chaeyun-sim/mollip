import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { getMetObjectImage } from '@/src/api/met';
import { DAILY_ARTWORKS } from '@/src/data/dailyArtworks';
import { useDailyArtworkStore } from '@/src/store/dailyArtworkStore';

const DAILY_ARTWORK_STALE_MS = 24 * 60 * 60 * 1000;

/**
 * 오늘의 명화 + Met 이미지. 해설을 들은 다음 날에만 다음 그림으로 넘어간다.
 * 저장된 진행 상태를 복원하기 전에는 artwork가 null이다. 이미지 실패는 null로 조용히 폴백한다.
 */
export function useDailyArtwork() {
	const { index, hasHydrated, syncToday, markListened } = useDailyArtworkStore(
		useShallow((s) => ({
			index: s.index,
			hasHydrated: s.hasHydrated,
			syncToday: s.syncToday,
			markListened: s.markListened,
		})),
	);

	// 홈에 돌아올 때마다 날짜가 바뀌었는지 확인한다 (앱을 켜 둔 채 자정을 넘긴 경우)
	useFocusEffect(syncToday);

	const artwork = hasHydrated ? (DAILY_ARTWORKS[index] ?? DAILY_ARTWORKS[0]) : null;

	const { data: imageUrl = null, isLoading } = useQuery({
		queryKey: ['met', 'object-image', artwork?.metObjectId],
		queryFn: () => getMetObjectImage(artwork?.metObjectId ?? 0),
		enabled: artwork !== null,
		staleTime: DAILY_ARTWORK_STALE_MS,
		retry: 1,
	});

	return { artwork, imageUrl, isImageLoading: isLoading, markListened };
}
