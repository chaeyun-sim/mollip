import AsyncStorage from '@react-native-async-storage/async-storage';

import { fetchTTSBlob } from './api';
import { getOfflineAudioUri, saveOfflineAudioFromDataUri } from './offlineAudio';
import { resolveTtsAudioUri } from './resolveTtsAudioUri';
import { getAccessTokenForApi } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import {
	getTtsCacheCounts,
	resetTtsCacheCounts,
	restoreTtsCacheCounts,
	summarizeTtsCache,
	type TtsCacheCounts,
} from './ttsCacheMetrics';

export const TTS_CACHE_PROBE_RESULT_KEY = 'tts-cache-probe-result';
export const TTS_CACHE_PROBE_RUN_KEY = 'tts-cache-run-probe';

interface ProbeState {
	startedAt: string;
	voiceId: string;
	voiceSpeed: number;
	texts: string[];
	phase1Counts?: TtsCacheCounts;
	phase?: 1 | 2;
	counts?: TtsCacheCounts;
	summary?: ReturnType<typeof summarizeTtsCache>;
	ok?: boolean;
	error?: string;
}

const playText = async (
	memoryCache: Map<string, string>,
	voiceId: string,
	voiceSpeed: number,
	text: string,
) => {
	const cacheKey = `${voiceId}\x00${voiceSpeed}\x00${text}`;
	return resolveTtsAudioUri({
		cacheKey,
		memoryCache,
		getDiskUri: getOfflineAudioUri,
		fetchFromNetwork: () => fetchTTSBlob(voiceId, text, voiceSpeed),
		saveToDisk: saveOfflineAudioFromDataUri,
	});
};

const writeResult = async (state: ProbeState) => {
	await AsyncStorage.setItem(TTS_CACHE_PROBE_RESULT_KEY, JSON.stringify(state));
};

export async function runTtsCacheProbe(): Promise<void> {
	const flag = await AsyncStorage.getItem(TTS_CACHE_PROBE_RUN_KEY);
	if (flag === '2') {
		await runPhase2();
		return;
	}
	await runPhase1();
}

async function runPhase1(): Promise<void> {
	const startedAt = new Date().toISOString();
	if (!getAccessTokenForApi()) {
		await writeResult({ startedAt, voiceId: '', voiceSpeed: 0, texts: [], error: 'no-session' });
		await AsyncStorage.removeItem(TTS_CACHE_PROBE_RUN_KEY);
		return;
	}

	const { voiceId, voiceSpeed } = useSettingsStore.getState();
	const runId = Date.now();
	const texts = Array.from({ length: 10 }, (_, i) => `TTS 시나리오 해설 ${runId} ${i + 1}번`);
	resetTtsCacheCounts();

	try {
		const sessionCache = new Map<string, string>();
		for (const text of texts) {
			await playText(sessionCache, voiceId, voiceSpeed, text);
		}
		for (const text of texts.slice(0, 5)) {
			await playText(sessionCache, voiceId, voiceSpeed, text);
		}

		const phase1Counts = getTtsCacheCounts();
		await writeResult({
			startedAt,
			voiceId,
			voiceSpeed,
			texts,
			phase: 1,
			phase1Counts,
			counts: phase1Counts,
			summary: summarizeTtsCache(phase1Counts),
		});
		await AsyncStorage.setItem(TTS_CACHE_PROBE_RUN_KEY, '2');
	} catch (error) {
		await writeResult({
			startedAt,
			voiceId,
			voiceSpeed,
			texts,
			error: error instanceof Error ? error.message : String(error),
		});
		await AsyncStorage.removeItem(TTS_CACHE_PROBE_RUN_KEY);
	}
}

async function runPhase2(): Promise<void> {
	const raw = await AsyncStorage.getItem(TTS_CACHE_PROBE_RESULT_KEY);
	if (!raw) {
		await writeResult({
			startedAt: new Date().toISOString(),
			voiceId: '',
			voiceSpeed: 0,
			texts: [],
			error: 'missing-phase1',
		});
		await AsyncStorage.removeItem(TTS_CACHE_PROBE_RUN_KEY);
		return;
	}

	const prev = JSON.parse(raw) as ProbeState;
	if (!prev.phase1Counts || prev.texts.length < 3) {
		await writeResult({ ...prev, error: 'invalid-phase1' });
		await AsyncStorage.removeItem(TTS_CACHE_PROBE_RUN_KEY);
		return;
	}

	if (!getAccessTokenForApi()) {
		await writeResult({ ...prev, error: 'no-session' });
		await AsyncStorage.removeItem(TTS_CACHE_PROBE_RUN_KEY);
		return;
	}

	restoreTtsCacheCounts(prev.phase1Counts);
	try {
		const restartCache = new Map<string, string>();
		for (const text of prev.texts.slice(0, 3)) {
			await playText(restartCache, prev.voiceId, prev.voiceSpeed, text);
		}
		const counts = getTtsCacheCounts();
		await writeResult({
			...prev,
			phase: 2,
			counts,
			summary: summarizeTtsCache(counts),
			ok: true,
		});
	} catch (error) {
		await writeResult({
			...prev,
			error: error instanceof Error ? error.message : String(error),
		});
	} finally {
		await AsyncStorage.removeItem(TTS_CACHE_PROBE_RUN_KEY);
	}
}
