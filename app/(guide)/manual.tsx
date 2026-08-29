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
import { Screen } from '../../src/components/layout/Screen';
import * as Haptics from 'expo-haptics';
import { store } from '../../src/store';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { cn } from '@/src/lib/cn';
import { colors } from '@/src/constants/colors';

export default function ManualScreen() {
	const router = useRouter();
	const titleRef = useRef('');
	const artistRef = useRef('');
	const yearRef = useRef('');
	const captionRef = useRef('');
	const artistInputRef = useRef<TextInput>(null);
	const yearInputRef = useRef<TextInput>(null);
	const captionInputRef = useRef<TextInput>(null);
	const [titleError, setTitleError] = useState(false);
	const [artistError, setArtistError] = useState(false);

	const setStoreValues = (title: string, artist: string) => {
		store.inputMode = 'manual';
		store.manualTitle = title;
		store.manualArtist = artist;
		const year = yearRef.current.trim();
		const parts = [`작품명: ${title}`, `작가명: ${artist}`];
		if (year) parts.push(`제작 연도: ${year}`);
		store.extractedText = parts.join('\n');
	};

	const handleSubmit = () => {
		const titleMissing = !titleRef.current.trim();
		const artistMissing = !artistRef.current.trim();
		setTitleError(titleMissing);
		setArtistError(artistMissing);
		if (titleMissing || artistMissing) return;
		const title = titleRef.current.trim();
		const artist = artistRef.current.trim();
		setStoreValues(title, artist);
		store.artworkDescription = '';
		store.isArtistIntro = false;
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		router.push('/description');
	};

	const handleDirectChat = () => {
		const titleMissing = !titleRef.current.trim();
		const artistMissing = !artistRef.current.trim();
		setTitleError(titleMissing);
		setArtistError(artistMissing);
		if (titleMissing || artistMissing) return;
		const title = titleRef.current.trim();
		const artist = artistRef.current.trim();
		setStoreValues(title, artist);
		store.artworkDescription = captionRef.current.trim();
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
								<TextInput
									className={cn(
										'rounded-lg px-4 border text-base h-[52px] pt-0 pb-0 text-on-dark leading-none font-pretendard-regular bg-gray900',
										titleError ? 'border-error' : 'border-divider-dark',
									)}
									textAlignVertical="center"
									placeholder="예) 별이 빛나는 밤"
									placeholderTextColor={colors.gray700}
									accessibilityLabel="작품명"
									onChangeText={(t) => {
										titleRef.current = t;
										if (titleError) setTitleError(false);
									}}
									onSubmitEditing={() => artistInputRef.current?.focus()}
									returnKeyType="next"
									autoFocus
								/>
								{titleError && (
									<Text className="text-xs mt-1.5 font-pretendard-regular text-error">
										작품명을 입력해 주세요
									</Text>
								)}
							</View>

							<View className="mb-5">
								<Text className="text-xs mb-2 font-pretendard-semibold text-gray500 tracking-wider">
									작가명
								</Text>
								<TextInput
									ref={artistInputRef}
									className={cn(
										'rounded-lg px-4 border text-base bg-gray900 h-[52px] py-0 font-pretendard-regular text-on-dark',
										artistError ? 'border-error' : 'border-divider-dark',
									)}
									placeholder="예) 빈센트 반 고흐"
									placeholderTextColor={colors.gray700}
									accessibilityLabel="작가명"
									onChangeText={(t) => {
										artistRef.current = t;
										if (artistError) setArtistError(false);
									}}
									returnKeyType="next"
									onSubmitEditing={() => yearInputRef.current?.focus()}
									style={{ lineHeight: 0 }}
								/>
								{artistError && (
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
								<TextInput
									ref={yearInputRef}
									className="rounded-lg px-4 border border-divider-dark text-base bg-gray900 h-[52px] py-0 font-pretendard-regular text-on-dark"
									placeholder="예) 1889"
									placeholderTextColor={colors.gray700}
									accessibilityLabel="제작 연도 (선택)"
									onChangeText={(t) => {
										yearRef.current = t;
									}}
									returnKeyType="next"
									onSubmitEditing={() => captionInputRef.current?.focus()}
									keyboardType="number-pad"
									style={{ lineHeight: 0 }}
								/>
							</View>

							<View className="mb-5">
								<View className="flex-row items-center gap-1.5 mb-2">
									<Text className="text-xs font-pretendard-semibold text-gray500 tracking-wider">
										캡션 / 메모
									</Text>
									<Text className="text-xs font-pretendard-regular text-gray700">(선택)</Text>
								</View>
								<TextInput
									ref={captionInputRef}
									className="rounded-lg px-4 py-3 border border-divider-dark text-[15px] bg-gray900 font-pretendard-regular text-on-dark"
									placeholder="전시장 캡션이나 메모를 입력하면 더 정확하게 질문할 수 있어요"
									placeholderTextColor={colors.gray700}
									accessibilityLabel="캡션 또는 메모 (선택)"
									onChangeText={(t) => {
										captionRef.current = t;
									}}
									multiline
									numberOfLines={3}
									textAlignVertical="top"
									style={{ minHeight: 80 }}
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
