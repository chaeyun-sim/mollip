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
	labels?: Record<string, string>;
};

export function useTTS() {
	const [isLoading, setIsLoading] = useState(false);
	const [voices, setVoices] = useState<Voice[]>([]);
	const { voiceId, voiceSpeed } = useSettingsStore();

	const audioCache = useRef<Map<string, string>>(new Map());
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
			const cacheKey = `${voiceId}::${voiceSpeed}::${cleaned}`;
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
		const cleaned = cleanTextForTTS(text);
		const cacheKey = `${voiceId}::${voiceSpeed}::${cleaned}`;
		try {
			let uri = audioCache.current.get(cacheKey);
			if (!uri) {
				uri = await fetchTTSBlob(voiceId, cleaned, voiceSpeed);
				audioCache.current.set(cacheKey, uri);
			}
			player.replace(uri);
		} catch {
			/* silent fail */
		}
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
		pause,
		resume,
		stop,
		seekTo,
	};
}
