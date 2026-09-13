import {
	computeCacheKey,
	getBatchProgress,
	getIdleIds,
	hasIdle,
	hasIdleOrFailed,
	isAnyLoading,
	useOfflineDownloadStore,
} from '../offlineDownloadStore';
import { fetchTTSBlob } from '@/src/utils/api';
import {
	deleteAllOfflineAudio,
	deleteOfflineAudio,
	saveOfflineAudioFromDataUri,
} from '@/src/utils/offlineAudio';

jest.mock('@/src/utils/api', () => ({
	fetchTTSBlob: jest.fn(),
}));
jest.mock('@/src/utils/offlineAudio', () => ({
	saveOfflineAudioFromDataUri: jest.fn(),
	deleteOfflineAudio: jest.fn(),
	deleteAllOfflineAudio: jest.fn(),
}));

const mockFetchTTSBlob = fetchTTSBlob as jest.Mock;
const mockSave = saveOfflineAudioFromDataUri as jest.Mock;
const mockDeleteOne = deleteOfflineAudio as jest.Mock;
const mockDeleteAll = deleteAllOfflineAudio as jest.Mock;

beforeEach(() => {
	useOfflineDownloadStore.setState({ statuses: {}, batchIds: [] });
	mockFetchTTSBlob.mockReset();
	mockSave.mockReset();
	mockDeleteOne.mockReset();
	mockDeleteAll.mockReset();
});

describe('getIdleIds / hasIdle / hasIdleOrFailed — 순수 헬퍼', () => {
	it('statuses에 없는 id는 idle로 취급한다', () => {
		expect(getIdleIds(['a', 'b'], {})).toEqual(['a', 'b']);
	});

	it('idle과 failed만 idle-or-failed 목록에 포함된다', () => {
		const statuses = { a: 'idle', b: 'loading', c: 'done', d: 'failed' } as const;
		expect(hasIdleOrFailed(['a', 'b', 'c', 'd'], statuses)).toBe(true);
		expect(hasIdleOrFailed(['b', 'c'], statuses)).toBe(false);
	});

	it('idle 항목이 하나도 없으면(실패만 존재해도) hasIdle은 false다 — Alex iteration 4 지적사항', () => {
		const statuses = { a: 'failed', b: 'done' } as const;
		expect(hasIdle(['a', 'b'], statuses)).toBe(false);
		// 이 경우에도 Row A 자체는 여전히 노출되어야 한다(failed가 있으므로) — 버튼만 비활성화.
		expect(hasIdleOrFailed(['a', 'b'], statuses)).toBe(true);
	});

	it('idle 항목이 있으면 hasIdle은 true다', () => {
		expect(hasIdle(['a'], { a: 'idle' })).toBe(true);
	});
});

describe('getBatchProgress — N/M 진행률', () => {
	it('done 개수와 배치 전체 개수를 반환한다', () => {
		const statuses = { a: 'done', b: 'loading', c: 'failed' } as const;
		expect(getBatchProgress(['a', 'b', 'c'], statuses)).toEqual({ done: 1, total: 3 });
	});
});

describe('isAnyLoading', () => {
	it('하나라도 loading이면 true', () => {
		expect(isAnyLoading(['a', 'b'], { a: 'done', b: 'loading' })).toBe(true);
	});

	it('loading이 없으면 false', () => {
		expect(isAnyLoading(['a', 'b'], { a: 'done', b: 'failed' })).toBe(false);
	});
});

describe('startDownload — idle 항목만 대상으로 다운로드 시작(AC-1)', () => {
	it('idle 상태인 대상만 필터링해 다운로드하고, done으로 상태를 갱신한다', async () => {
		mockFetchTTSBlob.mockResolvedValue('data:audio/mpeg;base64,AAAA');
		useOfflineDownloadStore.setState({ statuses: { existing: 'done' }, batchIds: [] });

		await useOfflineDownloadStore.getState().startDownload(
			[
				{ id: 'existing', text: '이미 완료됨' },
				{ id: 'new-1', text: '새 항목' },
			],
			'voice-1',
			1.0,
		);

		const { statuses, batchIds } = useOfflineDownloadStore.getState();
		expect(statuses['new-1']).toBe('done');
		expect(statuses.existing).toBe('done'); // 기존 완료 항목은 재다운로드되지 않는다
		expect(batchIds).toEqual(['new-1']); // 배치에는 실제로 처리한 idle 항목만 포함
		expect(mockFetchTTSBlob).toHaveBeenCalledTimes(1);
		expect(mockSave).toHaveBeenCalledTimes(1);
	});

	it('failed 항목은 대상에서 제외한다 — 개별 재시도로만 처리(States, iteration 4 확정)', async () => {
		mockFetchTTSBlob.mockResolvedValue('data:audio/mpeg;base64,AAAA');
		useOfflineDownloadStore.setState({ statuses: { failedItem: 'failed' }, batchIds: [] });

		await useOfflineDownloadStore
			.getState()
			.startDownload([{ id: 'failedItem', text: '실패했던 항목' }], 'voice-1', 1.0);

		expect(mockFetchTTSBlob).not.toHaveBeenCalled();
		expect(useOfflineDownloadStore.getState().statuses.failedItem).toBe('failed');
	});

	it('idle 항목이 없으면 아무 것도 호출하지 않는다', async () => {
		await useOfflineDownloadStore.getState().startDownload([], 'voice-1', 1.0);

		expect(mockFetchTTSBlob).not.toHaveBeenCalled();
	});

	it('다운로드 실패 시 해당 항목만 failed로 표시하고 다른 항목은 계속 진행한다(AC-4 방향성)', async () => {
		mockFetchTTSBlob.mockImplementation((_voiceId: string, text: string) => {
			if (text === '실패할 항목') return Promise.reject(new Error('network error'));
			return Promise.resolve('data:audio/mpeg;base64,AAAA');
		});

		await useOfflineDownloadStore.getState().startDownload(
			[
				{ id: 'ok-1', text: '성공할 항목' },
				{ id: 'fail-1', text: '실패할 항목' },
			],
			'voice-1',
			1.0,
		);

		const { statuses } = useOfflineDownloadStore.getState();
		expect(statuses['ok-1']).toBe('done');
		expect(statuses['fail-1']).toBe('failed');
	});
});

