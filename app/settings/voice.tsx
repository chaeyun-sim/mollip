import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	View,
} from 'react-native';
import { VoiceListSkeletonItem } from '@/src/components/settings/VoiceListSkeletonItem';
import { Screen } from '@/src/components/layout/Screen';
import type { Voice } from '@/src/hooks/useTTS';
import { useSettingsStore } from '@/src/store/settingsStore';
import { fetchTTSBlob, fetchVoices } from '@/src/utils/api';
import { cn } from '@/src/lib/cn';

const AVATAR_COLORS = [
	'#F3D9C4',
	'#CFE0DF',
	'#E8D9F0',
	'#D9E3F0',
	'#F0DDD9',
	'#DDEAD1',
];

const GENDER_LABEL: Record<string, string> = {
	male: '남성',
	female: '여성',
	neutral: '중성',
};

const AGE_LABEL: Record<string, string> = {
	young: '청년',
	middle_aged: '중년',
	old: '장년',
};

function avatarColor(name: string) {
	const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
	return AVATAR_COLORS[idx];
}

function voiceTags(voice: Voice): string[] {
	const tags: string[] = [];
	const gender = voice.labels?.gender;
	const age = voice.labels?.age;
	if (age && AGE_LABEL[age]) tags.push(AGE_LABEL[age]);
	if (gender && GENDER_LABEL[gender]) tags.push(GENDER_LABEL[gender]);
	if (voice.labels?.descriptive) {
		const d = voice.labels.descriptive;
		tags.push(d.charAt(0).toUpperCase() + d.slice(1));
	}
	return tags;
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
		<Screen variant='warm'>
			<Screen.Header>
				<Screen.Header.Left>
					<Screen.Header.Back color='#1C1917' onPress={() => router.back()} />
				</Screen.Header.Left>
				<Screen.Header.Center>
					<Text className='text-[18px] text-gray-900 font-hahmlet-semibold'>
						음성 선택
					</Text>
				</Screen.Header.Center>
				<Screen.Header.Right />
			</Screen.Header>

			<ScrollView
				className='flex-1'
				contentContainerStyle={{ paddingTop: 4, paddingBottom: 48 }}
				showsVerticalScrollIndicator={false}
			>
				<Text className='text-gray-400 text-[13px] font-pretendard-regular mb-5 leading-[19px]'>
					해설을 읽어줄 목소리를 골라보세요. 재생 버튼으로 미리 들을 수 있어요.
				</Text>

				{voicesLoading ? (
					<View className='gap-2.5'>
						{[0, 1, 2, 3].map((i) => (
							<VoiceListSkeletonItem key={i} />
						))}
					</View>
				) : voices.length === 0 ? (
					<Text className='text-gray-400 text-[13px] font-pretendard-regular'>
						불러올 수 있는 음성이 없어요
					</Text>
				) : (
					<View className='gap-2.5'>
						{voices.map((voice) => {
							const selected = voiceId === voice.voice_id;
							const displayName = voice.name.split(' - ')[0];
							const tags = voiceTags(voice);
							return (
								<Pressable
									key={voice.voice_id}
									className='rounded-[22px] py-3.5'
									style={({ pressed }) => ({
										backgroundColor: selected ? '#F7F3EE' : '#F2EFE9',
										borderWidth: selected ? 1.5 : 0,
										borderColor: selected ? '#1C1917' : 'transparent',
										transform: [{ scale: pressed ? 0.98 : 1 }],
									})}
									accessibilityRole='radio'
									accessibilityState={{ checked: selected }}
									accessibilityLabel={displayName}
									onPress={() => {
										Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
										setVoiceId(voice.voice_id);
									}}
								>
									<View className='flex-row items-center gap-3'>
										<View className='relative'>
											<View
												className='w-11 h-11 rounded-full items-center justify-center'
												style={{ backgroundColor: avatarColor(displayName) }}
											>
												<Text className='font-pretendard-bold text-[15px] text-[#1C1917]'>
													{displayName.charAt(0)}
												</Text>
											</View>
											{selected && (
												<View
													className='absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#1C1917] items-center justify-center'
													style={{
														shadowColor: '#fff',
														shadowOffset: { width: 0, height: 0 },
														shadowOpacity: 1,
														shadowRadius: 2,
													}}
												>
													<Ionicons name='checkmark' size={10} color='#fff' />
												</View>
											)}
										</View>

										<View className='flex-1'>
											<View className='flex-row items-center gap-1.5'>
												<Text className='text-[15px] font-pretendard-semibold text-[#111827]'>
													{displayName}
												</Text>
											</View>
											{tags.length > 0 && (
												<View className='flex-row flex-wrap gap-1.5 mt-1.5'>
													{tags.map((tag) => (
														<View
															key={tag}
															className='px-2 py-0.5 rounded-full bg-[#1c19170f]'
														>
															<Text
																className={cn(
																	'text-[11px] font-pretendard-medium text-gray-500',
																)}
															>
																{tag}
															</Text>
														</View>
													))}
												</View>
											)}
										</View>

										<Pressable
											className='items-center justify-center w-9 h-9 rounded-full bg-white'
											hitSlop={8}
											accessibilityLabel={`${displayName} 미리 듣기`}
											accessibilityRole='button'
											onPress={() => {
												Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
												handlePreview(voice);
											}}
											disabled={!!previewingId}
										>
											{previewingId === voice.voice_id ? (
												<ActivityIndicator size='small' color='#3B82F6' />
											) : (
												<Ionicons name='play' size={15} color='#3B82F6' />
											)}
										</Pressable>
									</View>
								</Pressable>
							);
						})}
					</View>
				)}
			</ScrollView>
		</Screen>
	);
}
