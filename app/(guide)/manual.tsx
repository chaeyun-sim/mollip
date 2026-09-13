import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
	Keyboard,
	Pressable,
	KeyboardAvoidingView,
	Platform,
	Text,
	TextInput,
	TouchableWithoutFeedback,
	View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { TextField } from '@/src/components/common/TextField';
import { Screen } from '../../src/components/layout/Screen';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { useTextField } from '@/src/hooks/useTextField';
import { updateStore } from '../../src/store';

export default function ManualScreen() {
	const router = useRouter();
	const title = useTextField();
	const artist = useTextField();

	const [year, setYear] = useState('');
	const [caption, setCaption] = useState('');
	
	const artistInputRef = useRef<TextInput>(null);
	const yearInputRef = useRef<TextInput>(null);
	const captionInputRef = useRef<TextInput>(null);

	const buildManualStorePatch = (titleValue: string, artistValue: string) => {
		const yearValue = year.trim();
		const parts = [`작품명: ${titleValue}`, `작가명: ${artistValue}`];
		if (yearValue) parts.push(`제작 연도: ${yearValue}`);
		return {
			inputMode: 'manual' as const,
			manualTitle: titleValue,
			manualArtist: artistValue,
			extractedText: parts.join('\n'),
		};
	};

	const handleSubmit = () => {
		const titleValue = title.value.trim();
		const artistValue = artist.value.trim();
		const titleMissing = !titleValue;
		const artistMissing = !artistValue;
		title.setError(titleMissing);
		artist.setError(artistMissing);
		if (titleMissing || artistMissing) return;

		updateStore({
			...buildManualStorePatch(titleValue, artistValue),
			artworkDescription: '',
			isArtistIntro: false,
		});
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		router.push('/description');
	};

	const handleDirectChat = () => {
		const titleValue = title.value.trim();
		const artistValue = artist.value.trim();
		const titleMissing = !titleValue;
		const artistMissing = !artistValue;
		title.setError(titleMissing);
		artist.setError(artistMissing);
		if (titleMissing || artistMissing) return;

		updateStore({
			...buildManualStorePatch(titleValue, artistValue),
			artworkDescription: caption.trim(),
		});
		const sessionId = Date.now().toString();
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		router.push({ pathname: '/chat', params: { sessionId } });
	};

	return (
		<Screen>
			<KeyboardAvoidingView
				className="flex-1"
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
					<View className="flex-1">
						<ScreenHeader>
							<ScreenHeader.Left>
								<ScreenHeader.Back color="white-90" />
							</ScreenHeader.Left>
							<ScreenHeader.Right>
								<Pressable
									onPress={handleSubmit}
									hitSlop={8}
									accessibilityLabel="AI 해설 생성"
									accessibilityRole="button"
									className="rounded-full px-3.5 py-1.5 bg-secondary"
									style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
								>
									<Text className="text-[14px] font-pretendard-semibold text-white">해설 생성</Text>
								</Pressable>
							</ScreenHeader.Right>
						</ScreenHeader>

						<View className="flex-1 pt-4">
							<Text className="text-[22px] mb-1.5 font-pretendard-bold text-white">
								작품 정보 입력
							</Text>
							<Text className="text-sm mb-9 font-pretendard-regular text-gray600">
								작품명과 작가명만 입력하면 해설을 생성합니다
							</Text>

							<View className="mb-5">
								<Text className="text-xs mb-2 font-pretendard-semibold text-gray500 tracking-wider">
									작품명
								</Text>
								<TextField
									tone="dark"
									value={title.value}
									error={title.error}
									placeholder="예) 별이 빛나는 밤"
									accessibilityLabel="작품명"
									onChangeText={title.onChangeText}
									onSubmitEditing={() => artistInputRef.current?.focus()}
									returnKeyType="next"
									autoFocus
								/>
								{title.error && (
									<Text className="text-xs mt-1.5 font-pretendard-regular text-error">
										작품명을 입력해 주세요
									</Text>
								)}
							</View>

							<View className="mb-5">
								<Text className="text-xs mb-2 font-pretendard-semibold text-gray500 tracking-wider">
									작가명
								</Text>
								<TextField
									ref={artistInputRef}
									tone="dark"
									value={artist.value}
									error={artist.error}
									placeholder="예) 빈센트 반 고흐"
									accessibilityLabel="작가명"
									onChangeText={artist.onChangeText}
									returnKeyType="next"
									onSubmitEditing={() => yearInputRef.current?.focus()}
								/>
								{artist.error && (
									<Text className="text-xs mt-1.5 font-pretendard-regular text-error">
										작가명을 입력해 주세요
									</Text>
								)}
							</View>

							<View className="mb-5">
								<View className="flex-row items-center gap-1.5 mb-2">
									<Text className="text-xs font-pretendard-semibold text-gray500 tracking-wider">
										제작 연도
									</Text>
									<Text className="text-xs font-pretendard-regular text-gray700">(선택)</Text>
								</View>
								<TextField
									ref={yearInputRef}
									tone="dark"
									value={year}
									placeholder="예) 1889"
									accessibilityLabel="제작 연도 (선택)"
									onChangeText={setYear}
									returnKeyType="next"
									onSubmitEditing={() => captionInputRef.current?.focus()}
									keyboardType="number-pad"
								/>
							</View>

							<View className="mb-5">
								<View className="flex-row items-center gap-1.5 mb-2">
									<Text className="text-xs font-pretendard-semibold text-gray500 tracking-wider">
										캡션 / 메모
									</Text>
									<Text className="text-xs font-pretendard-regular text-gray700">(선택)</Text>
								</View>
								<TextField
									ref={captionInputRef}
									variant="area"
									tone="dark"
									value={caption}
									placeholder="전시장 캡션이나 메모를 입력하면 더 정확하게 질문할 수 있어요"
									accessibilityLabel="캡션 또는 메모 (선택)"
									onChangeText={setCaption}
									numberOfLines={3}
								/>
							</View>

							<Pressable
								className="w-full rounded-lg items-center border border-primary py-3.5 mb-6"
								onPress={handleDirectChat}
								accessibilityLabel="해설 없이 채팅으로 바로 이동"
								accessibilityRole="button"
								style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
							>
								<Text className="text-base font-pretendard-semibold text-primary">
									바로 질문하기
								</Text>
							</Pressable>
						</View>
					</View>
				</TouchableWithoutFeedback>
			</KeyboardAvoidingView>
		</Screen>
	);
}
