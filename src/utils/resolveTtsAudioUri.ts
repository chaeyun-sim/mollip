import { recordTtsCacheEvent } from './ttsCacheMetrics';

interface ResolveTtsAudioUriOptions {
	cacheKey: string;
	memoryCache: Map<string, string>;
	getDiskUri: (cacheKey: string) => string | null;
	fetchFromNetwork: () => Promise<string>;
	saveToDisk: (cacheKey: string, dataUri: string) => string;
}

export async function resolveTtsAudioUri({
	cacheKey,
	memoryCache,
	getDiskUri,
	fetchFromNetwork,
	saveToDisk,
}: ResolveTtsAudioUriOptions): Promise<string> {
	const memoryUri = memoryCache.get(cacheKey);
	if (memoryUri) {
		recordTtsCacheEvent('memory_hit');
		return memoryUri;
	}

	const diskUri = getDiskUri(cacheKey);
	if (diskUri) {
		recordTtsCacheEvent('disk_hit');
		memoryCache.set(cacheKey, diskUri);
		return diskUri;
	}

	recordTtsCacheEvent('cache_miss');
	const dataUri = await fetchFromNetwork();
	try {
		const savedUri = saveToDisk(cacheKey, dataUri);
		memoryCache.set(cacheKey, savedUri);
		return savedUri;
	} catch (cacheError) {
		recordTtsCacheEvent('disk_write_failure');
		console.warn('오디오 캐시 저장에 실패했어요', cacheError);
		memoryCache.set(cacheKey, dataUri);
		return dataUri;
	}
}
