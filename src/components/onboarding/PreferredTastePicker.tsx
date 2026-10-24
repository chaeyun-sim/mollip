import { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const SECTIONS: { key: keyof PreferredTasteDetails; title: string }[] = [
	{ key: 'moods', title: '선호하는 그림 분위기' },
	{
		key: 'venueScales',
		title: '전시장의 규모',
	},
	{
		key: 'artMovements',
		title: '선호하는 미술사조',
	},
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
	const insets = useSafeAreaInsets();
	const [artistInput, setArtistInput] = useState('');
	const scrollViewRef = useRef<ScrollView>(null);

	useEffect(() => {
		const subscription = Keyboard.addListener('keyboardDidShow', () => {
			requestAnimationFrame(() => scrollViewRef.current?.scrollToEnd({ animated: false }));
		});
		return () => subscription.remove();
	}, []);

	const handleAddArtist = () => {
		const artist = artistInput.trim();
		if (!artist) return;
		onAddArtist(artist);
		setArtistInput('');
	};

	return (
		<View className="flex-1">
			<KeyboardAvoidingView
				className="flex-1"
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<ScrollView
					ref={scrollViewRef}
					className="flex-1"
					contentContainerClassName="gap-7 pt-2"
					contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
					keyboardShouldPersistTaps="handled"
					keyboardDismissMode="interactive"
					showsVerticalScrollIndicator={false}
				>
					<View>
						<Text className="font-pretendard-bold text-[24px] leading-[32px] text-gray900">
							더 잘 맞는 전시를 추천해 드릴게요
						</Text>
						<Text className="mt-2 font-pretendard-regular text-[14px] leading-[21px] text-gray600">
							관심 있는 항목을 골라주세요. 선택은 언제든 바꿀 수 있어요.
						</Text>
					</View>
					{SECTIONS.map(({ key, title }) => (
						<View key={key} className="flex-col gap-3">
							<View className="flex-col gap-1">
								<Text className="font-pretendard-semibold text-base text-gray900">{title}</Text>
							</View>
							<View className="flex-row flex-wrap gap-2">
								{PREFERRED_TASTE_OPTIONS[key].map((option) => (
									<Chip
										key={option.value}
										label={option.label}
										active={value[key].includes(option.value)}
										variant="tonal"
										accessibilityLabel={option.label}
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
								관심 있는 작가
							</Text>
							<Text className="font-pretendard-regular text-[13px] leading-5 text-gray600">
								작가 이름을 추가해 주세요. 전시 정보에서 이름이 확인되면 추천에 반영돼요.
							</Text>
						</View>
						<View className="flex-row items-center gap-2">
							<TextField
								value={artistInput}
								onChangeText={setArtistInput}
								placeholder="예: 이우환"
								accessibilityLabel="관심 작가 이름 입력"
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
								accessibilityLabel="작가 추가"
							>
								추가
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
										accessibilityLabel={`${artist} 작가 취향 제거`}
										disabled={busy}
										onPress={() => onRemoveArtist(artist)}
									/>
								))}
							</View>
						)}
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
			<View className="pt-3">
				<View className="flex-row gap-2 items-center bottom-10">
					<Button
						variant="ghost"
						tone="gray"
						onPress={onReset}
						accessibilityRole="button"
						accessibilityLabel="추가 취향 초기화하기"
						accessibilityState={{ disabled: busy, busy }}
						disabled={busy}
						loading={busy}
						size="large"
						className="min-h-[52px] flex-1 items-center justify-center rounded-[18px] border border-gray300 bg-white px-3"
					>
						<Text className="font-pretendard-semibold text-base text-gray800">초기화</Text>
					</Button>
					<Button
						testID="taste-save"
						accessibilityRole="button"
						accessibilityState={{ disabled: busy, busy }}
						disabled={busy}
						loading={busy}
						onPress={onConfirm}
						accessibilityLabel="강화한 취향 저장하기"
						className="min-h-[52px] flex-1 rounded-[18px]"
						size="large"
					>
						<Text
							numberOfLines={1}
							adjustsFontSizeToFit
							className="font-pretendard-semibold text-base"
						>
							취향 저장하기
						</Text>
					</Button>
				</View>
			</View>
		</View>
	);
}
