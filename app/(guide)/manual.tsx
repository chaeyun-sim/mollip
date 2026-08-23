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
import { useChatStore } from '../../src/store/chatStore';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { cn } from '@/src/lib/cn';

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
		useChatStore.getState().clear();
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
		useChatStore.getState().clear();
		const sessionId = Date.now().toString();
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		router.push({ pathname: '/chat', params: { sessionId } });
	};

	return (
		<Screen>
			<KeyboardAvoidingView
				className='flex-1'
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
			<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
				<View className='flex-1'>
				<ScreenHeader>
					<ScreenHeader.Left>
						<ScreenHeader.Back color='rgba(255,255,255,0.9)' />
					</ScreenHeader.Left>
				</ScreenHeader>

				<View className='flex-1 pt-4'>
					<Text className='text-[22px] mb-1.5 font-pretendard-bold text-white'>
						작품 정보 입력
					</Text>
					<Text className='text-sm mb-9 font-pretendard-regular text-[#78716C]'>
						작품명과 작가명만 입력하면 해설을 생성합니다
					</Text>

					<View className='mb-5'>
						<Text className='text-xs mb-2 font-pretendard-semibold text-[#A8A29E] tracking-wider'>
							작품명
						</Text>
						<TextInput
							className={cn(
								'rounded-lg px-4 border text-base h-[52px] pt-0 pb-0 text-[#e8e8e8] leading-none font-pretendard-regular bg-[#1C1917]',
								titleError ? 'border-[#EF4444]' : 'border-[#292524]',
							)}
							textAlignVertical='center'
							placeholder='예) 별이 빛나는 밤'
							placeholderTextColor='#57534E'
							accessibilityLabel='작품명'
							onChangeText={(t) => {
								titleRef.current = t;
								if (titleError) setTitleError(false);
							}}
							onSubmitEditing={() => artistInputRef.current?.focus()}
							returnKeyType='next'
							autoFocus
						/>
						{titleError && (
							<Text className='text-xs mt-1.5 font-pretendard-regular text-[#EF4444]'>
								작품명을 입력해 주세요
							</Text>
						)}
					</View>

					<View className='mb-5'>
						<Text className='text-xs mb-2 font-pretendard-semibold text-[#A8A29E] tracking-wider'>
							작가명
						</Text>
						<TextInput
							ref={artistInputRef}
							className={cn(
								'rounded-lg px-4 border text-base bg-[#1C1917] h-[52px] py-0 font-pretendard-regular text-[#E8E8E8]',
								artistError ? 'border-[#EF4444]' : 'border-[#292524]',
							)}
							placeholder='예) 빈센트 반 고흐'
							placeholderTextColor='#57534E'
							accessibilityLabel='작가명'
							onChangeText={(t) => {
								artistRef.current = t;
								if (artistError) setArtistError(false);
							}}
							returnKeyType='next'
							onSubmitEditing={() => yearInputRef.current?.focus()}
							style={{ lineHeight: 0 }}
						/>
						{artistError && (
							<Text className='text-xs mt-1.5 font-pretendard-regular text-[#EF4444]'>
								작가명을 입력해 주세요
							</Text>
						)}
					</View>

					<View className='mb-5'>
						<View className='flex-row items-center gap-1.5 mb-2'>
							<Text className='text-xs font-pretendard-semibold text-[#A8A29E] tracking-wider'>
								제작 연도
							</Text>
							<Text className='text-xs font-pretendard-regular text-[#57534E]'>
								(선택)
							</Text>
						</View>
						<TextInput
							ref={yearInputRef}
							className='rounded-lg px-4 border border-[#292524] text-base bg-[#1C1917] h-[52px] py-0 font-pretendard-regular text-[#E8E8E8]'
							placeholder='예) 1889'
							placeholderTextColor='#57534E'
							accessibilityLabel='제작 연도 (선택)'
							onChangeText={(t) => { yearRef.current = t; }}
							returnKeyType='next'
							onSubmitEditing={() => captionInputRef.current?.focus()}
							keyboardType='number-pad'
							style={{ lineHeight: 0 }}
						/>
					</View>

					<View className='mb-5'>
						<View className='flex-row items-center gap-1.5 mb-2'>
							<Text className='text-xs font-pretendard-semibold text-[#A8A29E] tracking-wider'>
								캡션 / 메모
							</Text>
							<Text className='text-xs font-pretendard-regular text-[#57534E]'>
								(선택)
							</Text>
						</View>
						<TextInput
							ref={captionInputRef}
							className='rounded-lg px-4 py-3 border border-[#292524] text-[15px] bg-[#1C1917] font-pretendard-regular text-[#E8E8E8]'
							placeholder='전시장 캡션이나 메모를 입력하면 더 정확하게 질문할 수 있어요'
							placeholderTextColor='#57534E'
							accessibilityLabel='캡션 또는 메모 (선택)'
							onChangeText={(t) => { captionRef.current = t; }}
							multiline
							numberOfLines={3}
							textAlignVertical='top'
							style={{ minHeight: 80 }}
						/>
					</View>

					<Screen.BottomAbsolute className='bottom-10 gap-y-2.5'>
						<Pressable
							className='w-full rounded-lg items-center bg-[#3B82F6] py-3.5'
							onPress={handleSubmit}
							accessibilityLabel='AI 해설 생성'
							accessibilityRole='button'
							style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
						>
							<Text className='text-base font-pretendard-semibold text-white'>
								해설 생성
							</Text>
						</Pressable>
						<Pressable
							className='w-full rounded-lg items-center border border-[#3B82F6] py-3.5'
							onPress={handleDirectChat}
							accessibilityLabel='해설 없이 채팅으로 바로 이동'
							accessibilityRole='button'
							style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
						>
							<Text className='text-base font-pretendard-semibold text-[#3B82F6]'>
								바로 질문하기
							</Text>
						</Pressable>
					</Screen.BottomAbsolute>
				</View>
				</View>
			</TouchableWithoutFeedback>
			</KeyboardAvoidingView>
		</Screen>
	);
}
