import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
	KeyboardAvoidingView,
	Platform,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { Screen } from '../src/components/layout/Screen';
import * as Haptics from 'expo-haptics';
import { store } from '../src/store';
import { useChatStore } from '../src/store/chatStore';
import { ScreenHeader } from '../src/components/layout/ScreenHeader';

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
					<Text
						className='text-[22px] mb-1.5'
						style={{ fontFamily: 'Pretendard-Bold', color: '#fff' }}
					>
						작품 정보 입력
					</Text>
					<Text
						className='text-sm mb-9'
						style={{ fontFamily: 'Pretendard-Regular', color: '#78716C' }}
					>
						작품명과 작가명만 입력하면 해설을 생성합니다
					</Text>

					<View className='mb-5'>
						<Text
							className='text-xs mb-2'
							style={{
								fontFamily: 'Pretendard-SemiBold',
								color: '#A8A29E',
								letterSpacing: 0.5,
							}}
						>
							작품명
						</Text>
						<TextInput
							className='rounded-lg px-4 border text-base h-[52px] pt-0 pb-0 text-[#e8e8e8] leading-none'
							style={{
								fontFamily: 'Pretendard-Regular',
								backgroundColor: '#1C1917',
								borderColor: titleError ? '#EF4444' : '#292524',
							}}
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
							<Text
								className='text-xs mt-1.5'
								style={{ fontFamily: 'Pretendard-Regular', color: '#EF4444' }}
							>
								작품명을 입력해 주세요
							</Text>
						)}
					</View>

					<View className='mb-5'>
						<Text
							className='text-xs mb-2'
							style={{
								fontFamily: 'Pretendard-SemiBold',
								color: '#A8A29E',
								letterSpacing: 0.5,
							}}
						>
							작가명
						</Text>
						<TextInput
							ref={artistInputRef}
							className='rounded-lg px-4 border text-base'
							style={{
								backgroundColor: '#1C1917',
								borderColor: artistError ? '#EF4444' : '#292524',
								height: 52,
								paddingTop: 0,
								paddingBottom: 0,
								fontFamily: 'Pretendard-Regular',
								color: '#e8e8e8',
								textAlignVertical: 'center',
							}}
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
							<Text
								className='text-xs mt-1.5'
								style={{ fontFamily: 'Pretendard-Regular', color: '#EF4444' }}
							>
								작가명을 입력해 주세요
							</Text>
						)}
					</View>

					<Screen.BottomAbsolute>
						<TouchableOpacity
							className='w-full rounded-lg items-center'
							style={{ backgroundColor: '#3B82F6', paddingVertical: 14 }}
							onPress={handleSubmit}
						>
							<Text
								className='text-base'
								style={{ fontFamily: 'Pretendard-SemiBold', color: '#fff' }}
							>
								해설 생성
							</Text>
						</TouchableOpacity>
					</Screen.BottomAbsolute>
				</View>
			</KeyboardAvoidingView>
		</Screen>
	);
}
