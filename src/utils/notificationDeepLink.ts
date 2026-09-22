import type { useRouter } from 'expo-router';

import { useMapStore } from '@/src/store/mapStore';
import { supabase } from '@/src/utils/supabase';

type ExpoRouter = ReturnType<typeof useRouter>;

/**
 * 알림 tap(바로 수신) / 알림함 row tap 양쪽에서 재사용하는 딥링크 이동 로직.
 * data 형태는 각 supabase 알림 발송 Edge Function이 만드는 값과 1:1로 맞춰져 있다.
 */
export async function navigateToNotification(
	router: ExpoRouter,
	data: Record<string, unknown> | null | undefined,
): Promise<void> {
	const type = data?.type;

	if (type === 'visit_review' && typeof data?.date === 'string') {
		router.push(`/diary/${data.date}`);
		return;
	}

	if (type === 'notice' && typeof data?.noticeId === 'string') {
		router.push(`/settings/notice/${data.noticeId}`);
		return;
	}

	if (type === 'venue_follow' && typeof data?.museumId === 'number') {
		const { data: museum } = await supabase
			.from('museums')
			.select('name, gps_x, gps_y')
			.eq('id', data.museumId)
			.maybeSingle();

		if (museum?.name) {
			useMapStore.getState().setPendingCamera({
				venueName: museum.name,
				latitude: Number(museum.gps_y),
				longitude: Number(museum.gps_x),
			});
		}
		router.push('/(tabs)/map');
		return;
	}

	const exhibitionId = data?.exhibitionId;
	if (typeof exhibitionId === 'string' && exhibitionId) {
		router.push(`/(explore)/${exhibitionId}`);
		return;
	}

	router.push('/(tabs)/');
}
