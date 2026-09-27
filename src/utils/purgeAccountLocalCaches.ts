import AsyncStorage from '@react-native-async-storage/async-storage';

import {
	VISITS_ASYNC_KEY,
	clearAllLocalVisits,
	migrateVisitsFromAsyncStorage,
	slimAllLocalVisits,
} from '@/src/utils/localVisitDb';

const ACCOUNT_PERSIST_KEYS = [
	VISITS_ASYNC_KEY,
	'bookmarks',
	'bookmark-audio',
	'audio-history',
] as const;

/** 계정 전환 시에만 지운다. 로그인/세션 복원 때 지우면 진행 중 몰입이 메인으로 떨어진다. */
const SESSION_PERSIST_KEYS = ['immersive-store', 'chat-store'] as const;

/** 계정 데이터가 기기에 남지 않게 디스크를 정리한다. */
export const purgeAccountLocalCaches = async (
	mode: 'login' | 'logout' = 'login',
): Promise<void> => {
	if (mode === 'logout') {
		clearAllLocalVisits();
		await Promise.all(
			[...ACCOUNT_PERSIST_KEYS, ...SESSION_PERSIST_KEYS].map((key) => AsyncStorage.removeItem(key)),
		);
		return;
	}

	await migrateVisitsFromAsyncStorage();
	slimAllLocalVisits();
	await Promise.all(ACCOUNT_PERSIST_KEYS.map((key) => AsyncStorage.removeItem(key)));
};
