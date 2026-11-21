import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CardRow } from '@/src/components/mypage/CardRow';
import { DESCRIPTION_LENGTH_OPTIONS, FONT_SIZE_OPTIONS, SPEED_OPTIONS } from '@/src/data/mypage';
import type { Voice } from '@/src/hooks/useTTS';
import { cn } from '@/src/lib/cn';
import { useSettingsStore } from '@/src/store/settingsStore';
import { fetchVoices } from '@/src/utils/api';

export interface NarrationSettingsFieldsProps {
	/** 'light' = 카드형(마이페이지), 'dark' = 바텀시트형(해설 생성 화면) */
	theme?: 'light' | 'dark';
}

export function NarrationSettingsFields({ theme = 'light' }: NarrationSettingsFieldsProps) {
	const { t } = useTranslation();

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

	const lengthOptions = useMemo(
		() => DESCRIPTION_LENGTH_OPTIONS.map(({ value, labelKey }) => ({ value, label: t(labelKey) })),
		[t],
	);
	const fontSizeOptions = useMemo(
		() => FONT_SIZE_OPTIONS.map(({ value, labelKey }) => ({ value, label: t(labelKey) })),
		[t],
	);

	const speedLabel = t('narration.speed');
	const lengthLabel = t('narration.length');
	const voiceRowLabel = t('narration.voice');
	const focusRowLabel = t('narration.focus');
	const fontSizeLabel = t('narration.font_size');

	const voiceLabel = currentVoiceName ? currentVoiceName.split(' - ')[0] : '';
	const focusLabel =
		descriptionFocus.length > 0
			? t('narration.focus_count', { count: descriptionFocus.length })
			: t('narration.focus_none');

	if (theme === 'dark') {
		return (
			<View className="gap-5">
				<View className="flex-row items-center justify-between">
					<Text className="text-sm font-pretendard-medium text-on-dark">{speedLabel}</Text>
					<SettingPills options={SPEED_OPTIONS} value={voiceSpeed} onPress={setVoiceSpeed} />
				</View>
				<View className="flex-row items-center justify-between">
					<Text className="text-sm font-pretendard-medium text-on-dark">{lengthLabel}</Text>
					<SettingPills
						options={lengthOptions}
						value={descriptionLength}
						onPress={setDescriptionLength}
					/>
				</View>
				<Pressable
					className="flex-row items-center justify-between"
					onPress={() => router.push('/settings/voice')}
					accessibilityLabel={voiceRowLabel}
					accessibilityRole="button"
					style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
				>
					<Text className="text-sm font-pretendard-medium text-on-dark">{voiceRowLabel}</Text>
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
					accessibilityLabel={focusRowLabel}
					accessibilityRole="button"
					style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
				>
					<Text className="text-sm font-pretendard-medium text-on-dark">{focusRowLabel}</Text>
					<View className="flex-row items-center gap-1.5">
						<Text className="text-sm font-pretendard-regular text-gray600">{focusLabel}</Text>
						<Ionicons name="chevron-forward" size={16} className="text-gray700" />
					</View>
				</Pressable>
				<View className="flex-row items-center justify-between">
					<Text className="text-sm font-pretendard-medium text-on-dark">{fontSizeLabel}</Text>
					<SettingPills options={fontSizeOptions} value={fontSize} onPress={setFontSize} />
				</View>
			</View>
		);
	}

	return (
		<View>
			<CardRow label={speedLabel} className="py-3.5">
				<SettingPills options={SPEED_OPTIONS} value={voiceSpeed} onPress={setVoiceSpeed} />
			</CardRow>
			<CardRow label={lengthLabel} className="py-3.5">
				<SettingPills
					options={lengthOptions}
					value={descriptionLength}
					onPress={setDescriptionLength}
				/>
			</CardRow>
			<CardRow
				label={voiceRowLabel}
				value={voiceLabel || undefined}
				onPress={() => router.push('/settings/voice')}
			/>
			<CardRow label={focusRowLabel} onPress={() => router.push('/settings/description')} />
			<CardRow label={fontSizeLabel} className="py-3.5">
				<SettingPills options={fontSizeOptions} value={fontSize} onPress={setFontSize} />
			</CardRow>
		</View>
	);
}

interface SettingPillsProps<T extends string | number> {
	options: { value: T; label: string }[];
	value: T;
	onPress: (v: T) => void;
}

function SettingPills<T extends string | number>({
	options,
	value,
	onPress,
}: SettingPillsProps<T>) {
	return (
		<View className="shrink-0 flex-row items-center gap-1.5">
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
							'px-2 py-1.5 rounded-full',
							selected ? 'bg-brand border-2 border-brand' : 'border border-[rgba(28,25,23,0.15)]',
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
