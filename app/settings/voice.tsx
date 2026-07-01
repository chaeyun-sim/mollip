import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';
import { Screen } from '../../src/components/layout/Screen';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import type { Voice } from '../../src/hooks/useTTS';
import { useSettingsStore } from '../../src/store/settingsStore';
import { fetchTTSBlob, fetchVoices } from '../../src/utils/api';

/* ─── 스켈레톤 ─── */

function SkeletonItem() {
	const opacity = useSharedValue(1);

	useEffect(() => {
		opacity.value = withRepeat(
			withTiming(0.35, { duration: 750, easing: Easing.inOut(Easing.ease) }),
			-1,
			true,
		);
	}, []);

	const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

	return (
		<Animated.View
			style={[
				animStyle,
				{
					flexDirection: 'row',
					alignItems: 'center',
					borderRadius: 12,
					paddingHorizontal: 16,
					height: 56,
					backgroundColor: '#1C1917',
					gap: 12,
					borderWidth: StyleSheet.hairlineWidth,
					borderColor: 'rgba(255,255,255,0.06)',
				},
			]}
		>
			<View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#292524' }} />
			<View style={{ flex: 1, height: 13, borderRadius: 6, backgroundColor: '#292524' }} />
			<View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#1C1917' }} />
		</Animated.View>
	);
}

/* ─── 메인 ─── */

export default function VoiceScreen() {
	const router = useRouter();
	const { voiceId, voiceSpeed, setVoiceId } = useSettingsStore();

	const [voices, setVoices] = useState<Voice[]>([]);
	const [voicesLoading, setVoicesLoading] = useState(true);
	const [previewingId, setPreviewingId] = useState<string | null>(null);
	const previewPlayer = useAudioPlayer(null);

	useEffect(() => {
		fetchVoices()
			.then(setVoices)
			.catch(console.error)
			.finally(() => setVoicesLoading(false));
	}, []);

	const handlePreview = async (voice: Voice) => {
		if (previewingId) return;
		setPreviewingId(voice.voice_id);
		try {
			const uri = await fetchTTSBlob(
				voice.voice_id,
				'안녕하세요! 이 목소리로 해설을 들려드릴게요.',
				voiceSpeed,
			);
			previewPlayer.replace(uri);
			previewPlayer.play();
		} catch {
			/* silent */
		} finally {
			setPreviewingId(null);
		}
	};

	return (
		<Screen>
			<ScreenHeader>
				<ScreenHeader.Left>
					<ScreenHeader.Back onPress={() => router.back()} />
				</ScreenHeader.Left>
				<ScreenHeader.Center>
					<Text
						className='text-[16px] text-white'
						style={{ fontFamily: 'Pretendard-SemiBold' }}
					>
						음성 선택
					</Text>
				</ScreenHeader.Center>
				<ScreenHeader.Right />
			</ScreenHeader>

			<ScrollView
				className='flex-1'
				contentContainerStyle={{ paddingTop: 20, paddingBottom: 48 }}
				showsVerticalScrollIndicator={false}
			>
				{voicesLoading ? (
					<View className='gap-2'>
						{[0, 1, 2, 3].map((i) => (
							<SkeletonItem key={i} />
						))}
					</View>
				) : voices.length === 0 ? (
					<Text style={{ fontFamily: 'Pretendard-Regular', color: '#78716C', fontSize: 13 }}>
						불러올 수 있는 음성이 없어요
					</Text>
				) : (
					<View className='gap-2'>
						{voices.map((voice, i) => {
							const selected = voiceId === voice.voice_id;
							return (
								<Pressable
									key={voice.voice_id}
									className='flex-row items-center justify-between rounded-xl px-4'
									style={({ pressed }) => ({
										minHeight: 56,
										backgroundColor: selected ? '#172148' : '#1C1917',
										borderWidth: StyleSheet.hairlineWidth,
										borderColor: selected
											? 'rgba(59,130,246,0.4)'
											: 'rgba(255,255,255,0.06)',
										transform: [{ scale: pressed ? 0.98 : 1 }],
									})}
									accessibilityRole='radio'
									accessibilityState={{ checked: selected }}
									accessibilityLabel={voice.name.split(' - ')[0]}
									onPress={() => {
										Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
										setVoiceId(voice.voice_id);
									}}
								>
									<View className='flex-row items-center gap-3 flex-1'>
										<View
											className='w-8 h-8 rounded-full items-center justify-center'
											style={{ backgroundColor: selected ? '#3B82F6' : '#292524' }}
										>
											{selected ? (
												<Ionicons name='checkmark' size={14} color='#fff' />
											) : (
												<Text
													style={{
														fontFamily: 'Pretendard-Bold',
														color: '#78716C',
														fontSize: 12,
													}}
												>
													{i + 1}
												</Text>
											)}
										</View>
										<Text
											style={{
												fontFamily: selected ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
												color: selected ? '#fff' : '#A8A29E',
												fontSize: 14,
											}}
										>
											{voice.name.split(' - ')[0]}
										</Text>
									</View>
									<Pressable
										className='items-center justify-center'
										style={{ width: 32, height: 32 }}
										hitSlop={8}
										accessibilityLabel={`${voice.name.split(' - ')[0]} 미리 듣기`}
										accessibilityRole='button'
										onPress={() => {
											Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
											handlePreview(voice);
										}}
										disabled={!!previewingId}
									>
										{previewingId === voice.voice_id ? (
											<ActivityIndicator size='small' color='#60A5FA' />
										) : (
											<Ionicons name='play-circle-outline' size={24} color='#60A5FA' />
										)}
									</Pressable>
								</Pressable>
							);
						})}
					</View>
				)}
			</ScrollView>
		</Screen>
	);
}
