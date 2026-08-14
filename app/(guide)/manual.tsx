import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
	Pressable,
	KeyboardAvoidingView,
	Platform,
	Text,
	TextInput,
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
	const artistInputRef = useRef<TextInput>(null);
	const [titleError, setTitleError] = useState(false);
	const [artistError, setArtistError] = useState(false);

	const handleSubmit = () => {
		const titleMissing = !titleRef.current.trim();
		const artistMissing = !artistRef.current.trim();
		setTitleError(titleMissing);
		setArtistError(artistMissing);
		if (titleMissing || artistMissing) return;
		const title = titleRef.current.trim();
		const artist = artistRef.current.trim();
		store.inputMode = 'manual';
		store.manualTitle = title;
		store.manualArtist = artist;
		store.extractedText = `작품명: ${title}\n작가명: ${artist}`;
		store.artworkDescription = '';
		useChatStore.getState().clear();
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		router.push('/description');
	};

	return (
		<Screen>
			<KeyboardAvoidingView
				className='flex-1'
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<ScreenHeader>
					<ScreenHeader.Left>
						<ScreenHeader.Back />
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
							className='rounded-lg px-4 border text-base bg-[#1C1917] h-[52px] py-0 font-pretendard-regular text-[#E8E8E8]'
							placeholder='예) 빈센트 반 고흐'
							placeholderTextColor='#57534E'
							accessibilityLabel='작가명'
							onChangeText={(t) => {
								artistRef.current = t;
								if (artistError) setArtistError(false);
							}}
							returnKeyType='done'
							onSubmitEditing={handleSubmit}
						/>
						{artistError && (
							<Text className='text-xs mt-1.5 font-pretendard-regular text-[#EF4444]'>
								작가명을 입력해 주세요
							</Text>
						)}
					</View>

					<Screen.BottomAbsolute className='bottom-10'>
						<Pressable
							className='w-full rounded-lg items-center bg-[#3B82F6] py-3.5'
							onPress={handleSubmit}
							style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
						>
							<Text className='text-base font-pretendard-semibold text-white'>
								해설 생성
							</Text>
						</Pressable>
					</Screen.BottomAbsolute>
				</View>
			</KeyboardAvoidingView>
		</Screen>
	);
}
