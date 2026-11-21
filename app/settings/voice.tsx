import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Result } from '@/src/components/common/Result';
import { VoiceListSkeletonItem } from '@/src/components/settings/VoiceListSkeletonItem';
import { Screen } from '@/src/components/layout/Screen';
import type { Voice } from '@/src/hooks/useTTS';
import { useSettingsStore } from '@/src/store/settingsStore';
import { fetchTTSBlob, fetchVoices } from '@/src/utils/api';
import { colors } from '@/src/constants/colors';
import { cn } from '@/src/lib/cn';

const AVATAR_COLORS = ['#F3D9C4', '#CFE0DF', '#E8D9F0', '#D9E3F0', '#F0DDD9', '#DDEAD1'];

const GENDER_KEYS: Record<string, string> = {
	male: 'voice.gender_male',
	female: 'voice.gender_female',
	neutral: 'voice.gender_neutral',
};

const AGE_KEYS: Record<string, string> = {
	young: 'voice.age_young',
	middle_aged: 'voice.age_middle_aged',
	old: 'voice.age_old',
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
	/** "목소리"/"voice" 바로 앞의 강조 키워드 (예: "편안한", "relaxed") */
	keyword: string;
	/** 키워드 앞에 붙는 나이/성별 문구 (예: "중년 남성의 ", "Middle-aged male · ") */
	prefix: string;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// 영어는 ElevenLabs 원문 라벨을 그대로 쓰고, 한국어는 자연스러운 형용사로 바꾼다
const localizeDescriptive = (descriptive: string | undefined, isEn: boolean) => {
	if (!descriptive) return '';
	if (isEn) return descriptive.toLowerCase();
	return DESCRIPTIVE_LABEL_KO[descriptive.toLowerCase()] ?? descriptive;
};

// 나이/성별/특징 키워드를 풀어서 자연스러운 한 문장으로 조합
const voiceDescription = (voice: Voice, t: TFunction, isEn: boolean): VoiceDescription | null => {
	const displayName = voice.name.split(' - ')[0];
	const gender = GENDER_OVERRIDE[displayName] ?? voice.labels?.gender;
	const age = voice.labels?.age;
	const descriptive = voice.labels?.descriptive;

	const personLabel = [age && AGE_KEYS[age], gender && GENDER_KEYS[gender]]
		.filter((key): key is string => Boolean(key))
		.map((key) => t(key))
		.join(' ');
	const descriptiveLabel = localizeDescriptive(descriptive, isEn);
	// 영어는 문장 첫 글자만 대문자로 만든다
	const sentenceStart = (text: string) => (isEn ? capitalize(text) : text);

	if (!personLabel && !descriptiveLabel) return null;
	if (!descriptiveLabel) return { keyword: sentenceStart(personLabel), prefix: '' };
	if (!personLabel) return { keyword: sentenceStart(descriptiveLabel), prefix: '' };
	return {
		keyword: descriptiveLabel,
		prefix: t('voice.person_prefix', { person: sentenceStart(personLabel) }),
	};
};

/* ─── 메인 ─── */

export default function VoiceScreen() {
	const { t, i18n } = useTranslation();

	const router = useRouter();
	const { voiceId, voiceSpeed, setVoiceId } = useSettingsStore();

	const [voices, setVoices] = useState<Voice[]>([]);
	const [voicesLoading, setVoicesLoading] = useState(true);
	const [previewingId, setPreviewingId] = useState<string | null>(null);

	const previewPlayer = useAudioPlayer(null);

	const isEn = i18n.language === 'en';

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
				// 해설과 음성이 아직 한국어 전용이라 미리 듣기 문장도 한국어로 둔다
				'안녕하세요! 이 목소리로 해설을 들려드릴게요.',
				voiceSpeed,
			);
			previewPlayer.replace(uri);
			previewPlayer.play();
		} catch {
			Alert.alert(t('voice.preview_failed_title'), t('voice.preview_failed_body'));
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
				<Screen.Header.Center>{t('voice.title')}</Screen.Header.Center>
				<Screen.Header.Right />
			</Screen.Header>

			<ScrollView
				// 스크롤뷰가 바깥 영역을 잘라내므로 스크롤뷰도 화면 끝까지 넓히고 안쪽 여백으로 되돌린다
				className="-mx-6 flex-1"
				contentContainerClassName="px-6 pt-1 pb-12"
				showsVerticalScrollIndicator={false}
			>
				<Text className="text-gray-400 text-[13px] font-pretendard-regular mb-5 leading-[19px]">
					{t('voice.intro')}
				</Text>
				{voicesLoading && (
					<View className="gap-2.5">
						{[0, 1, 2, 3].map((i) => (
							<VoiceListSkeletonItem key={i} />
						))}
					</View>
				)}
				{!voicesLoading && voices.length === 0 && (
					<Result
						icon="mic-off-outline"
						iconSize={32}
						title={t('voice.empty')}
						className="flex-none py-10"
					/>
				)}
				{!voicesLoading && voices.length > 0 && (
					<View className="gap-2.5">
						{voices.map((voice) => {
							const selected = voiceId === voice.voice_id;
							const displayName = voice.name.split(' - ')[0];
							const description = voiceDescription(voice, t, isEn);
							return (
								<Pressable
									key={voice.voice_id}
									// 선택 배경이 화면 끝까지 닿도록 Screen의 px-6만큼 바깥으로 넓히고 안쪽 여백으로 되돌린다
									className={cn('-mx-6 px-6 py-3.5', selected && 'bg-brand/5')}
									style={({ pressed }) => ({
										transform: [{ scale: pressed ? 0.98 : 1 }],
										backgroundColor: !selected && pressed ? colors['bg-tonal'] : undefined,
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
													className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand items-center justify-center shadow-white "
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
													<Text className="text-brand">{description.keyword}</Text>
													{t('voice.voice_suffix')}
												</Text>
											)}
										</View>

										<Pressable
											className="items-center justify-center w-9 h-9 rounded-full bg-white"
											hitSlop={8}
											accessibilityLabel={t('voice.preview_a11y', { name: displayName })}
											accessibilityRole="button"
											onPress={() => {
												Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
												handlePreview(voice);
											}}
											disabled={!!previewingId}
										>
											{previewingId === voice.voice_id ? (
												<ActivityIndicator size="small" color={colors.brand} />
											) : (
												<Ionicons name="play" size={15} className="text-brand" />
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
