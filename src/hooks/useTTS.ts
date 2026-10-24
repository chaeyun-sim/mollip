import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { fetchTTSBlob, fetchVoices } from '../utils/api';
import { getOfflineAudioUri, saveOfflineAudioFromDataUri } from '../utils/offlineAudio';
import { resolveTtsAudioUri } from '../utils/resolveTtsAudioUri';
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
			const uri = await resolveTtsAudioUri({
				cacheKey,
				memoryCache: audioCache.current,
				getDiskUri: getOfflineAudioUri,
				fetchFromNetwork: () => fetchTTSBlob(voiceId, cleaned, voiceSpeed),
				saveToDisk: saveOfflineAudioFromDataUri,
			});

			setIsLoading(false);
			player.replace(uri);
			player.play();
		} catch (err) {
			console.error(err);
			setIsLoading(false);
			throw err;
		}
	};

	const pause = () => player.pause();
	const resume = () => player.play();
	const stop = () => {
		player.pause();
		player.seekTo(0);
	};
	const seekTo = (sec: number) => player.seekTo(sec);

	return {
		isSpeaking,
		isPaused,
		isLoading,
		elapsed,
		duration,
		voices,
		speak,
		pause,
		resume,
		stop,
		seekTo,
	};
}
