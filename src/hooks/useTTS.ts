import {
	setAudioModeAsync,
	useAudioPlayer,
	useAudioPlayerStatus,
} from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { fetchTTSBlob, fetchVoices } from '../utils/api';
import { cleanTextForTTS } from '../utils/text';

export type Voice = {
	voice_id: string;
	name: string;
	preview_url: string;
	description?: string;
	labels?: Record<string, string>;
};

export function useTTS() {
	const [isLoading, setIsLoading] = useState(false);
	const [voices, setVoices] = useState<Voice[]>([]);
	const { voiceId, voiceSpeed } = useSettingsStore();

	const audioCache = useRef<Map<string, string>>(new Map());
	const preloadAbortRef = useRef<AbortController | null>(null);
	const player = useAudioPlayer(null);
	const status = useAudioPlayerStatus(player);

	const isSpeaking = status.playing;
	const isPaused = !status.playing && status.currentTime > 0 && !status.didJustFinish;
	const elapsed = status.currentTime;
	const duration = status.duration ?? 0;

	useEffect(() => {
		setAudioModeAsync({
			playsInSilentMode: true,
			shouldPlayInBackground: true,
		});
		fetchVoices().then(setVoices).catch(console.error);
	}, []);

	useEffect(() => {
		if (status.didJustFinish) {
			player.seekTo(0);
		}
	}, [status.didJustFinish, player]);

	const speak = async (text: string) => {
		player.pause();
		player.seekTo(0);
		setIsLoading(true);

		try {
			const cleaned = cleanTextForTTS(text);
			const cacheKey = `${voiceId}\x00${voiceSpeed}\x00${cleaned}`;
			let uri = audioCache.current.get(cacheKey);

			if (!uri) {
				uri = await fetchTTSBlob(voiceId, cleaned, voiceSpeed);
				audioCache.current.set(cacheKey, uri);
			}

			setIsLoading(false);
			player.replace(uri);
			player.play();
		} catch (err) {
			console.error(err);
			setIsLoading(false);
			throw err;
		}
	};

	const preload = async (text: string) => {
		// 이전 프리로드 취소 후 새 컨트롤러 등록
		preloadAbortRef.current?.abort();
		const ac = new AbortController();
		preloadAbortRef.current = ac;

		const cleaned = cleanTextForTTS(text);
		const cacheKey = `${voiceId}\x00${voiceSpeed}\x00${cleaned}`;
		try {
			if (!audioCache.current.has(cacheKey)) {
				const uri = await fetchTTSBlob(voiceId, cleaned, voiceSpeed);
				// 이탈 후 응답이 돌아온 경우 캐시하지 않음
				if (!ac.signal.aborted) {
					audioCache.current.set(cacheKey, uri);
				}
			}
		} catch {
			/* silent fail */
		}
	};

	const cancelPreload = () => {
		preloadAbortRef.current?.abort();
		preloadAbortRef.current = null;
	};

	const pause = () => player.pause();
	const resume = () => player.play();
	const stop = () => { player.pause(); player.seekTo(0); };
	const seekTo = (sec: number) => player.seekTo(sec);

	return {
		isSpeaking,
		isPaused,
		isLoading,
		elapsed,
		duration,
		voices,
		speak,
		preload,
		cancelPreload,
		pause,
		resume,
		stop,
		seekTo,
	};
}
