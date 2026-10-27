import { act } from 'react';
import { createRoot } from 'test-renderer';
import { AppState, type AppStateStatus } from 'react-native';
import { useAnalyticsScreenTracking } from '../useAnalyticsScreenTracking';

let mockSegments = ['(tabs)', 'index'];
const mockTrackScreenView = jest.fn();
jest.mock('expo-router', () => ({ useSegments: () => mockSegments }));
jest.mock('@/src/lib/analytics', () => ({
	trackScreenView: (name: string) => mockTrackScreenView(name),
}));

beforeEach(() => {
	mockSegments = ['(tabs)', 'index'];
	mockTrackScreenView.mockReset().mockResolvedValue(true);
});

const setup = () => {
	const listeners = new Set<(state: AppStateStatus) => void>();
	const subscribe = jest
		.spyOn(AppState, 'addEventListener')
		.mockImplementation((_event, listener) => {
			listeners.add(listener);
			return {
				remove: () => {
					listeners.delete(listener);
				},
			};
		});
	function Harness({ ready }: { ready: boolean }) {
		useAnalyticsScreenTracking(ready);
		return null;
	}
	const root = createRoot();
	return {
		render: async (ready = true) => {
			await act(async () => {
				root.render(<Harness ready={ready} />);
			});
		},
		foreground: async () => {
			await act(async () => {
				listeners.forEach((listener) => listener('active'));
			});
		},
		unmount: () => {
			act(() => root.unmount());
		},
		cleanup: () => {
			act(() => root.unmount());
			subscribe.mockRestore();
		},
	};
};

it('부트 화면을 제외하고 ID 대신 route template을 기록한다', async () => {
	const harness = setup();
	try {
		await harness.render(false);
		expect(mockTrackScreenView).not.toHaveBeenCalled();
		mockSegments = ['(explore)', '[id]'];
		await harness.render();
		expect(mockTrackScreenView).toHaveBeenLastCalledWith('/(explore)/[id]');
	} finally {
		harness.cleanup();
	}
});

it('같은 화면의 재렌더/foreground는 중복 전송하지 않고 A→B→A 재방문은 기록한다', async () => {
	const harness = setup();
	try {
		await harness.render();
		await harness.render();
		await harness.foreground();
		expect(mockTrackScreenView).toHaveBeenCalledTimes(1);
		mockSegments = ['search'];
		await harness.render();
		mockSegments = ['(tabs)', 'index'];
		await harness.render();
		expect(mockTrackScreenView.mock.calls.map(([name]) => name)).toEqual([
			'/(tabs)/index',
			'/search',
			'/(tabs)/index',
		]);
	} finally {
		harness.cleanup();
	}
});

it('초기화/전송 실패 이후 foreground 복귀로 화면 추적을 복구한다', async () => {
	mockTrackScreenView.mockResolvedValueOnce(false);
	const harness = setup();
	try {
		await harness.render();
		await harness.foreground();
		await harness.foreground();
		expect(mockTrackScreenView).toHaveBeenCalledTimes(2);
	} finally {
		harness.cleanup();
	}
});

it('이전 요청의 늦은 실패 응답이 최신 화면의 성공을 덮어쓰지 않고 unmount로 listener를 해제한다', async () => {
	let finishOld: ((sent: boolean) => void) | undefined;
	mockTrackScreenView.mockImplementationOnce(
		() =>
			new Promise<boolean>((resolve) => {
				finishOld = resolve;
			}),
	);
	const harness = setup();
	try {
		await harness.render();
		mockSegments = ['search'];
		await harness.render();
		await act(async () => {
			finishOld?.(false);
		});
		await harness.foreground();
		expect(mockTrackScreenView).toHaveBeenCalledTimes(2);
		harness.unmount();
		await harness.foreground();
		expect(mockTrackScreenView).toHaveBeenCalledTimes(2);
	} finally {
		harness.cleanup();
	}
});
