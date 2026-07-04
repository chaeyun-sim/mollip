import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	Alert,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
	ActivityIndicator,
} from 'react-native';
import { Screen } from '../../src/components/layout/Screen';
import * as Haptics from 'expo-haptics';
import { store } from '../../src/store';
import { useChatStore } from '../../src/store/chatStore';
import { useImmersiveStore } from '../../src/store/immersiveStore';
import { ScreenHeader } from '@/src/components/layout/ScreenHeader';
import { searchWikiArtworks, type WikiArtwork } from '../../src/api/wikidata';

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
	const clearChat = useChatStore((s) => s.clear);
	const bottomSheetRef = useRef<BottomSheetModal>(null);
	const pendingCameraRef = useRef<boolean>(false);
	const isImmersive = useImmersiveStore((s) => s.isImmersiveMode);
	const exitImmersive = useImmersiveStore((s) => s.exit);

	const [isLoading, setIsLoading] = useState(false);

	// Wikidata 검색 상태 (몰입 모드 전용)
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<WikiArtwork[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
		store.manualArtist = '';
		store.artworkImageUrl = artwork.imageUrl ?? '';
		store.artworkDescription = '';
		store.inputMode = 'manual';
		clearChat();
		// 몰입 모드: replace로 스택 유지 (back 시 immersive 입장 화면으로)
		if (isImmersive) {
			router.replace('/description');
		} else {
			router.push('/description');
		}
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
			Alert.alert('오류', '이미지를 읽을 수 없습니다. 다시 시도해 주세요.');
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
		// 몰입 모드: replace로 스택 유지 (back 시 immersive 입장 화면으로)
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
			<Screen.Header>
				<ScreenHeader.Back
					onPress={() => {
						router.back();
					}}
				/>
			</Screen.Header>

			{/* 상단 타이틀 */}
			{!isImmersive && (
				<View className='mt-3 gap-2'>
					<Text className='text-3xl text-white mb-2 font-pretendard-bold'>
						작품 해설 생성기
					</Text>
					<Text className='text-md leading-6 text-[#78716C]'>
						{`작품 설명을 촬영하거나 사진을 선택하면\nAI가 바로 해설을 만들어드려요`}
					</Text>
				</View>
			)}

			{/* 작품 검색 — 몰입 모드 전용 */}
			{isImmersive && (
				<View className='mt-5'>
					<View
						className='flex-row items-center rounded-2xl px-4 gap-3 bg-[#1C1917] h-[52px]'
						style={{
							borderWidth: StyleSheet.hairlineWidth,
							borderColor: 'rgba(255,255,255,0.1)',
						}}
					>
						<Ionicons name='search' size={18} color='#57534E' />
						<TextInput
							className='flex-1 text-white font-pretendard-regular text-[15px]'
							placeholder='작품명으로 검색 (예: 별이 빛나는 밤)'
							placeholderTextColor='#57534E'
							value={searchQuery}
							onChangeText={setSearchQuery}
							returnKeyType='search'
							clearButtonMode='while-editing'
						/>
						{isSearching && <ActivityIndicator size='small' color='#57534E' />}
					</View>

					{searchResults.length > 0 && (
						<View
							className='mt-2 rounded-2xl overflow-hidden bg-[#1C1917] max-h-[360px] bg-white/8'
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
									<TouchableOpacity
										key={artwork.qId}
										className='flex-row items-center gap-3 px-4 py-3 bg-white/6'
										style={{
											borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
										}}
										onPress={() => handleSelectArtwork(artwork)}
										activeOpacity={0.7}
									>
										{artwork.imageUrl ? (
											<Image
												source={{ uri: artwork.imageUrl }}
												className='rounded-lg w-12 h-12'
												resizeMode='cover'
											/>
										) : (
											<View className='rounded-lg items-center justify-center w-12 h-12 bg-[#292524]'>
												<Ionicons name='image-outline' size={20} color='#57534E' />
											</View>
										)}
										<View className='flex-1'>
											<Text
												className='text-white text-sm font-pretendard-semibold'
												numberOfLines={1}
											>
												{artwork.label}
												{artwork.year ? (
													<Text className='font-pretendard-regular text-[#78716C]'>
														{'  '}
														{artwork.year}
													</Text>
												) : null}
											</Text>
											{artwork.description ? (
												<Text
													className='text-xs mt-0.5 font-pretendard-regular text-[#78716C]'
													numberOfLines={1}
												>
													{artwork.description}
												</Text>
											) : null}
										</View>
										<Ionicons name='chevron-forward' size={16} color='#57534E' />
									</TouchableOpacity>
								))}
							</ScrollView>
						</View>
					)}
				</View>
			)}

			{/* 버튼 영역 */}
			<Screen.BottomAbsolute className='gap-3 px-6 bottom-10'>
				{/* 카메라 — primary */}
				<TouchableOpacity
					className='rounded-2xl overflow-hidden'
					onPress={() => pickAndGo(true)}
					activeOpacity={0.85}
					disabled={isLoading}
					accessibilityLabel='카메라로 촬영'
					accessibilityRole='button'
				>
					<View className='flex-row items-center gap-4 px-6 py-5 bg-[#3B82F6]'>
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
				</TouchableOpacity>

				{/* 갤러리 — secondary */}
				<TouchableOpacity
					className='rounded-2xl overflow-hidden'
					onPress={() => pickAndGo(false)}
					activeOpacity={0.85}
					disabled={isLoading}
					accessibilityLabel='갤러리에서 선택'
					accessibilityRole='button'
				>
					<View
						className='flex-row items-center gap-4 px-6 py-5 bg-[#1C1917] bg-white/8'
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
							<Text className='text-xs mt-0.5 font-pretendard-regular text-[#78716C]'>
								저장된 사진을 불러오세요
							</Text>
						</View>
						<Ionicons name='chevron-forward' size={18} color='#57534E' />
					</View>
				</TouchableOpacity>

				{/* 직접 입력 — ghost */}
				<TouchableOpacity
					className='flex-row items-center justify-center gap-2 py-4'
					onPress={() => router.push('/manual')}
					activeOpacity={0.6}
					disabled={isLoading}
					accessibilityLabel='작품명 직접 입력'
					accessibilityRole='button'
				>
					<Ionicons name='pencil-outline' size={15} color='#78716C' />
					<Text className='text-sm text-[#78716C]'>작품명 직접 입력</Text>
				</TouchableOpacity>
			</Screen.BottomAbsolute>

			{/* 예시 바텀시트 */}
			<BottomSheetModal
				ref={bottomSheetRef}
				snapPoints={['60%']}
				enablePanDownToClose
				backgroundStyle={{ backgroundColor: '#1C1917' }}
				handleIndicatorStyle={{ backgroundColor: '#57534E' }}
			>
				<BottomSheetView className='px-6 pb-10'>
					<Text className='text-lg text-white mt-2 mb-1 font-pretendard-bold'>
						이렇게 찍어보세요
					</Text>
					<Text className='text-sm mb-5 font-pretendard-regular text-[#78716C]'>
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
								<Text className='text-xs text-center font-pretendard-regular text-[#A8A29E]'>
									{ex.caption}
								</Text>
							</View>
						))}
					</ScrollView>

					<TouchableOpacity
						className='w-full py-4 rounded-2xl items-center mb-3 bg-[#3B82F6]'
						onPress={handleConfirm}
						activeOpacity={0.85}
						accessibilityLabel='확인했어요'
						accessibilityRole='button'
					>
						<Text className='text-white text-base font-pretendard-semibold'>
							확인했어요
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						className='items-center py-2'
						onPress={handleDismissForever}
						activeOpacity={0.6}
						accessibilityLabel='다시 보지 않기'
						accessibilityRole='button'
					>
						<Text className='text-sm font-pretendard-regular text-[#57534E]'>다시 보지 않기</Text>
					</TouchableOpacity>
				</BottomSheetView>
			</BottomSheetModal>
		</Screen>
	);
}
