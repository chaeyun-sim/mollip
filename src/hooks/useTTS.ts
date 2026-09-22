import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { fetchTTSBlob, fetchVoices } from '../utils/api';
import { getOfflineAudioUri, saveOfflineAudioFromDataUri } from '../utils/offlineAudio';
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
			let uri = audioCache.current.get(cacheKey);

			if (!uri) {
				// 앱 재실행 후에도 자동 저장된 음성을 우선 재생한다.
				uri = getOfflineAudioUri(cacheKey) ?? undefined;
				if (!uri) {
					const dataUri = await fetchTTSBlob(voiceId, cleaned, voiceSpeed);
					// 실제로 재생을 요청한 음성만 파일로 저장해 다음 재생부터 재사용한다.
					try {
						uri = saveOfflineAudioFromDataUri(cacheKey, dataUri);
					} catch (cacheError) {
						// 저장 공간 등의 이유로 캐시하지 못해도 이번 재생은 계속한다.
						console.warn('오디오 캐시 저장에 실패했어요', cacheError);
						uri = dataUri;
					}
				}
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
