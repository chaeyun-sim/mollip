import { act } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { createRoot } from 'test-renderer';
import * as Notifications from 'expo-notifications';

import { usePushNotifications } from '../usePushNotifications';

jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('expo-constants', () => ({
	__esModule: true,
	default: { expoConfig: { extra: { eas: { projectId: 'test-project' } } } },
}));
jest.mock('expo-notifications', () => ({
	setNotificationHandler: jest.fn(),
	getPermissionsAsync: jest.fn(),
	requestPermissionsAsync: jest.fn(),
	getExpoPushTokenAsync: jest.fn(),
	setNotificationChannelAsync: jest.fn(),
	AndroidImportance: { MAX: 5 },
}));

const mockEq = jest.fn();
const mockUpdate = jest.fn();
jest.mock('@/src/utils/supabase', () => ({
	supabase: { from: jest.fn(() => ({ update: mockUpdate })) },
}));

const getPermissions = Notifications.getPermissionsAsync as jest.Mock;
const requestPermissions = Notifications.requestPermissionsAsync as jest.Mock;
const getPushToken = Notifications.getExpoPushTokenAsync as jest.Mock;

const TOKEN = 'ExponentPushToken[test-token]';

// 비동기 체인(권한 조회 → 토큰 발급 → 저장)이 끝날 때까지 마이크로태스크를 비운다.
const flush = async () => {
	for (let i = 0; i < 10; i += 1) {
		await act(async () => {
			await Promise.resolve();
		});
	}
};

let appStateListeners: ((state: AppStateStatus) => void)[] = [];

const renderPush = (userId: string | undefined) => {
	function Harness() {
		usePushNotifications(userId);
		return null;
	}
	const root = createRoot();
	act(() => {
		root.render(<Harness />);
	});
	return () => act(() => root.unmount());
};

beforeEach(() => {
	jest.clearAllMocks();
	appStateListeners = [];
	jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
		appStateListeners.push(listener as (state: AppStateStatus) => void);
		return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
	});
	mockEq.mockResolvedValue({ error: null });
	mockUpdate.mockImplementation(() => ({ eq: mockEq }));
	getPushToken.mockResolvedValue({ data: TOKEN });
});

describe('usePushNotifications', () => {
	it('로그인 시 권한이 허용되어 있으면 푸시 토큰을 저장한다', async () => {
		getPermissions.mockResolvedValue({ status: 'granted' });
		const unmount = renderPush('user-a');
		await flush();

		expect(mockUpdate).toHaveBeenCalledWith({ push_token: TOKEN });
		expect(mockEq).toHaveBeenCalledWith('id', 'user-a');
		unmount();
	});

	it('로그인 시 권한을 거부하면 토큰을 저장하지 않는다', async () => {
		getPermissions.mockResolvedValue({ status: 'undetermined' });
		requestPermissions.mockResolvedValue({ status: 'denied' });
		const unmount = renderPush('user-a');
		await flush();

		expect(mockUpdate).not.toHaveBeenCalled();
		unmount();
	});

	it('나중에 기기 설정에서 권한을 허용하고 앱으로 돌아오면 토큰을 저장한다', async () => {
		getPermissions.mockResolvedValue({ status: 'denied' });
		requestPermissions.mockResolvedValue({ status: 'denied' });
		const unmount = renderPush('user-a');
		await flush();
		expect(mockUpdate).not.toHaveBeenCalled();

		// 사용자가 설정 앱에서 알림을 켠 뒤 몰립으로 복귀
		getPermissions.mockResolvedValue({ status: 'granted' });
		act(() => {
			appStateListeners.forEach((listener) => listener('active'));
		});
		await flush();

		expect(mockUpdate).toHaveBeenCalledWith({ push_token: TOKEN });
		unmount();
	});

	it('앱으로 돌아올 때 권한이 여전히 꺼져 있으면 권한 팝업을 다시 띄우지 않는다', async () => {
		getPermissions.mockResolvedValue({ status: 'denied' });
		requestPermissions.mockResolvedValue({ status: 'denied' });
		const unmount = renderPush('user-a');
		await flush();
		expect(requestPermissions).toHaveBeenCalledTimes(1);

		act(() => {
			appStateListeners.forEach((listener) => listener('active'));
		});
		await flush();

		expect(requestPermissions).toHaveBeenCalledTimes(1);
		expect(mockUpdate).not.toHaveBeenCalled();
		unmount();
	});

	it('이미 토큰을 저장했으면 앱 복귀 때 다시 저장하지 않는다', async () => {
		getPermissions.mockResolvedValue({ status: 'granted' });
		const unmount = renderPush('user-a');
		await flush();

		act(() => {
			appStateListeners.forEach((listener) => listener('active'));
		});
		await flush();

		expect(mockUpdate).toHaveBeenCalledTimes(1);
		unmount();
	});
});
