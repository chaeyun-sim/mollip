import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, ScrollView, Text, View } from 'react-native';
import { Button } from '@/src/components/common/Button';
import { Chip } from '@/src/components/common/Chip';
import { TextField } from '@/src/components/common/TextField';
import { PREFERRED_TASTE_OPTIONS, type PreferredTasteDetails } from '@/src/utils/preferredTaste';

interface PreferredTastePickerProps {
	value: PreferredTasteDetails;
	artists: string[];
	busy: boolean;
	onToggle: (group: keyof PreferredTasteDetails, option: string) => void;
	onAddArtist: (artist: string) => void;
	onRemoveArtist: (artist: string) => void;
	onConfirm: () => void;
	onReset: () => void;
}

const SECTIONS: { key: keyof PreferredTasteDetails; titleKey: string }[] = [
	{ key: 'moods', titleKey: 'preferences.section_moods' },
	{ key: 'venueScales', titleKey: 'preferences.section_venue_scales' },
	{ key: 'artMovements', titleKey: 'preferences.section_art_movements' },
];

export function PreferredTastePicker({
	value,
	artists,
	busy,
	onToggle,
	onAddArtist,
	onRemoveArtist,
	onConfirm,
	onReset,
}: PreferredTastePickerProps) {
	const { t, i18n } = useTranslation();

	const [artistInput, setArtistInput] = useState('');
	const scrollViewRef = useRef<ScrollView>(null);

	useEffect(() => {
		// iOS는 입력창이 키보드에 딱 붙을 만큼만 스크롤하므로, 키보드가 올라오기 시작할 때
		// 하단 여백까지 함께 보이도록 끝으로 부드럽게 스크롤한다
		const subscription = Keyboard.addListener('keyboardWillShow', () => {
			scrollViewRef.current?.scrollToEnd({ animated: true });
		});
		return () => subscription.remove();
	}, []);

	const isEn = i18n.language === 'en';
	// 칩 라벨만 번역한다 — 저장 값(option.value)은 언어와 무관하다
	const optionLabel = (label: string) =>
		isEn ? t(`recommendations.labels.${label}`, { defaultValue: label }) : label;

	const handleAddArtist = () => {
		const artist = artistInput.trim();
		if (!artist) return;
		onAddArtist(artist);
		setArtistInput('');
	};

	return (
		<View className="flex-1">
			<ScrollView
				ref={scrollViewRef}
				className="flex-1"
				// 하단 버튼이 bottom-10(40px)만큼 올라와 겹치므로 그만큼 + 여백만 둔다
				contentContainerClassName="gap-7 pt-2 pb-16"
				// iOS: 키보드 애니메이션에 맞춰 inset을 조정하고 포커스된 입력창을 키보드 위로 스크롤한다
				automaticallyAdjustKeyboardInsets
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="interactive"
				showsVerticalScrollIndicator={false}
			>
				<View>
					<Text className="font-pretendard-bold text-[24px] leading-[32px] text-gray900">
						{t('preferences.picker_title')}
					</Text>
					<Text className="mt-2 font-pretendard-regular text-[14px] leading-[21px] text-gray600">
						{t('preferences.picker_body')}
					</Text>
				</View>
				{SECTIONS.map(({ key, titleKey }) => (
					<View key={key} className="flex-col gap-3">
						<View className="flex-col gap-1">
							<Text className="font-pretendard-semibold text-base text-gray900">{t(titleKey)}</Text>
						</View>
						<View className="flex-row flex-wrap gap-2">
							{PREFERRED_TASTE_OPTIONS[key].map((option) => (
								<Chip
									key={option.value}
									label={optionLabel(option.label)}
									active={value[key].includes(option.value)}
									variant="tonal"
									accessibilityLabel={optionLabel(option.label)}
									disabled={busy}
									onPress={() => onToggle(key, option.value)}
								/>
							))}
						</View>
					</View>
				))}
				<View className="flex-col gap-3">
					<View className="flex-col gap-1">
						<Text className="font-pretendard-semibold text-base text-gray900">
							{t('preferences.artists_title')}
						</Text>
						<Text className="font-pretendard-regular text-[13px] leading-5 text-gray600">
							{t('preferences.artists_body')}
						</Text>
					</View>
					<View className="flex-row items-center gap-2">
						<TextField
							value={artistInput}
							onChangeText={setArtistInput}
							placeholder={t('preferences.artist_placeholder')}
							accessibilityLabel={t('preferences.artist_input_a11y')}
							returnKeyType="done"
							submitBehavior="submit"
							onSubmitEditing={handleAddArtist}
							maxLength={60}
							className="flex-1"
							editable={!busy}
						/>
						<Button
							size="medium"
							block={false}
							className="min-h-[52px]"
							disabled={busy || !artistInput.trim()}
							onPress={handleAddArtist}
							accessibilityLabel={t('preferences.add_artist_a11y')}
						>
							{t('preferences.add_artist')}
						</Button>
					</View>
					{artists.length > 0 && (
						<View className="flex-row flex-wrap gap-2">
							{artists.map((artist) => (
								<Chip
									key={artist.toLocaleLowerCase()}
									label={artist}
									active
									variant="tonal"
									accessibilityLabel={t('preferences.remove_artist_a11y', { artist })}
									disabled={busy}
									onPress={() => onRemoveArtist(artist)}
								/>
							))}
						</View>
					)}
				</View>
			</ScrollView>
			<View className="pt-3">
				<View className="flex-row gap-2 items-center bottom-10">
					<Button
						variant="ghost"
						tone="gray"
						onPress={onReset}
						accessibilityRole="button"
						accessibilityLabel={t('preferences.reset_a11y')}
						accessibilityState={{ disabled: busy, busy }}
						disabled={busy}
						loading={busy}
						size="large"
						className="min-h-[52px] flex-1 items-center justify-center rounded-[18px] border border-gray300 bg-white px-3"
					>
						<Text className="font-pretendard-semibold text-base text-gray800">
							{t('onboarding.reset')}
						</Text>
					</Button>
					<Button
						testID="taste-save"
						accessibilityRole="button"
						accessibilityState={{ disabled: busy, busy }}
						disabled={busy}
						loading={busy}
						onPress={onConfirm}
						accessibilityLabel={t('preferences.save_a11y')}
						className="min-h-[52px] flex-1 rounded-[18px]"
						size="large"
					>
						<Text
							numberOfLines={1}
							adjustsFontSizeToFit
							className="font-pretendard-semibold text-base"
						>
							{t('preferences.save')}
						</Text>
					</Button>
				</View>
			</View>
		</View>
	);
}
