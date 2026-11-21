import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { Screen } from '@/src/components/layout/Screen';
import { SettingsCard } from '@/src/components/mypage';
import { cn } from '@/src/lib/cn';
import { type DescriptionFocus, useSettingsStore } from '@/src/store/settingsStore';

interface FocusOption {
	key: DescriptionFocus;
	labelKey: string;
}

const FOCUS_OPTIONS: FocusOption[] = [
	{ key: 'aesthetics', labelKey: 'narration.focus_aesthetics' },
	{ key: 'art_history', labelKey: 'narration.focus_art_history' },
	{ key: 'artist_life', labelKey: 'narration.focus_artist_life' },
	{ key: 'social_context', labelKey: 'narration.focus_social_context' },
	{ key: 'appreciation', labelKey: 'narration.focus_appreciation' },
	{ key: 'technique', labelKey: 'narration.focus_technique' },
	{ key: 'symbolism', labelKey: 'narration.focus_symbolism' },
	{ key: 'viewer_gaze', labelKey: 'narration.focus_viewer_gaze' },
];

export default function DescriptionSettingsScreen() {
	const { t } = useTranslation();

	const router = useRouter();
	const { descriptionFocus, toggleDescriptionFocus } = useSettingsStore(
		useShallow((s) => ({
			descriptionFocus: s.descriptionFocus,
			toggleDescriptionFocus: s.toggleDescriptionFocus,
		})),
	);

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back onPress={() => router.back()} />
				<Screen.Header.Center>{t('narration.focus')}</Screen.Header.Center>
			</Screen.Header>

			<ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-[60px]">
				<Text className="text-[13px] font-pretendard-regular text-gray600 mt-4 mb-3">
					{t('narration.focus_intro')}
				</Text>

				<View className="mt-2">
					<SettingsCard>
						{FOCUS_OPTIONS.map((option) => {
							const isSelected = descriptionFocus.includes(option.key);

							return (
								<Pressable
									key={option.key}
									onPress={() => toggleDescriptionFocus(option.key)}
									accessibilityRole="checkbox"
									accessibilityLabel={t(option.labelKey)}
									accessibilityState={{ checked: isSelected }}
									style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
								>
									<View className="flex-row items-center py-4 gap-3">
										<View
											className={cn(
												'w-5 h-5 rounded items-center justify-center',
												isSelected ? 'bg-brand' : 'border border-[#D6D3D1] bg-white',
											)}
										>
											{isSelected && <Ionicons name="checkmark" size={13} color="white" />}
										</View>
										<View className="flex-1">
											<Text className="text-[14px] font-pretendard-medium text-gray900">
												{t(option.labelKey)}
											</Text>
										</View>
									</View>
								</Pressable>
							);
						})}
					</SettingsCard>
				</View>
			</ScrollView>
		</Screen>
	);
}
