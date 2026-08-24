import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	Pressable,
	Alert,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
	ActivityIndicator,
} from 'react-native';
import { Screen } from '../../src/components/layout/Screen';
import * as Haptics from 'expo-haptics';
import { store } from '../../src/store';
import { useChatStore } from '../../src/store/chatStore';
import { useImmersiveStore } from '../../src/store/immersiveStore';
import { useSettingsStore } from '@/src/store/settingsStore';
import { ScreenHeader } from '@/src/components/layout/ScreenHeader';
import { searchWikiArtworks, type WikiArtwork } from '../../src/api/wikidata';
import { PillSelector } from '@/src/components/mypage';
import { FONT_SIZE_OPTIONS, SPEED_OPTIONS } from '@/src/data/mypage';
import { fetchVoices } from '@/src/utils/api';
import type { Voice } from '@/src/hooks/useTTS';
import { colors } from '@/src/constants/colors';

const STORAGE_KEY = 'example_modal_hidden';

const EXAMPLES = [
	{
		image: require('../../assets/images/example/example-1.png'),
		caption: '작품 옆 설명 안내판을 찍어보세요',
	},
	{
		image: require('../../assets/images/example/example-2.png'),
		caption: '작품 전체가 나오도록 찍어도 좋아요',
	},
];

export default function IndexScreen() {
	const router = useRouter();
	const navigation = useNavigation();
	const clearChat = useChatStore((s) => s.clear);
	const bottomSheetRef = useRef<BottomSheetModal>(null);
	const settingsSheetRef = useRef<BottomSheetModal>(null);
	const pendingCameraRef = useRef<boolean>(false);
	const isImmersive = useImmersiveStore((s) => s.isImmersiveMode);
	const { voiceId, voiceSpeed, setVoiceSpeed, fontSize, setFontSize, descriptionFocus } =
		useSettingsStore();
	const [isLoading, setIsLoading] = useState(false);
	const [currentVoiceName, setCurrentVoiceName] = useState('');

	useEffect(() => {
		fetchVoices()
			.then((voices) => {
				const found = voices.find((v: Voice) => v.voice_id === voiceId);
				if (found) setCurrentVoiceName(found.name);
			})
			.catch(console.error);
	}, [voiceId]);

	// Wikidata 검색 상태 (몰입 모드 전용)
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<WikiArtwork[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// 해설 화면 등에서 뒤로가기로 이 화면에 다시 돌아왔을 때 이전 검색어가 남아있지
	// 않도록, 화면이 포커스를 받을 때마다 검색 상태를 초기화한다.
	useEffect(() => {
		const unsubscribe = navigation.addListener('focus', () => {
			setSearchQuery('');
			setSearchResults([]);
		});
		return unsubscribe;
	}, [navigation]);

	useEffect(() => {
		if (!isImmersive || searchQuery.trim().length < 2) {
			setSearchResults([]);
			return;
		}
		if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
		searchTimerRef.current = setTimeout(async () => {
			setIsSearching(true);
			try {
				const results = await searchWikiArtworks(searchQuery.trim());
				setSearchResults(results);
			} catch {
				setSearchResults([]);
			} finally {
				setIsSearching(false);
			}
		}, 500);
		return () => {
			if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
		};
	}, [searchQuery, isImmersive]);

	const handleSelectArtwork = (artwork: WikiArtwork) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		store.manualTitle = artwork.label;
		store.manualArtist = artwork.artist ?? '';
		store.manualYear = artwork.year ?? '';
		store.artworkImageUrl = artwork.imageUrl ?? '';
		store.artworkDescription = '';
		store.inputMode = 'manual';
		clearChat();
		setSearchQuery('');
		setSearchResults([]);
		router.replace('/description');
	};

	const launchPicker = async (useCamera: boolean) => {
		setIsLoading(true);
		const permission = useCamera
			? await ImagePicker.requestCameraPermissionsAsync()
			: await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (!permission.granted) {
			Alert.alert(
				'권한 필요',
				useCamera
					? '카메라를 사용하려면 설정에서 카메라 권한을 허용해 주세요.'
					: '사진을 선택하려면 설정에서 사진 라이브러리 권한을 허용해 주세요.',
			);
			return;
		}

		const result = useCamera
			? await ImagePicker.launchCameraAsync({ quality: 0.8, base64: true })
			: await ImagePicker.launchImageLibraryAsync({
					quality: 0.8,
					mediaTypes: ['images'],
					base64: true,
				});

		if (result.canceled) {
			setIsLoading(false);
			return;
		}

		const asset = result.assets[0];
		if (!asset.base64) {
			Alert.alert('오류', '이미지를 다시 선택해 주세요.');
			setIsLoading(false);
			return;
		}
		store.imageBase64 = asset.base64;
		store.imageMediaType =
			(asset.mimeType as 'image/jpeg' | 'image/png' | 'image/webp') ??
			'image/jpeg';
		store.extractedText = '';
		store.artworkDescription = '';
		clearChat();
		setIsLoading(false);
		if (isImmersive) {
			router.replace('/description');
		} else {
			router.push('/description');
		}
	};

	const pickAndGo = async (useCamera: boolean) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		const hidden = await AsyncStorage.getItem(STORAGE_KEY);
		if (hidden === 'true') {
			launchPicker(useCamera);
			return;
		}
		pendingCameraRef.current = useCamera;
		bottomSheetRef.current?.present();
	};

	const handleConfirm = useCallback(() => {
		bottomSheetRef.current?.dismiss();
		launchPicker(pendingCameraRef.current);
	}, []);

	const handleDismissForever = useCallback(async () => {
		await AsyncStorage.setItem(STORAGE_KEY, 'true');
		bottomSheetRef.current?.dismiss();
		launchPicker(pendingCameraRef.current);
	}, []);

	return (
		<Screen>
			<Stack.Screen options={{ gestureEnabled: !isImmersive }} />
			<Screen.Header>
				{isImmersive ? (
					<>
						<ScreenHeader.Back
							onPress={() => router.back()}
							color='rgba(255,255,255,0.9)'
						/>
						<ScreenHeader.Right>
							<View className='flex-row items-center gap-4'>
								<Pressable
									onPress={() => router.push('/manual')}
									hitSlop={8}
									accessibilityLabel='작품 없이 바로 질문하기'
									accessibilityRole='button'
									style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
								>
									<Ionicons name='chatbubble-outline' size={22} color='rgba(255,255,255,0.9)' />
								</Pressable>
								<Pressable
									onPress={() => settingsSheetRef.current?.present()}
									hitSlop={8}
									accessibilityLabel='해설 생성 설정'
									accessibilityRole='button'
									style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
								>
									<Ionicons name='settings-outline' size={22} color='rgba(255,255,255,0.9)' />
								</Pressable>
							</View>
						</ScreenHeader.Right>
					</>
				) : (
					<>
						<ScreenHeader.Left>
							<ScreenHeader.Back
								onPress={() => router.back()}
								color='rgba(255,255,255,0.9)'
							/>
						</ScreenHeader.Left>
						<ScreenHeader.Right>
							<View className='flex-row items-center gap-4'>
								<Pressable
									onPress={() => router.push('/manual')}
									hitSlop={8}
									accessibilityLabel='작품 없이 바로 질문하기'
									accessibilityRole='button'
									style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
								>
									<Ionicons name='chatbubble-outline' size={20} color='rgba(255,255,255,0.7)' />
								</Pressable>
								<Pressable
									className='flex-row items-center gap-1.5'
									onPress={() => router.push('/(guide)/immersive-start')}
									hitSlop={8}
									accessibilityLabel='몰입 모드로 시작'
									accessibilityRole='button'
									style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
								>
									<Ionicons
										name='headset-outline'
										size={18}
										color='rgba(255,255,255,0.7)'
									/>
									<Text className='text-sm font-pretendard-regular text-white/70'>
										몰입 모드
									</Text>
								</Pressable>
							</View>
						</ScreenHeader.Right>
					</>
				)}
			</Screen.Header>

			{/* 상단 타이틀 */}
			{!isImmersive && (
				<View className='mt-3 gap-2'>
					<Text className='text-3xl text-white mb-2 font-pretendard-bold'>
						작품 해설 생성기
					</Text>
					<Text className='text-md leading-6 text-tertiary'>
						{`작품 설명을 촬영하거나 사진을 선택하면\nAI가 바로 해설을 만들어드려요`}
					</Text>
				</View>
			)}

			{/* 작품 검색 — 몰입 모드 전용 */}
			{isImmersive && (
				<View className='mt-5'>
					<View
						className='flex-row items-center rounded-2xl px-4 gap-3 bg-primary h-[52px] border-white/10'
						style={{
							borderWidth: StyleSheet.hairlineWidth,
						}}
					>
						<Ionicons name='search' size={18} color={colors.secondary} />
						<TextInput
							className='flex-1 text-white font-pretendard-regular text-[16px] pb-0 leading-0'
							placeholder='작품명으로 검색 (예: 별이 빛나는 밤)'
							placeholderTextColor={colors.secondary}
							value={searchQuery}
							onChangeText={setSearchQuery}
							returnKeyType='search'
							clearButtonMode='while-editing'
							keyboardAppearance='dark'
							style={{ lineHeight: 0 }}
						/>
						{isSearching && <ActivityIndicator size='small' color={colors.secondary} />}
					</View>

					{searchResults.length > 0 && (
						<View
							className='mt-2 rounded-2xl overflow-hidden bg-primary max-h-[360px] bg-white/8'
							style={{
								borderWidth: StyleSheet.hairlineWidth,
							}}
						>
							<ScrollView
								scrollEnabled={searchResults.length > 5}
								showsVerticalScrollIndicator={searchResults.length > 5}
								keyboardShouldPersistTaps='handled'
								nestedScrollEnabled
							>
								{searchResults.map((artwork, index) => (
									<Pressable
										key={artwork.qId}
										className='flex-row items-center gap-3 px-4 py-3 bg-white/6'
										style={({ pressed }) => ({
											borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
											opacity: pressed ? 0.7 : 1,
										})}
										onPress={() => handleSelectArtwork(artwork)}
									>
										{artwork.imageUrl ? (
											<Image
												source={{ uri: artwork.imageUrl }}
												className='rounded-lg w-12 h-12'
												resizeMode='cover'
											/>
										) : (
											<View className='rounded-lg items-center justify-center w-12 h-12 bg-divider-dark'>
												<Ionicons name='image-outline' size={20} color={colors.secondary} />
											</View>
										)}
										<View className='flex-1'>
											<Text
												className='text-white text-sm font-pretendard-semibold'
												numberOfLines={1}
											>
												{artwork.label}
												{artwork.year ? (
													<Text className='font-pretendard-regular text-tertiary'>
														{'  '}
														{artwork.year}
													</Text>
												) : null}
											</Text>
											{artwork.description ? (
												<Text
													className='text-xs mt-0.5 font-pretendard-regular text-tertiary'
													numberOfLines={1}
												>
													{artwork.description}
												</Text>
											) : null}
										</View>
										<Ionicons name='chevron-forward' size={16} color={colors.secondary} />
									</Pressable>
								))}
							</ScrollView>
						</View>
					)}
				</View>
			)}

			{/* 버튼 영역 */}
			<Screen.BottomAbsolute className='gap-3 px-6 bottom-10'>
				{/* 카메라 — primary */}
				<Pressable
					className='rounded-2xl overflow-hidden'
					onPress={() => pickAndGo(true)}
					style={({ pressed }) => ({ opacity: isLoading ? 0.4 : pressed ? 0.85 : 1 })}
					disabled={isLoading}
					accessibilityLabel='카메라로 촬영'
					accessibilityRole='button'
				>
					<View className='flex-row items-center gap-4 px-6 py-5 bg-accent'>
						<View className='w-10 h-10 rounded-xl items-center justify-center bg-white/20'>
							<Ionicons name='camera' size={22} color='#fff' />
						</View>
						<View className='flex-1'>
							<Text className='text-white text-base font-pretendard-semibold'>
								카메라로 촬영
							</Text>
							<Text className='text-xs mt-0.5 text-white/60'>
								지금 바로 작품을 찍어보세요
							</Text>
						</View>
						<Ionicons
							name='chevron-forward'
							size={18}
							color='rgba(255,255,255,0.5)'
						/>
					</View>
				</Pressable>

				{/* 갤러리 — secondary */}
				<Pressable
					className='rounded-2xl overflow-hidden'
					onPress={() => pickAndGo(false)}
					style={({ pressed }) => ({ opacity: isLoading ? 0.4 : pressed ? 0.85 : 1 })}
					disabled={isLoading}
					accessibilityLabel='갤러리에서 선택'
					accessibilityRole='button'
				>
					<View
						className='flex-row items-center gap-4 px-6 py-5 bg-primary bg-white/8'
						style={{
							borderWidth: StyleSheet.hairlineWidth,
						}}
					>
						<View className='w-10 h-10 rounded-xl items-center justify-center bg-white/10'>
							<Ionicons name='images' size={22} color='#e8e8e8' />
						</View>
						<View className='flex-1'>
							<Text className='text-base font-pretendard-semibold text-[#e8e8e8]'>
								갤러리에서 선택
							</Text>
							<Text className='text-xs mt-0.5 font-pretendard-regular text-tertiary'>
								저장된 사진을 불러오세요
							</Text>
						</View>
						<Ionicons name='chevron-forward' size={18} color={colors.secondary} />
					</View>
				</Pressable>

				{/* 직접 입력 — ghost */}
				<Pressable
					className='flex-row items-center justify-center gap-2 py-4'
					onPress={() => router.push('/manual')}
					style={({ pressed }) => ({ opacity: isLoading ? 0.4 : pressed ? 0.6 : 1 })}
					disabled={isLoading}
					accessibilityLabel='작품명 직접 입력'
					accessibilityRole='button'
				>
					<Ionicons name='pencil-outline' size={15} color={colors.tertiary} />
					<Text className='text-sm text-tertiary'>작품명 직접 입력</Text>
				</Pressable>
			</Screen.BottomAbsolute>

			{/* 예시 바텀시트 */}
			<BottomSheetModal
				ref={bottomSheetRef}
				snapPoints={['60%']}
				enablePanDownToClose
				backgroundStyle={{ backgroundColor: colors.primary }}
				handleIndicatorStyle={{ backgroundColor: colors.secondary }}
			>
				<BottomSheetView className='px-6 pb-10'>
					<Text className='text-lg text-white mt-2 mb-1 font-pretendard-bold'>
						이렇게 찍어보세요
					</Text>
					<Text className='text-sm mb-5 font-pretendard-regular text-tertiary'>
						작품 옆 설명 안내판이나 작품 전체를 찍으면{'\n'}정확한 해설을 생성해요
					</Text>

					{/* 예시 이미지 가로 스크롤 — 일반 ScrollView로 gesture 충돌 방지 */}
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
						className='mb-6'
					>
						{EXAMPLES.map((ex, i) => (
							<View key={i} className='gap-2 w-[220px]'>
								<Image
									source={ex.image}
									className='rounded-xl w-[220px] h-[160px]'
									resizeMode='cover'
									accessibilityLabel={ex.caption}
								/>
								<Text className='text-xs text-center font-pretendard-regular text-muted'>
									{ex.caption}
								</Text>
							</View>
						))}
					</ScrollView>

					<Pressable
						className='w-full py-4 rounded-2xl items-center mb-3 bg-accent'
						onPress={handleConfirm}
						style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
						accessibilityLabel='확인했어요'
						accessibilityRole='button'
					>
						<Text className='text-white text-base font-pretendard-semibold'>
							확인했어요
						</Text>
					</Pressable>

					<Pressable
						className='items-center py-2'
						onPress={handleDismissForever}
						style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
						accessibilityLabel='다시 보지 않기'
						accessibilityRole='button'
					>
						<Text className='text-sm font-pretendard-regular text-secondary'>
							다시 보지 않기
						</Text>
					</Pressable>
				</BottomSheetView>
			</BottomSheetModal>

			{/* 해설 생성 설정 바텀시트 */}
			<BottomSheetModal
				ref={settingsSheetRef}
				snapPoints={['40%']}
				enablePanDownToClose
				backgroundStyle={{ backgroundColor: colors.primary }}
				handleIndicatorStyle={{ backgroundColor: colors.secondary }}
			>
				<BottomSheetView className='px-6 pb-10'>
					<Text className='text-lg text-white mt-2 mb-6 font-pretendard-bold'>
						해설 생성 설정
					</Text>
					<View className='gap-5'>
						<View className='flex-row items-center justify-between'>
							<Text className='text-sm font-pretendard-medium text-[#E8E8E8]'>재생 속도</Text>
							<PillSelector
								options={SPEED_OPTIONS}
								value={voiceSpeed}
								onChange={setVoiceSpeed}
							/>
						</View>
						<Pressable
							className='flex-row items-center justify-between'
							onPress={() => router.push('/settings/voice')}
							accessibilityLabel='목소리 변경'
							accessibilityRole='button'
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
						>
							<Text className='text-sm font-pretendard-medium text-[#E8E8E8]'>목소리 변경</Text>
							<View className='flex-row items-center gap-1.5'>
								<Text className='text-sm font-pretendard-regular text-tertiary' numberOfLines={1}>
									{currentVoiceName ? currentVoiceName.split(' - ')[0] : ''}
								</Text>
								<Ionicons name='chevron-forward' size={16} color={colors.secondary} />
							</View>
						</Pressable>
						<Pressable
							className='flex-row items-center justify-between'
							onPress={() => router.push('/settings/description')}
							accessibilityLabel='해설 강화 항목'
							accessibilityRole='button'
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
						>
							<Text className='text-sm font-pretendard-medium text-[#E8E8E8]'>강화 항목</Text>
							<View className='flex-row items-center gap-1.5'>
								<Text className='text-sm font-pretendard-regular text-tertiary'>
									{descriptionFocus.length > 0 ? `${descriptionFocus.length}개 선택` : '선택 안 함'}
								</Text>
								<Ionicons name='chevron-forward' size={16} color={colors.secondary} />
							</View>
						</Pressable>
						<View className='flex-row items-center justify-between'>
							<Text className='text-sm font-pretendard-medium text-[#E8E8E8]'>텍스트 크기</Text>
							<PillSelector
								options={FONT_SIZE_OPTIONS}
								value={fontSize}
								onChange={setFontSize}
							/>
						</View>
					</View>
				</BottomSheetView>
			</BottomSheetModal>
		</Screen>
	);
}
