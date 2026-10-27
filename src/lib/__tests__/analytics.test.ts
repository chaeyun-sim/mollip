let mockPlatform = 'ios';
let mockEnabled = true;
const mockInstance = {};
const mockGetAnalytics = jest.fn();
const mockSetCollection = jest.fn();
const mockLogEvent = jest.fn();

jest.mock('react-native', () => {
	const native = jest.requireActual('react-native');
	const platform = Object.create(native.Platform);
	Object.defineProperty(platform, 'OS', { get: () => mockPlatform });
	const mocked = Object.create(native);
	Object.defineProperty(mocked, 'Platform', { value: platform });
	return mocked;
});
jest.mock('expo-constants', () => ({
	__esModule: true,
	default: {
		get expoConfig() {
			return { extra: { analyticsEnabled: mockEnabled } };
		},
	},
}));
jest.mock('@react-native-firebase/analytics', () => ({
	getAnalytics: mockGetAnalytics,
	setAnalyticsCollectionEnabled: mockSetCollection,
	logEvent: mockLogEvent,
}));

let analytics: typeof import('../analytics');

beforeEach(() => {
	mockPlatform = 'ios';
	mockEnabled = true;
	mockGetAnalytics.mockReset().mockReturnValue(mockInstance);
	mockSetCollection.mockReset().mockResolvedValue(undefined);
	mockLogEvent.mockReset().mockResolvedValue(undefined);
	jest.isolateModules(() => {
		// SDK 초기화 캐시를 테스트마다 독립적으로 검증하기 위해 지연 로드한다.
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		analytics = require('../analytics');
	});
});

it.each(['android', 'web'])(
	'%s에서는 Firebase를 초기화하거나 전송하지 않는다',
	async (platform) => {
		mockPlatform = platform;
		const { trackLogin } = analytics;
		expect(await trackLogin('apple')).toBe(false);
		expect(mockGetAnalytics).not.toHaveBeenCalled();
		expect(mockLogEvent).not.toHaveBeenCalled();
	},
);

it('개발/preview 기본 비활성 상태에서는 초기화와 이벤트를 보내지 않는다', async () => {
	mockEnabled = false;
	const { trackScreenView } = analytics;
	expect(await trackScreenView('/(tabs)/index')).toBe(false);
	expect(mockGetAnalytics).not.toHaveBeenCalled();
});

it('동시에 발생한 이벤트는 한 번의 초기화를 공유한다', async () => {
	let finishEnable: (() => void) | undefined;
	mockSetCollection.mockImplementation(
		() =>
			new Promise<void>((resolve) => {
				finishEnable = resolve;
			}),
	);
	const { trackScreenView, trackLogin } = analytics;
	const first = trackScreenView('/(tabs)/index');
	const second = trackLogin('apple');
	await new Promise((resolve) => setTimeout(resolve, 0));
	expect(mockGetAnalytics).toHaveBeenCalledTimes(1);
	expect(mockSetCollection).toHaveBeenCalledWith(mockInstance, true);
	expect(mockLogEvent).not.toHaveBeenCalled();
	finishEnable?.();
	expect(await Promise.all([first, second])).toEqual([true, true]);
	expect(mockLogEvent).toHaveBeenCalledTimes(2);
});

it('검색어·이메일 없이 제한된 이벤트 파라미터만 전송한다', async () => {
	const { trackScreenView, trackLogin, trackExhibitionSelection, trackSearchSubmitted } = analytics;
	await trackScreenView('/(explore)/[id]');
	await trackLogin('kakao');
	await trackExhibitionSelection('123');
	await trackSearchSubmitted(8);
	expect(mockLogEvent.mock.calls).toEqual([
		[mockInstance, 'screen_view', { screen_name: '/(explore)/[id]', screen_class: 'ExpoRouter' }],
		[mockInstance, 'login', { method: 'kakao' }],
		[mockInstance, 'select_content', { content_type: 'exhibition', item_id: '123' }],
		[mockInstance, 'search_submitted', { query_length: 8 }],
	]);
});

it('네이티브 모듈이 없거나 설정이 잘못돼도 reject하지 않고 다음 이벤트에서 복구한다', async () => {
	const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
	mockGetAnalytics.mockImplementationOnce(() => {
		throw new Error('native module missing');
	});
	const { trackLogin } = analytics;
	try {
		expect(await trackLogin('apple')).toBe(false);
		expect(await trackLogin('apple')).toBe(true);
		expect(mockGetAnalytics).toHaveBeenCalledTimes(2);
	} finally {
		warn.mockRestore();
	}
});

it('활성화 실패 → 재초기화 → 전송 실패 → 다음 이벤트 복구의 통합 실패에서 핵심 흐름을 막지 않는다', async () => {
	const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
	mockSetCollection.mockRejectedValueOnce(new Error('enable failed'));
	mockLogEvent.mockRejectedValueOnce(new Error('offline'));
	const { trackSearchSubmitted } = analytics;
	try {
		expect(await trackSearchSubmitted(2)).toBe(false);
		expect(await trackSearchSubmitted(2)).toBe(false);
		expect(await trackSearchSubmitted(3)).toBe(true);
		expect(mockSetCollection).toHaveBeenCalledTimes(2);
		expect(mockLogEvent).toHaveBeenCalledTimes(2);
	} finally {
		warn.mockRestore();
	}
});
