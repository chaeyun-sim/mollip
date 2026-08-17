import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const STORAGE_KEY = 'deadline_notification_ids';

type NotificationIdMap = Record<string, string[]>; // exhibitionId → [notifId, ...]

async function loadMap(): Promise<NotificationIdMap> {
	try {
		const raw = await AsyncStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}

async function saveMap(map: NotificationIdMap): Promise<void> {
	await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/** 북마크 추가 시 D-7, D-3 로컬 알림 예약 */
export async function scheduleDeadlineNotifications(
	exhibitionId: string,
	title: string,
	endDateStr: string, // 'YYYY-MM-DD'
): Promise<void> {
	const endDate = new Date(endDateStr);
	const now = new Date();
	const ids: string[] = [];

	const triggers: Array<{ daysLeft: number; body: string }> = [
		{ daysLeft: 7, body: '북마크한 전시가 7일 후 마감이에요' },
		{ daysLeft: 3, body: '북마크한 전시가 3일 후 마감이에요' },
	];

	for (const { daysLeft, body } of triggers) {
		const triggerDate = new Date(endDate);
		triggerDate.setDate(triggerDate.getDate() - daysLeft);
		triggerDate.setHours(10, 0, 0, 0);

		if (triggerDate <= now) continue;

		const id = await Notifications.scheduleNotificationAsync({
			content: {
				title,
				body,
				data: { exhibitionId },
			},
			trigger: {
				type: Notifications.SchedulableTriggerInputTypes.DATE,
				date: triggerDate,
			},
		});

		ids.push(id);
	}

	if (ids.length > 0) {
		const map = await loadMap();
		map[exhibitionId] = ids;
		await saveMap(map);
	}
}

/** 북마크 제거 시 예약된 알림 취소 */
export async function cancelDeadlineNotifications(exhibitionId: string): Promise<void> {
	const map = await loadMap();
	const ids = map[exhibitionId];
	if (!ids) return;

	await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
	delete map[exhibitionId];
	await saveMap(map);
}
