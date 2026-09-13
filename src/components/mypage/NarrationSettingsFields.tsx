import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CardRow } from '@/src/components/mypage/CardRow';
import { SettingsCard } from '@/src/components/mypage/SettingsCard';
import { DESCRIPTION_LENGTH_OPTIONS, FONT_SIZE_OPTIONS, SPEED_OPTIONS } from '@/src/data/mypage';
import type { Voice } from '@/src/hooks/useTTS';
import { cn } from '@/src/lib/cn';
import { useSettingsStore } from '@/src/store/settingsStore';
import { fetchVoices } from '@/src/utils/api';

export interface NarrationSettingsFieldsProps {
	/** 'light' = 카드형(마이페이지), 'dark' = 바텀시트형(해설 생성 화면) */
	theme?: 'light' | 'dark';
}

const LABEL_SPEED = '해설 재생 속도';
const LABEL_LENGTH = '해설 길이';
const LABEL_VOICE = '해설 음성 선택';
const LABEL_FOCUS = '해설 강화 항목';
const LABEL_FONT_SIZE = '해설 텍스트 크기';

export function NarrationSettingsFields({ theme = 'light' }: NarrationSettingsFieldsProps) {
	const router = useRouter();
	const {
		voiceId,
		voiceSpeed,
		setVoiceSpeed,
		fontSize,
		setFontSize,
		descriptionLength,
		setDescriptionLength,
		descriptionFocus,
	} = useSettingsStore();

	const [currentVoiceName, setCurrentVoiceName] = useState('');

	useEffect(() => {
		fetchVoices()
			.then((voices) => {
				const found = voices.find((v: Voice) => v.voice_id === voiceId);
				if (found) setCurrentVoiceName(found.name);
			})
			.catch(console.error);
	}, [voiceId]);

	const voiceLabel = currentVoiceName ? currentVoiceName.split(' - ')[0] : '';
	const focusLabel = descriptionFocus.length > 0 ? `${descriptionFocus.length}개 선택` : '선택 안 함';

	if (theme === 'dark') {
		return (
			<View className="gap-5">
				<View className="flex-row items-center justify-between">
					<Text className="text-sm font-pretendard-medium text-on-dark">{LABEL_SPEED}</Text>
					<SettingPills options={SPEED_OPTIONS} value={voiceSpeed} onPress={setVoiceSpeed} />
				</View>
				<View className="flex-row items-center justify-between">
					<Text className="text-sm font-pretendard-medium text-on-dark">{LABEL_LENGTH}</Text>
					<SettingPills
						options={DESCRIPTION_LENGTH_OPTIONS}
						value={descriptionLength}
						onPress={setDescriptionLength}
					/>
				</View>
				<Pressable
					className="flex-row items-center justify-between"
					onPress={() => router.push('/settings/voice')}
					accessibilityLabel={LABEL_VOICE}
					accessibilityRole="button"
					style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
				>
					<Text className="text-sm font-pretendard-medium text-on-dark">{LABEL_VOICE}</Text>
					<View className="flex-row items-center gap-1.5">
						<Text className="text-sm font-pretendard-regular text-gray600" numberOfLines={1}>
							{voiceLabel}
						</Text>
						<Ionicons name="chevron-forward" size={16} className="text-gray700" />
					</View>
				</Pressable>
				<Pressable
					className="flex-row items-center justify-between"
					onPress={() => router.push('/settings/description')}
					accessibilityLabel={LABEL_FOCUS}
					accessibilityRole="button"
					style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
				>
					<Text className="text-sm font-pretendard-medium text-on-dark">{LABEL_FOCUS}</Text>
					<View className="flex-row items-center gap-1.5">
						<Text className="text-sm font-pretendard-regular text-gray600">{focusLabel}</Text>
						<Ionicons name="chevron-forward" size={16} className="text-gray700" />
					</View>
				</Pressable>
				<View className="flex-row items-center justify-between">
					<Text className="text-sm font-pretendard-medium text-on-dark">{LABEL_FONT_SIZE}</Text>
					<SettingPills options={FONT_SIZE_OPTIONS} value={fontSize} onPress={setFontSize} />
				</View>
			</View>
		);
	}

	return (
		<SettingsCard>
			<CardRow label={LABEL_SPEED} className="py-3.5">
				<SettingPills options={SPEED_OPTIONS} value={voiceSpeed} onPress={setVoiceSpeed} />
			</CardRow>
			<CardRow label={LABEL_LENGTH} className="py-3.5">
				<SettingPills
					options={DESCRIPTION_LENGTH_OPTIONS}
					value={descriptionLength}
					onPress={setDescriptionLength}
				/>
			</CardRow>
			<CardRow label={LABEL_VOICE} value={voiceLabel || undefined} onPress={() => router.push('/settings/voice')} />
			<CardRow label={LABEL_FOCUS} onPress={() => router.push('/settings/description')} />
			<CardRow label={LABEL_FONT_SIZE} className="py-3.5">
				<SettingPills options={FONT_SIZE_OPTIONS} value={fontSize} onPress={setFontSize} />
			</CardRow>
		</SettingsCard>
	);
}

interface SettingPillsProps<T extends string | number> {
	options: { value: T; label: string }[];
	value: T;
	onPress: (v: T) => void;
}

function SettingPills<T extends string | number>({ options, value, onPress }: SettingPillsProps<T>) {
	return (
		<View className="flex-row gap-1.5 items-center absolute right-0">
			{options.map((opt) => {
				const selected = value === opt.value;
				return (
					<Pressable
						key={String(opt.value)}
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							onPress(opt.value);
						}}
						accessibilityRole="button"
						accessibilityState={{ selected }}
						accessibilityLabel={String(opt.label)}
						style={({ pressed }) => ({
							transform: [{ scale: pressed ? 0.93 : 1 }],
						})}
						className={cn(
							'px-3 py-1.5 rounded-full',
							selected
								? 'bg-primary-dark border-2 border-primary-dark'
								: 'border border-[rgba(28,25,23,0.15)]',
						)}
					>
						<Text
							className={cn(
								'text-[12px]',
								selected
									? 'font-pretendard-medium text-white'
									: 'font-pretendard-regular text-gray500',
							)}
						>
							{opt.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}
