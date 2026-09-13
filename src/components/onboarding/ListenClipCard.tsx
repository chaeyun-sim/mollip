import { Ionicons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { OnboardingListenClip } from '@/src/data/onboardingListenClips';
import { colors } from '@/src/constants/colors';
import { Screen } from '@/src/components/layout/Screen';

interface ListenClipCardProps {
	clip: OnboardingListenClip;
	onKeep: () => void;
	onPass: () => void;
}

export function ListenClipCard({ clip, onKeep, onPass }: ListenClipCardProps) {
	const player = useAudioPlayer(clip.source);
	const playerRef = useRef(player);
	const status = useAudioPlayerStatus(player);
	const [muted, setMuted] = useState(false);
	const [loadError, setLoadError] = useState(false);

	useEffect(() => {
		playerRef.current = player;
	}, [player]);

	useEffect(() => {
		setAudioModeAsync({
			playsInSilentMode: true,
			shouldPlayInBackground: false,
		}).catch(() => {});
	}, []);

	useEffect(() => {
		try {
			player.replace(clip.source);
			player.seekTo(0);
			setLoadError(false);
		} catch {
			setLoadError(true);
		}
	}, [clip.id, clip.source, player]);

	const handleTogglePlay = useCallback(() => {
		try {
			if (status.playing) {
				player.pause();
				return;
			}
			player.play();
		} catch {
			setLoadError(true);
		}
	}, [player, status.playing]);

	const handleMute = useCallback(() => {
		const next = !muted;
		setMuted(next);
		playerRef.current.volume = next ? 0 : 1;
	}, [muted]);

	return (
		<>
			<View className="flex-1 justify-center">
				<View className="rounded-3xl bg-white border border-gray300 px-6 py-7 gap-5">
					<View className="flex-row items-center justify-between">
						<View className="bg-gray200 rounded-full px-2.5 py-1">
							<Text className="text-[11px] text-gray700 font-pretendard-semibold">
								{clip.genre}
							</Text>
						</View>
						<Pressable
							onPress={handleMute}
							hitSlop={12}
							accessibilityRole="button"
							accessibilityLabel={muted ? '소리 켜기' : '소리 끄기'}
							accessibilityState={{ selected: muted }}
							className="min-w-[44px] min-h-[44px] items-center justify-center"
						>
							<Ionicons
								name={muted ? 'volume-mute-outline' : 'volume-high-outline'}
								size={22}
								color={colors.gray700}
							/>
						</Pressable>
					</View>
					<Text className="text-[26px] leading-[34px] text-gray900 font-hahmlet-bold">
						{clip.title}
					</Text>
					<Text className="text-[15px] leading-[24px] text-gray700 font-pretendard-regular">
						{clip.caption}
					</Text>
					{loadError && (
						<Text className="text-[13px] text-gray700 font-pretendard-regular">
							소리를 불러오지 못했어요. 글만 읽고 넘어가도 괜찮아요
						</Text>
					)}
					<View className="items-center pt-1">
						<Pressable
							onPress={handleTogglePlay}
							accessibilityRole="button"
							accessibilityLabel={status.playing ? '일시정지' : '재생'}
							accessibilityState={{ selected: status.playing }}
							className="w-16 h-16 rounded-full bg-primary-dark items-center justify-center"
							style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
						>
							<Ionicons name={status.playing ? 'pause' : 'play'} size={26} color={colors.white} />
						</Pressable>
					</View>
				</View>
			</View>
			<Screen.Bottom className="pb-10">
				<View className="flex-row justify-center items-center gap-8">
					<Pressable
						onPress={onPass}
						accessibilityRole="button"
						accessibilityLabel="넘기기"
						className="items-center gap-1.5"
					>
						<View
							className="w-16 h-16 rounded-full bg-white items-center justify-center"
							style={{
								shadowColor: '#000',
								shadowOffset: { width: 0, height: 4 },
								shadowOpacity: 0.08,
								shadowRadius: 12,
								elevation: 4,
							}}
						>
							<Ionicons name="close" size={28} color={colors.gray900} />
						</View>
						<Text className="text-gray600 text-xs font-pretendard-regular">넘기기</Text>
					</Pressable>
					<Pressable
						onPress={onKeep}
						accessibilityRole="button"
						accessibilityLabel="담기"
						className="items-center gap-1.5"
					>
						<View
							className="w-16 h-16 rounded-full bg-white items-center justify-center"
							style={{
								shadowColor: '#000',
								shadowOffset: { width: 0, height: 4 },
								shadowOpacity: 0.08,
								shadowRadius: 12,
								elevation: 4,
							}}
						>
							<Ionicons name="bookmark" size={26} color={colors.gray900} />
						</View>
						<Text className="text-gray600 text-xs font-pretendard-regular">담기</Text>
					</Pressable>
				</View>
			</Screen.Bottom>
		</>
	);
}
