import { act } from 'react';
import { createRoot } from 'test-renderer';
import { store, updateStore } from '../../store';
import { streamDescription } from '../../utils/api';
import { useDescriptionStream } from '../useDescriptionStream';

jest.mock('../../utils/api', () => ({
	streamDescription: jest.fn(),
	streamDescriptionFromImage: jest.fn(),
}));
jest.mock('../../store/settingsStore', () => ({
	useSettingsStore: (select: (s: unknown) => unknown) =>
		select({ descriptionFocus: [], descriptionLength: 1 }),
}));
jest.mock('../../store/immersiveStore', () => ({
	useImmersiveStore: (select: (s: unknown) => unknown) =>
		select({
			isImmersiveMode: false,
			exhibitionId: null,
			exhibitionTitle: null,
			addToPlaylist: jest.fn(),
		}),
}));
jest.mock('../../store/visitStore', () => ({
	todayKey: () => '2026-10-03',
	useVisitStore: (select: (s: unknown) => unknown) => select({ recordListened: jest.fn() }),
}));

const mockStream = streamDescription as jest.Mock;

const PARTIAL = '작품의 첫 문장입니다. ';
const FULL = `${PARTIAL}두 번째 문장입니다.`;

async function* partialThenFail() {
	yield PARTIAL;
	throw new Error('stream idle timeout');
}

async function* complete() {
	yield FULL;
}

type HookResult = ReturnType<typeof useDescriptionStream>;

const renderHookUnderTest = () => {
	const hookRef: { current: HookResult | null } = { current: null };
	const Harness = () => {
		hookRef.current = useDescriptionStream();
		return null;
	};
	const root = createRoot();
	act(() => {
		root.render(<Harness />);
	});
	return { hookRef, unmount: () => act(() => root.unmount()) };
};

// 타이프라이터 타이머와 pending microtask를 함께 흘려보낸다.
const flush = async () => {
	for (let i = 0; i < 20; i += 1) {
		await act(async () => {
			jest.advanceTimersByTime(100);
			await Promise.resolve();
			await Promise.resolve();
		});
	}
};

beforeEach(() => {
	jest.useFakeTimers();
	mockStream.mockReset();
	updateStore({
		inputMode: 'manual',
		manualTitle: '별이 빛나는 밤',
		manualArtist: '고흐',
		artworkDescription: '',
		artworkImageUrl: '',
	});
});

afterEach(() => {
	jest.useRealTimers();
	updateStore({ artworkDescription: '', manualTitle: '', manualArtist: '' });
});

describe('useDescriptionStream — 생성이 중간에 끊겼을 때', () => {
	it('에러 상태가 되고 받은 본문은 화면·TTS·기록 어디에도 남기지 않는다', async () => {
		mockStream.mockImplementationOnce(partialThenFail);
		const { hookRef, unmount } = renderHookUnderTest();

		await flush();

		expect(hookRef.current?.hasError).toBe(true);
		expect(hookRef.current?.isTyping).toBe(false);
		expect(hookRef.current?.displayed).toBe('');
		expect(hookRef.current?.fullTextRef.current).toBe('');
		expect(store.artworkDescription).toBe('');
		unmount();
	});

	it('재시도를 누르면 해설을 처음부터 다시 요청한다', async () => {
		mockStream.mockImplementationOnce(partialThenFail).mockImplementationOnce(complete);
		const { hookRef, unmount } = renderHookUnderTest();
		await flush();

		act(() => {
			hookRef.current?.handleRetry();
		});
		await flush();

		expect(mockStream).toHaveBeenCalledTimes(2);
		expect(hookRef.current?.hasError).toBe(false);
		expect(hookRef.current?.fullTextRef.current).toBe(FULL);
		unmount();
	});

	it('아무것도 못 받고 끊긴 뒤에도 재시도하면 다시 요청한다', async () => {
		mockStream
			.mockImplementationOnce(async function* () {
				throw new Error('connect timeout');
			})
			.mockImplementationOnce(complete);
		const { hookRef, unmount } = renderHookUnderTest();
		await flush();

		act(() => {
			hookRef.current?.handleRetry();
		});
		await flush();

		expect(mockStream).toHaveBeenCalledTimes(2);
		expect(hookRef.current?.hasError).toBe(false);
		unmount();
	});
});
