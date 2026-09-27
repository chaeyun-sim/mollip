import { resolveTtsAudioUri } from '../resolveTtsAudioUri';
import { getTtsCacheCounts, resetTtsCacheCounts, summarizeTtsCache } from '../ttsCacheMetrics';

beforeEach(() => {
	resetTtsCacheCounts();
	jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('summarizeTtsCache', () => {
	it('테스트 시나리오 예시처럼 적중률·API 비율을 계산한다', () => {
		const summary = summarizeTtsCache({
			memory_hit: 73,
			disk_hit: 48,
			cache_miss: 79,
			disk_write_failure: 0,
		});

		expect(summary.playbacks).toBe(200);
		expect(summary.cacheHits).toBe(121);
		expect(summary.hitRate).toBeCloseTo(0.605);
		expect(summary.apiRate).toBeCloseTo(0.395);
	});

	it('재생이 없으면 0이다', () => {
		expect(summarizeTtsCache()).toEqual({
			playbacks: 0,
			cacheHits: 0,
			hitRate: 0,
			apiRate: 0,
		});
	});
});

describe('resolveTtsAudioUri', () => {
	const fetchFromNetwork = jest.fn();
	const saveToDisk = jest.fn();
	const getDiskUri = jest.fn();

	beforeEach(() => {
		fetchFromNetwork.mockReset();
		saveToDisk.mockReset();
		getDiskUri.mockReset();
	});

	it('메모리 히트는 API를 호출하지 않는다', async () => {
		const memoryCache = new Map([['key', 'memory://a']]);

		const uri = await resolveTtsAudioUri({
			cacheKey: 'key',
			memoryCache,
			getDiskUri,
			fetchFromNetwork,
			saveToDisk,
		});

		expect(uri).toBe('memory://a');
		expect(getTtsCacheCounts()).toMatchObject({ memory_hit: 1, disk_hit: 0, cache_miss: 0 });
		expect(fetchFromNetwork).not.toHaveBeenCalled();
	});

	it('디스크 히트는 메모리에 올리고 API를 호출하지 않는다', async () => {
		getDiskUri.mockReturnValue('file://disk.mp3');

		const memoryCache = new Map<string, string>();
		const uri = await resolveTtsAudioUri({
			cacheKey: 'key',
			memoryCache,
			getDiskUri,
			fetchFromNetwork,
			saveToDisk,
		});

		expect(uri).toBe('file://disk.mp3');
		expect(memoryCache.get('key')).toBe('file://disk.mp3');
		expect(getTtsCacheCounts()).toMatchObject({ memory_hit: 0, disk_hit: 1, cache_miss: 0 });
		expect(fetchFromNetwork).not.toHaveBeenCalled();
	});

	it('캐시 미스는 API를 호출하고 디스크에 저장한다', async () => {
		getDiskUri.mockReturnValue(null);
		fetchFromNetwork.mockResolvedValue('data:audio/mpeg;base64,AA');
		saveToDisk.mockReturnValue('file://saved.mp3');

		const memoryCache = new Map<string, string>();
		const uri = await resolveTtsAudioUri({
			cacheKey: 'key',
			memoryCache,
			getDiskUri,
			fetchFromNetwork,
			saveToDisk,
		});

		expect(uri).toBe('file://saved.mp3');
		expect(getTtsCacheCounts()).toMatchObject({
			cache_miss: 1,
			disk_write_failure: 0,
		});
		expect(fetchFromNetwork).toHaveBeenCalledTimes(1);
	});

	it('디스크 저장 실패는 miss와 write_failure를 함께 기록하고 재생은 계속한다', async () => {
		getDiskUri.mockReturnValue(null);
		fetchFromNetwork.mockResolvedValue('data:audio/mpeg;base64,AA');
		saveToDisk.mockImplementation(() => {
			throw new Error('disk full');
		});

		const uri = await resolveTtsAudioUri({
			cacheKey: 'key',
			memoryCache: new Map(),
			getDiskUri,
			fetchFromNetwork,
			saveToDisk,
		});

		expect(uri).toBe('data:audio/mpeg;base64,AA');
		expect(getTtsCacheCounts()).toMatchObject({
			cache_miss: 1,
			disk_write_failure: 1,
		});
	});
});
