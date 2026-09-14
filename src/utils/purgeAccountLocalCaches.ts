import AsyncStorage from '@react-native-async-storage/async-storage';

import {
	VISITS_ASYNC_KEY,
	clearAllLocalVisits,
	migrateVisitsFromAsyncStorage,
	slimAllLocalVisits,
} from '@/src/utils/localVisitDb';

const ACCOUNT_PERSIST_KEYS = [
	VISITS_ASYNC_KEY,
	'immersive-store',
	'bookmarks',
	'bookmark-audio',
	'audio-history',
] as const;

/** 계정 데이터가 기기에 남지 않게 디스크를 정리한다. */
export const purgeAccountLocalCaches = async (
	mode: 'login' | 'logout' = 'login',
): Promise<void> => {
	if (mode === 'logout') {
		clearAllLocalVisits();
		await Promise.all(ACCOUNT_PERSIST_KEYS.map((key) => AsyncStorage.removeItem(key)));
		return;
	}

	await migrateVisitsFromAsyncStorage();
	slimAllLocalVisits();
	await Promise.all(ACCOUNT_PERSIST_KEYS.map((key) => AsyncStorage.removeItem(key)));
};
