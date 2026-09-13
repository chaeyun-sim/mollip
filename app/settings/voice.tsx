import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { VoiceListSkeletonItem } from '@/src/components/settings/VoiceListSkeletonItem';
import { Screen } from '@/src/components/layout/Screen';
import type { Voice } from '@/src/hooks/useTTS';
import { useSettingsStore } from '@/src/store/settingsStore';
import { fetchTTSBlob, fetchVoices } from '@/src/utils/api';
import { colors } from '@/src/constants/colors';
import { cn } from '@/src/lib/cn';

const AVATAR_COLORS = ['#F3D9C4', '#CFE0DF', '#E8D9F0', '#D9E3F0', '#F0DDD9', '#DDEAD1'];

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

// ElevenLabs의 영문 descriptive 라벨 → 자연스러운 한국어 형용사
const DESCRIPTIVE_LABEL_KO: Record<string, string> = {
	relaxed: '편안한',
	formal: '신뢰감 있는',
	neutral: '평온한',
	soft: '부드러운',
	calm: '안정적인',
	gentle: '다정한',
	meditative: '나지막한',
	deep: '낮은',
	upbeat: '활기찬',
};

// ElevenLabs 라이브러리 메타데이터의 성별 라벨이 실제와 다른 음성을 표시명 기준으로 보정한다.
const GENDER_OVERRIDE: Record<string, string> = {
	Soo: 'female',
};

function avatarColor(name: string) {
	const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
	return AVATAR_COLORS[idx];
}

interface VoiceDescription {
	/** "목소리" 바로 앞의 강조 키워드 (예: "편안한") */
	keyword: string;
	/** 키워드 앞에 붙는 나이/성별 문구 (예: "중년 남성의 ") */
	prefix: string;
}

// 나이/성별/특징 키워드를 풀어서 자연스러운 한 문장으로 조합
function voiceDescription(voice: Voice): VoiceDescription | null {
	const displayName = voice.name.split(' - ')[0];
	const gender = GENDER_OVERRIDE[displayName] ?? voice.labels?.gender;
	const age = voice.labels?.age;
	const descriptive = voice.labels?.descriptive;

	const personLabel = [age && AGE_LABEL[age], gender && GENDER_LABEL[gender]]
		.filter(Boolean)
		.join(' ');
	const descriptiveLabel = descriptive
		? (DESCRIPTIVE_LABEL_KO[descriptive.toLowerCase()] ?? descriptive)
		: '';

	if (!personLabel && !descriptiveLabel) return null;
	if (descriptiveLabel)
		return { keyword: descriptiveLabel, prefix: personLabel ? `${personLabel}의 ` : '' };
	return { keyword: personLabel, prefix: '' };
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
			Alert.alert('미리 듣기 실패', '잠시 후 다시 시도해 주세요.');
		} finally {
			setPreviewingId(null);
		}
	};

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Left>
					<Screen.Header.Back onPress={() => router.back()} />
				</Screen.Header.Left>
				<Screen.Header.Center>음성 선택</Screen.Header.Center>
				<Screen.Header.Right />
			</Screen.Header>

			<ScrollView
				className="flex-1"
				contentContainerClassName="pt-1 pb-12"
				showsVerticalScrollIndicator={false}
			>
				<Text className="text-gray-400 text-[13px] font-pretendard-regular mb-5 leading-[19px]">
					해설을 읽어줄 목소리를 골라보세요. 재생 버튼으로 미리 들을 수 있어요.
				</Text>

				{voicesLoading ? (
					<View className="gap-2.5">
						{[0, 1, 2, 3].map((i) => (
							<VoiceListSkeletonItem key={i} />
						))}
					</View>
				) : voices.length === 0 ? (
					<Text className="text-gray-400 text-[13px] font-pretendard-regular">
						불러올 수 있는 음성이 없어요
					</Text>
				) : (
					<View className="gap-2.5">
						{voices.map((voice) => {
							const selected = voiceId === voice.voice_id;
							const displayName = voice.name.split(' - ')[0];
							const description = voiceDescription(voice);
							return (
								<Pressable
									key={voice.voice_id}
									className={cn('rounded-[22px] py-3.5', selected && 'bg-primary/5')}
									style={({ pressed }) => ({
										transform: [{ scale: pressed ? 0.98 : 1 }],
										backgroundColor: !selected && pressed ? colors.bgTonal : undefined,
									})}
									accessibilityRole="radio"
									accessibilityState={{ checked: selected }}
									accessibilityLabel={displayName}
									onPress={() => {
										Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
										setVoiceId(voice.voice_id);
									}}
								>
									<View className="flex-row items-center gap-3">
										<View className="relative">
											<View
												className="w-11 h-11 rounded-full items-center justify-center"
												style={{ backgroundColor: avatarColor(displayName) }}
											>
												<Text className="font-pretendard-bold text-[15px] text-gray900">
													{displayName.charAt(0)}
												</Text>
											</View>
											{selected && (
												<View
													className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary items-center justify-center"
													style={{
														shadowColor: '#fff',
														shadowOffset: { width: 0, height: 0 },
														shadowOpacity: 1,
														shadowRadius: 2,
													}}
												>
													<Ionicons name="checkmark" size={10} className="text-white" />
												</View>
											)}
										</View>

										<View className="flex-1">
											<View className="flex-row items-center gap-1.5">
												<Text className="text-[15px] font-pretendard-semibold text-gray-900">
													{displayName}
												</Text>
											</View>
											{description && (
												<Text className="text-[12px] font-pretendard-regular text-gray-500 mt-1">
													{description.prefix}
													<Text className="text-primary">{description.keyword}</Text>
													{' 목소리'}
												</Text>
											)}
										</View>

										<Pressable
											className="items-center justify-center w-9 h-9 rounded-full bg-white"
											hitSlop={8}
											accessibilityLabel={`${displayName} 미리 듣기`}
											accessibilityRole="button"
											onPress={() => {
												Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
												handlePreview(voice);
											}}
											disabled={!!previewingId}
										>
											{previewingId === voice.voice_id ? (
												<ActivityIndicator size="small" color={colors.primaryDark} />
											) : (
												<Ionicons name="play" size={15} className="text-primary-dark" />
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
