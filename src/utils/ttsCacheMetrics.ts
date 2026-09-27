export type TtsCacheEvent = 'memory_hit' | 'disk_hit' | 'cache_miss' | 'disk_write_failure';

export interface TtsCacheCounts {
	memory_hit: number;
	disk_hit: number;
	cache_miss: number;
	disk_write_failure: number;
}

export interface TtsCacheSummary {
	playbacks: number;
	cacheHits: number;
	hitRate: number;
	apiRate: number;
}

const emptyCounts = (): TtsCacheCounts => ({
	memory_hit: 0,
	disk_hit: 0,
	cache_miss: 0,
	disk_write_failure: 0,
});

let counts: TtsCacheCounts = emptyCounts();

export const recordTtsCacheEvent = (event: TtsCacheEvent): void => {
	counts[event] += 1;
};

export const getTtsCacheCounts = (): TtsCacheCounts => ({ ...counts });

export const resetTtsCacheCounts = (): void => {
	counts = emptyCounts();
};

export const restoreTtsCacheCounts = (next: TtsCacheCounts): void => {
	counts = { ...next };
};

/** 재생 요청 수는 miss/hit만 센다. disk_write_failure는 같은 miss 재생의 부가 이벤트다. */
export const summarizeTtsCache = (input: TtsCacheCounts = getTtsCacheCounts()): TtsCacheSummary => {
	const playbacks = input.memory_hit + input.disk_hit + input.cache_miss;
	const cacheHits = input.memory_hit + input.disk_hit;
	return {
		playbacks,
		cacheHits,
		hitRate: playbacks === 0 ? 0 : cacheHits / playbacks,
		apiRate: playbacks === 0 ? 0 : input.cache_miss / playbacks,
	};
};