describe('retryDownload — 실패 항목 1개만 재시도(AC-4)', () => {
	it('실패 항목을 재다운로드해 done으로 바꾼다', async () => {
		mockFetchTTSBlob.mockResolvedValue('data:audio/mpeg;base64,AAAA');
		useOfflineDownloadStore.setState({ statuses: { 'fail-1': 'failed' }, batchIds: [] });

		await useOfflineDownloadStore
			.getState()
			.retryDownload('fail-1', '실패했던 텍스트', 'voice-1', 1.0);

		expect(useOfflineDownloadStore.getState().statuses['fail-1']).toBe('done');
		expect(mockFetchTTSBlob).toHaveBeenCalledTimes(1);
		expect(mockSave).toHaveBeenCalledTimes(1);
	});

	it('다른 항목의 상태·배치 진행에는 영향을 주지 않는다', async () => {
		mockFetchTTSBlob.mockResolvedValue('data:audio/mpeg;base64,AAAA');
		useOfflineDownloadStore.setState({
			statuses: { 'fail-1': 'failed', 'other-loading': 'loading', 'other-done': 'done' },
			batchIds: ['other-loading'],
		});

		await useOfflineDownloadStore
			.getState()
			.retryDownload('fail-1', '실패했던 텍스트', 'voice-1', 1.0);

		const { statuses, batchIds } = useOfflineDownloadStore.getState();
		expect(statuses['other-loading']).toBe('loading');
		expect(statuses['other-done']).toBe('done');
		expect(batchIds).toEqual(['other-loading']); // 진행 중이던 배치 그대로 유지
	});

	it('재시도가 다시 실패하면 failed 상태를 유지한다', async () => {
		mockFetchTTSBlob.mockRejectedValue(new Error('network error'));
		useOfflineDownloadStore.setState({ statuses: { 'fail-1': 'failed' }, batchIds: [] });

		await useOfflineDownloadStore
			.getState()
			.retryDownload('fail-1', '실패했던 텍스트', 'voice-1', 1.0);

		expect(useOfflineDownloadStore.getState().statuses['fail-1']).toBe('failed');
	});
});

describe('computeCacheKey — 다운로드/재생/삭제가 공유하는 캐시 키 생성(AC-2/AC-6)', () => {
	it('voiceId/voiceSpeed/text가 모두 같으면 같은 키를 반환한다', () => {
		expect(computeCacheKey('안녕하세요', 'voice-1', 1.0)).toBe(
			computeCacheKey('안녕하세요', 'voice-1', 1.0),
		);
	});

	it('text가 다르면 다른 키를 반환한다', () => {
		expect(computeCacheKey('안녕', 'voice-1', 1.0)).not.toBe(
			computeCacheKey('반가워', 'voice-1', 1.0),
		);
	});
});

describe('deleteDownload — 개별 항목 삭제 후 idle로 복귀(AC-6)', () => {
	it('파일을 삭제하고 해당 id의 상태만 idle로 되돌린다', () => {
		useOfflineDownloadStore.setState({
			statuses: { 'done-1': 'done', 'other-done': 'done' },
			batchIds: [],
		});

		useOfflineDownloadStore.getState().deleteDownload('done-1', 'cache-key-done-1');

		expect(mockDeleteOne).toHaveBeenCalledWith('cache-key-done-1');
		const { statuses } = useOfflineDownloadStore.getState();
		expect(statuses['done-1']).toBe('idle');
		expect(statuses['other-done']).toBe('done'); // 다른 항목은 영향받지 않는다
	});
});

describe('deleteAllDownloads — 전체 삭제 후 대상 id 전부 idle로 복귀(AC-5)', () => {
	it('전체 삭제 함수를 호출하고 지정된 id들을 모두 idle로 되돌린다', () => {
		useOfflineDownloadStore.setState({
			statuses: { 'done-1': 'done', 'done-2': 'done', unrelated: 'loading' },
			batchIds: ['unrelated'],
		});

		useOfflineDownloadStore.getState().deleteAllDownloads(['done-1', 'done-2']);

		expect(mockDeleteAll).toHaveBeenCalledTimes(1);
		const { statuses, batchIds } = useOfflineDownloadStore.getState();
		expect(statuses['done-1']).toBe('idle');
		expect(statuses['done-2']).toBe('idle');
		expect(statuses.unrelated).toBe('loading'); // 대상에 없는 id는 영향받지 않는다
		expect(batchIds).toEqual(['unrelated']); // 진행 중이던 배치는 그대로 유지
	});
});
