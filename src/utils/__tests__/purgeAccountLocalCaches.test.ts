import AsyncStorage from '@react-native-async-storage/async-storage';

import { purgeAccountLocalCaches } from '../purgeAccountLocalCaches';

jest.mock('@react-native-async-storage/async-storage', () =>
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@/src/utils/localVisitDb', () => ({
	VISITS_ASYNC_KEY: 'visits',
	clearAllLocalVisits: jest.fn(),
	migrateVisitsFromAsyncStorage: jest.fn(async () => undefined),
	slimAllLocalVisits: jest.fn(),
}));

beforeEach(async () => {
	await AsyncStorage.clear();
	await AsyncStorage.setItem('immersive-store', JSON.stringify({ isImmersiveMode: true }));
	await AsyncStorage.setItem('chat-store', JSON.stringify({ sessions: {} }));
	await AsyncStorage.setItem('bookmarks', '[]');
});

describe('purgeAccountLocalCaches', () => {
	it('로그인/세션 복원 때는 진행 중 몰입 세션을 지우지 않는다', async () => {
		await purgeAccountLocalCaches('login');

		expect(await AsyncStorage.getItem('immersive-store')).toBeTruthy();
		expect(await AsyncStorage.getItem('chat-store')).toBeTruthy();
		expect(await AsyncStorage.getItem('bookmarks')).toBeNull();
	});

	it('로그아웃 때는 몰입 세션도 함께 지운다', async () => {
		await purgeAccountLocalCaches('logout');

		expect(await AsyncStorage.getItem('immersive-store')).toBeNull();
		expect(await AsyncStorage.getItem('chat-store')).toBeNull();
		expect(await AsyncStorage.getItem('bookmarks')).toBeNull();
	});
});
